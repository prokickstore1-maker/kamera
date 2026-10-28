"use server";

import { db } from "@/db";
import { orders, orderItems, products, settings, paymentMethods } from "@/db/schema";
import { and, eq, inArray, gte, sql, count } from "drizzle-orm";
import {
  buildShippingConfig,
  validatePayload,
  calculateTotals,
  buildSnapshot,
  type CheckoutPayload,
  type CheckoutItem,
} from "@/lib/checkout";
import { orderNumber } from "@/lib/format";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isAdmin } from "@/lib/admin-session";
import { s3Client, s3Env, s3KeyFromUrl } from "@/lib/s3";
import type { PaymentSnapshot } from "@/lib/checkout";

/** Stok per kamera = 1 unit → satu order tidak boleh memborong katalog. */
const MAX_ITEMS_PER_ORDER = 5;

/** Gabungkan productId kembar agar cek stok tidak membaca angka yang sama dua kali. */
function mergeItems(items: { productId: string; qty: number }[]): { productId: string; qty: number }[] {
  const map = new Map<string, number>();
  for (const i of items) {
    const qty = Number.isFinite(i.qty) ? Math.floor(i.qty) : 0;
    if (qty < 1) continue;
    map.set(i.productId, (map.get(i.productId) ?? 0) + qty);
  }
  return [...map].map(([productId, qty]) => ({ productId, qty }));
}

/** Ambil harga & stok TERBARU dari server — payload client tak dipercaya. */
async function loadItems(items: { productId: string; qty: number }[]): Promise<CheckoutItem[]> {
  const ids = items.map((i) => i.productId);
  if (!ids.length) return [];
  const rows = await db
    .select({ productId: products.id, price: products.priceIdr, stock: products.stock, name: products.name, active: products.active })
    .from(products)
    .where(inArray(products.id, ids));
  const map = new Map(rows.map((r) => [r.productId, r]));
  return items.map((i) => {
    const p = map.get(i.productId);
    if (!p || !p.active) throw new Error(`Produk tidak tersedia.`);
    if (p.stock < i.qty) throw new Error(`Stok ${p.name} tinggal ${p.stock}.`);
    return { productId: i.productId, price: p.price, qty: i.qty, name: p.name };
  });
}

export type CheckoutInput = {
  payload: CheckoutPayload;
  items: { productId: string; qty: number }[];
  paymentMethodId: string;
  idempotencyKey: string;
};

export type CheckoutResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

