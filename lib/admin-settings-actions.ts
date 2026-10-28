"use server";

import { revalidatePath, updateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings, paymentMethods, orders } from "@/db/schema";
import { isAdmin } from "@/lib/admin-session";
import { s3Client, s3Env, s3PublicUrl } from "@/lib/s3";

const ALLOWED = new Set([
  "shipping_fee_utama",
  "shipping_fee_luar",
  "provinces_zona_utama",
  "provinces_diblokir",
  "auto_cancel_hours",
  "whatsapp_number",
  "running_banner_text",
  "store_address",
]);

export async function saveSettings(input: Record<string, string>): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Sesi habis, login ulang." };

  // validasi nilai numerik = trust boundary
  for (const key of ["shipping_fee_utama", "shipping_fee_luar"]) {
    const v = input[key];
    if (v !== undefined && (!/^\d+$/.test(v) || Number(v) > 5_000_000)) {
      return { ok: false, error: "Tarif ongkir harus angka wajar." };
    }
  }
  const hrs = input.auto_cancel_hours;
  if (hrs !== undefined && (!/^\d+$/.test(hrs) || Number(hrs) < 1 || Number(hrs) > 72)) {
    return { ok: false, error: "Auto-cancel 1–72 jam." };
  }
  const wa = input.whatsapp_number;
  if (wa !== undefined && wa.trim() !== "" && !/^(\+?62|0)8\d{6,13}$/.test(wa.replace(/[\s-]/g, ""))) {
    return { ok: false, error: "Nomor WhatsApp tidak valid." };
  }

  try {
    for (const [key, value] of Object.entries(input)) {
      if (!ALLOWED.has(key)) continue;
      await db
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
    }
    // read-your-writes: admin langsung lihat perubahan
    updateTag("settings");
    revalidatePath("/");
    revalidatePath("/checkout");
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal menyimpan pengaturan." };
  }
}

export interface PaymentMethodInput {
  id?: string;
  code: string;
  name: string;
  accountNumber?: string | null;
  accountHolder?: string | null;
  qrImageUrl?: string | null;
  instructions?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export async function savePaymentMethodAction(
  input: PaymentMethodInput
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Sesi habis, login ulang." };

  const name = input.name?.trim();
  if (!name) return { ok: false, error: "Nama bank / metode pembayaran wajib diisi." };

  const rawCode = input.code?.trim() || name.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  const code = rawCode.slice(0, 50);

  try {
    if (input.id) {
      await db
        .update(paymentMethods)
        .set({
          code,
          name,
          accountNumber: input.accountNumber?.trim() || null,
          accountHolder: input.accountHolder?.trim() || null,
          qrImageUrl: input.qrImageUrl?.trim() || null,
          instructions: input.instructions?.trim() || null,
          isActive: input.isActive ?? true,
          sortOrder: input.sortOrder ?? 0,
        })
        .where(eq(paymentMethods.id, input.id));
    } else {
      await db.insert(paymentMethods).values({
        code: `${code}_${Date.now().toString(36).slice(-4)}`.slice(0, 50),
        name,
        accountNumber: input.accountNumber?.trim() || null,
        accountHolder: input.accountHolder?.trim() || null,
        qrImageUrl: input.qrImageUrl?.trim() || null,
        instructions: input.instructions?.trim() || null,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
      });
    }

    updateTag("settings");
    revalidatePath("/checkout");
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menyimpan rekening.";
    return { ok: false, error: msg };
  }
}

export async function togglePaymentMethodActiveAction(
  id: string,
  isActive: boolean
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Sesi habis, login ulang." };
  try {
    await db
      .update(paymentMethods)
      .set({ isActive })
      .where(eq(paymentMethods.id, id));
    updateTag("settings");
    revalidatePath("/checkout");
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal mengubah status rekening." };
  }
}

export async function deletePaymentMethodAction(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Sesi habis, login ulang." };
  try {
    // Lepaskan referensi FK pada pesanan lama (pesanan lama tetap aman karena memiliki paymentSnapshot permanen)
    await db
      .update(orders)
      .set({ paymentMethodId: null })
      .where(eq(orders.paymentMethodId, id));

    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
    updateTag("settings");
    revalidatePath("/checkout");
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal menghapus metode pembayaran." };
  }
}

export async function uploadQrisImageAction(
  formData: FormData
): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Sesi habis, login ulang." };
  try {
    const file = formData.get("file") as File | null;
    if (!file) return { ok: false, error: "File QRIS tidak ditemukan." };
    if (file.size > 10 * 1024 * 1024) return { ok: false, error: "Ukuran gambar maksimal 10 MB." };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = file.name.toLowerCase().endsWith(".png")
      ? "png"
      : file.name.toLowerCase().endsWith(".webp")
        ? "webp"
        : "jpg";
    const filename = `qris-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const endpoint = s3Env("S3_ENDPOINT");
    const bucket = s3Env("S3_BUCKET_PUBLIC") || "kamera";

    if (endpoint && s3Env("S3_ACCESS_KEY_ID")) {
      try {
        const { PutObjectCommand } = await import("@aws-sdk/client-s3");
        const client = s3Client();

        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: `qris/${filename}`,
            Body: buffer,
            ContentType: ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg",
            ACL: "public-read",
          })
        );

        const publicUrl = s3PublicUrl(bucket, `qris/${filename}`);
        return { ok: true, url: publicUrl };
      } catch (s3Err) {
        console.warn("S3 upload QRIS gagal, simpan ke lokal:", s3Err);
      }
    }

    const fs = await import("fs/promises");
    const path = await import("path");
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, filename), buffer);

    return { ok: true, url: `/uploads/${filename}` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengunggah gambar QRIS.";
    return { ok: false, error: message };
  }
}