async function loadSettings(): Promise<Record<string, string>> {
  const rows = await db.select({ key: settings.key, value: settings.value }).from(settings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

async function telegram(text: string, photoUrl?: string) {  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return; // fire-and-forget, tidak memblokir
  try {
    const base = `https://api.telegram.org/bot${token}`;
    if (photoUrl) {
      const fd = new FormData();
      fd.set("chat_id", chatId);
      fd.set("photo", photoUrl);
      fd.set("caption", text.slice(0, 1024));
      await fetch(`${base}/sendPhoto`, {
        method: "POST",
        body: fd,
        keepalive: true,
      }).catch(() => undefined);
    } else {
      await fetch(`${base}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
        keepalive: true,
      }).catch(() => undefined);
    }
  } catch {
    /* non-blocking */
  }
}

export async function createOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const errs = validatePayload(input.payload);
  if (errs.length) return { ok: false, error: errs.join(" ") };

  // Stok kamera vintage = 1 unit. Satu orang tak boleh memborong katalog lewat order palsu.
  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, error: "Keranjang kosong." };
  }
  const merged = mergeItems(input.items);
  if (merged.length === 0) return { ok: false, error: "Keranjang kosong." };
  if (merged.length > MAX_ITEMS_PER_ORDER) {
    return { ok: false, error: `Maksimal ${MAX_ITEMS_PER_ORDER} kamera per pesanan.` };
  }
  // idempotensi: key sudah pernah → order lama dikembalikan SEBELUM rate limit
  // agar retry jaringan tidak memotong kuota.
  try {
    const [existing] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.idempotencyKey, input.idempotencyKey))
      .limit(1);
    if (existing) return { ok: true, orderId: existing.id };
  } catch {
    /* fall through ke jalur rate limit */
  }

  const ip = await clientIp();
  const rl = rateLimit("checkout", ip, 5, 15 * 60_000);
  if (!rl.ok) {
    return { ok: false, error: `Terlalu banyak pesanan. Coba lagi dalam ${Math.ceil(rl.retryAfter / 60)} menit.` };
  }

  try {
    const s = await loadSettings();
    const cfg = buildShippingConfig(s);

    const items = await loadItems(merged);
    const totals = calculateTotals(
      items,
      input.payload.province,
      cfg,
    );
    if (!totals.ok) return { ok: false, error: totals.error ?? "Gagal menghitung total." };

    const [pm] = await db
      .select()
      .from(paymentMethods)
      .where(and(eq(paymentMethods.id, input.paymentMethodId), eq(paymentMethods.isActive, true)))
      .limit(1);
    if (!pm) return { ok: false, error: "Metode pembayaran tidak valid." };

    const snapshot: PaymentSnapshot = buildSnapshot(pm);
    const hours = Number(s.auto_cancel_hours ?? 2);
    const expiresAt = new Date(Date.now() + Math.max(1, hours) * 3600_000);

    const created = await db.transaction(async (tx) => {
      // kunci baris stok
      const locked = await tx
        .select({ id: products.id, stock: products.stock, price: products.priceIdr, name: products.name, active: products.active })
        .from(products)
        .where(inArray(products.id, items.map((i) => i.productId)))
        .for("update");
      const lmap = new Map(locked.map((r) => [r.id, r]));
      for (const i of items) {
        const p = lmap.get(i.productId);
        if (!p || !p.active) throw new Error("Produk tidak tersedia.");
        if (p.stock < i.qty) throw new Error(`Stok ${p.name} tinggal ${p.stock}.`);
        i.price = p.price; // harga server saat transaksi
      }
      const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);

      // penomoran per hari — advisory lock serialisasi transaksi yang membuat
      // order pada hari yang sama sehingga count() tidak balapan (H-2).
      const dayStart = new Date(new Date().setHours(0, 0, 0, 0));
      await tx.execute(sql`select pg_advisory_xact_lock(8152026)`);
      const [{ n }] = await tx
        .select({ n: count() })
        .from(orders)
        .where(gte(orders.createdAt, dayStart));
      const num = orderNumber(Number(n) + 1);

      const [row] = await tx
        .insert(orders)
        .values({
          orderNumber: num,
          idempotencyKey: input.idempotencyKey,
          customerName: input.payload.customerName.trim(),
          customerPhone: input.payload.customerPhone.trim(),
          addressLine: input.payload.addressLine.trim(),
          city: input.payload.city.trim(),
          province: input.payload.province.trim(),
          postalCode: input.payload.postalCode.trim(),
          subtotalAmount: subtotal,
          shippingFee: totals.shippingFee,
          totalAmount: subtotal + totals.shippingFee,
          status: "PENDING_PAYMENT",
          expiresAt,
          paymentMethodId: pm.id,
          paymentSnapshot: snapshot,
        })
        .onConflictDoNothing({ target: orders.idempotencyKey })
        .returning({ id: orders.id, orderNumber: orders.orderNumber });
      if (!row) return null; // tabrakan idempoten

      await tx.insert(orderItems).values(
        items.map((i) => ({
          orderId: row.id,
          productId: i.productId,
          productName: i.name,
          productPrice: i.price,
          quantity: i.qty,
          subtotal: i.price * i.qty,
        })),
      );

      for (const i of items) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${i.qty}` })
          .where(eq(products.id, i.productId));
      }
      return row;
    });

    if (!created) {
      const [again] = await db
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.idempotencyKey, input.idempotencyKey))
        .limit(1);
      if (again) return { ok: true, orderId: again.id };
      return { ok: false, error: "Pesanan duplikat, coba lagi." };
    }

    // telegram non-blocking
    const total = items.reduce((n, i) => n + i.price * i.qty, 0) + totals.shippingFee;
    void telegram(
      `🛒 Order baru ${created.orderNumber}\n${items.map((i) => `• ${i.name} x${i.qty}`).join("\n")}\nTotal: Rp${total.toLocaleString("id-ID")}\nBayar sebelum: ${expiresAt.toISOString()}`,
    );

    return { ok: true, orderId: created.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal membuat pesanan.";
    return { ok: false, error: msg };
  }
}

/** Harga & stok terbaru untuk sinkronisasi keranjang di klien (M-2). */
export async function cartStock(
  productIds: string[],
): Promise<{ productId: string; stock: number; price: number }[]> {
  if (!Array.isArray(productIds) || productIds.length === 0) return [];
  const ids = productIds.filter((x) => typeof x === "string").slice(0, 20);
  if (!ids.length) return [];
  try {
    return await db
      .select({ productId: products.id, stock: products.stock, price: products.priceIdr })
      .from(products)
      .where(and(inArray(products.id, ids), eq(products.active, true)));
  } catch {
    return [];
  }
}

/** Upload bukti bayar → bucket privat; fail-closed. Rate limit per IP (H-4). */
export async function uploadProof(orderId: string, file: File): Promise<{ ok: boolean; error?: string }> {
  const ip = await clientIp();
  const rl = rateLimit("upload-proof", ip, 5, 15 * 60_000);
  if (!rl.ok) {
    return { ok: false, error: `Terlalu banyak percobaan upload. Coba lagi dalam ${Math.ceil(rl.retryAfter / 60)} menit.` };
  }
  if (file.size > 1024 * 1024) return { ok: false, error: "Maksimal 1 MB." };
  const buf = new Uint8Array(await file.arrayBuffer());
  const magic = String.fromCharCode(...buf.slice(0, 4));
  const isJpg = buf[0] === 0xff && buf[1] === 0xd8;
  const isPng = magic.startsWith("\x89PNG");
  const isWebp = magic.startsWith("RIFF") && String.fromCharCode(...buf.slice(8, 12)) === "WEBP";
  if (!isJpg && !isPng && !isWebp) return { ok: false, error: "File harus JPG, PNG, atau WEBP." };

  const [order] = await db
    .select({ id: orders.id, status: orders.status, orderNumber: orders.orderNumber })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order) return { ok: false, error: "Pesanan tidak ditemukan." };
  if (order.status !== "PENDING_PAYMENT") return { ok: false, error: "Pesanan bukan status menunggu pembayaran." };

  try {
    const url = await storeProof(orderId, buf, file.name);
    await db
      .update(orders)
      .set({ proofImageUrl: url, proofUploadedAt: new Date() })
      .where(eq(orders.id, orderId));
    void telegram(`🧾 Bukti bayar masuk untuk order ${order.orderNumber} (${orderId})`);
    return { ok: true };
  } catch {
    // fail-closed: tidak menyimpan base64 apa pun
    return { ok: false, error: "Penyimpanan bukti bayar sedang tidak tersedia. Coba lagi nanti." };
  }
}

async function storeProof(orderId: string, body: Uint8Array, filename: string): Promise<string> {
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const endpoint = process.env.S3_ENDPOINT;
  if (!endpoint) throw new Error("S3_ENDPOINT kosong");
  const ext = filename.toLowerCase().endsWith(".png") ? "png" : filename.toLowerCase().endsWith(".webp") ? "webp" : "jpg";
  const key = `proofs/${orderId}-${Date.now()}.${ext}`;
  const bucket = s3Env("S3_BUCKET_PRIVATE");
  if (!bucket) throw new Error("Bucket privat S3 belum dikonfigurasi");
  await s3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg",
    }),
  );
  return `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;
}

/** Presigned GET bukti (15 menit) — hanya untuk admin. */
export async function proofUrl(orderId: string): Promise<string | null> {
  if (!(await isAdmin())) return null;
  const [order] = await db
    .select({ proofImageUrl: orders.proofImageUrl })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order?.proofImageUrl) return null;
  try {
    // key diambil dari marker "proofs/" — tidak bergantung jumlah segmen path endpoint
    const key = s3KeyFromUrl(order.proofImageUrl, "proofs/");
    if (!key) return null;
    const bucket = s3Env("S3_BUCKET_PRIVATE");
    if (!bucket) return null;
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    return await getSignedUrl(s3Client(), cmd, { expiresIn: 15 * 60 });
  } catch {
    return null;
  }
}