"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { revalidatePath, updateTag } from "next/cache";
import { db } from "@/db";
import { orders, orderItems, products, productImages, brands, categories, tags, productTags, testimonials, banners } from "@/db/schema";
import { and, eq, isNull, sql, ilike, or, count, inArray } from "drizzle-orm";
import { setAdminCookie, clearAdminCookie, isAdmin } from "@/lib/admin-session";
import { rateLimit, resetRateLimit, clientIp } from "@/lib/rate-limit";
import { slugify } from "@/lib/format";
import { s3Client, s3Env } from "@/lib/s3";

// Fallback hash bcrypt untuk admin123 jika dotenv-expand Next.js mengosongkan simbol $
const DEFAULT_DEV_HASH = "$2b$10$Z82suZoBbsBeHqSRFRCrLebcCfmfAuojRqI5RX1rRWxDtiYRRQq7C";

export async function loginAction(_: unknown, formData: FormData): Promise<{ error?: string }> {
  const ip = await clientIp();
  const isDev = process.env.NODE_ENV !== "production";
  const rl = rateLimit("admin-login", ip, isDev ? 50 : 5, 15 * 60_000);
  if (!rl.ok) return { error: "Terlalu banyak percobaan login yang gagal. Silakan coba beberapa saat lagi." };

  const user = String(formData.get("username") ?? "");
  const pass = String(formData.get("password") ?? "");
  const hash = process.env.ADMIN_PASSWORD_HASH || (isDev ? DEFAULT_DEV_HASH : "");
  if (!hash) return { error: "Akun admin belum dikonfigurasi." };

  const okUser = user === "admin";
  const okPass = await bcrypt.compare(pass, hash);
  if (!okUser || !okPass) return { error: "Username atau password salah." };

  resetRateLimit("admin-login", ip);
  await setAdminCookie();
  redirect("/admin/orders");
}

export async function logoutAction() {
  await clearAdminCookie();
  redirect("/admin/login");
}

async function guard(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** Peta transisi sah — sesuai MVP/PRD. */
const TRANSITIONS: Record<string, string[]> = {
  PENDING_PAYMENT: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function transitionOrder(orderId: string, next: string): Promise<{ ok: boolean; error?: string }> {
  await guard();
  try {
    const [cur] = await db
      .select({ status: orders.status, stockRestoredAt: orders.stockRestoredAt })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    if (!cur) return { ok: false, error: "Pesanan tidak ditemukan." };
    if (!TRANSITIONS[cur.status]?.includes(next)) {
      return { ok: false, error: `Transisi ${cur.status} → ${next} tidak diizinkan.` };
    }

    await db.transaction(async (tx) => {
      const [upd] = await tx
        .update(orders)
        .set({
          status: next,
          updatedAt: new Date(),
          ...(next === "CANCELLED" ? { stockRestoredAt: new Date() } : {}),
        })
        .where(
          next === "CANCELLED"
            ? and(eq(orders.id, orderId), isNull(orders.stockRestoredAt))
            : eq(orders.id, orderId),
        )
        .returning({ id: orders.id });

      // cancel dua kali = restock hanya sekali (kolom jadi terisi pada percobaan pertama)
      if (next === "CANCELLED" && !upd) return;
      if (next === "CANCELLED") {
        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
        for (const i of items) {
          if (!i.productId) continue;
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} + ${i.quantity}` })
            .where(eq(products.id, i.productId));
        }
      }
    });

    revalidatePath("/admin/orders");
    revalidatePath("/products");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal memperbarui pesanan." };
  }
}

export async function setTracking(orderId: string, courier: string, tracking: string): Promise<{ ok: boolean; error?: string }> {
  await guard();
  const c = courier.trim();
  const t = tracking.trim();
  if (!c || !t) return { ok: false, error: "Kurir & nomor resi wajib diisi." };
  if (c.length > 60 || t.length > 100) return { ok: false, error: "Terlalu panjang." };
  try {
    const [cur] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!cur || cur.status !== "PROCESSING") return { ok: false, error: "Hanya pesanan PROCESSING yang bisa diberi resi." };
    await db
      .update(orders)
      .set({ courierName: c, trackingNumber: t, status: "SHIPPED", updatedAt: new Date() })
      .where(eq(orders.id, orderId));
    revalidatePath("/admin/orders");
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal menyimpan resi." };
  }
}

/** Stepper stok — server angka sebelum & sesudah; kembali ke client untuk rollback UI. */
export async function updateStock(productId: string, delta: number): Promise<{ ok: boolean; stock?: number; error?: string }> {
  await guard();
  if (!Number.isInteger(delta) || Math.abs(delta) > 99) return { ok: false, error: "Delta tidak valid." };
  try {
    const [row] = await db
      .update(products)
      .set({ stock: sql`GREATEST(0, ${products.stock} + ${delta})`, updatedAt: new Date() })
      .where(eq(products.id, productId))
      .returning({ stock: products.stock });
    if (!row) return { ok: false, error: "Produk tidak ditemukan." };
    revalidatePath("/admin/products");
    return { ok: true, stock: row.stock };
  } catch {
    return { ok: false, error: "Gagal update stok." };
  }
}

export async function setInternalNote(orderId: string, note: string): Promise<{ ok: boolean }> {
  await guard();
  await db.update(orders).set({ internalNotes: note.slice(0, 2000), updatedAt: new Date() }).where(eq(orders.id, orderId));
  revalidatePath("/admin/orders");
  return { ok: true };
}

export type ProductInputData = {
  name: string;
  brandId?: string | null;
  newBrandName?: string | null;
  categoryId?: string | null;
  newCategoryName?: string | null;
  priceIdr: number;
  stock: number;
  conditionGrade?: number | null;
  defects?: string | null;
  inclusions?: string[];
  description?: string | null;
  features?: string[];
  weightGrams?: number | null;
  isFeatured?: boolean;
  isMostWanted?: boolean;
  active?: boolean;
  images: {
    url: string;
    kind: "body" | "sample";
    isPrimary: boolean;
    position: number;
  }[];
};

export async function createProductAction(data: ProductInputData): Promise<{ ok: boolean; productId?: string; error?: string }> {
  await guard();

  const name = data.name?.trim();
  if (!name || name.length < 3) {
    return { ok: false, error: "Nama kamera minimal 3 karakter." };
  }
  if (!data.priceIdr || data.priceIdr < 100_000) {
    return { ok: false, error: "Harga kamera tidak valid (minimal Rp 100.000)." };
  }

  // produk aktif wajib: skor kondisi (1–10) + minimal 1 foto (MVP.md §kondisi)
  const wantsActive = data.active !== false;
  if (wantsActive) {
    const g = data.conditionGrade ?? null;
    if (g === null || !Number.isFinite(g) || g < 1 || g > 10) {
      return { ok: false, error: "Skor kondisi (1.0–10.0) wajib diisi untuk kamera yang dipublikasikan." };
    }
    if (!data.images?.length) {
      return { ok: false, error: "Minimal 1 foto kamera wajib diunggah untuk publikasi." };
    }
  }

  try {
    const baseSlug = slugify(name);
    let finalSlug = baseSlug;

    // Cek tabrakan slug unik
    const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.slug, finalSlug)).limit(1);
    if (existing) {
      finalSlug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
    }

    // Resolusi Brand Dinamis (dari dropdown atau input baru)
    let finalBrandId = data.brandId || null;
    const newBrand = data.newBrandName?.trim();
    if (newBrand) {
      const brandSlug = slugify(newBrand);
      const [existingBrand] = await db
        .select({ id: brands.id })
        .from(brands)
        .where(or(ilike(brands.name, newBrand), eq(brands.slug, brandSlug)))
        .limit(1);

      if (existingBrand) {
        finalBrandId = existingBrand.id;
      } else {
        const [insertedBrand] = await db
          .insert(brands)
          .values({
            name: newBrand,
            slug: brandSlug,
          })
          .returning({ id: brands.id });
        finalBrandId = insertedBrand.id;
      }
    }

    // Resolusi Kategori Dinamis (dari dropdown atau input baru)
    let finalCategoryId = data.categoryId || null;
    const newCat = data.newCategoryName?.trim();
    if (newCat) {
      const catSlug = slugify(newCat);
      const [existingCat] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(or(ilike(categories.name, newCat), eq(categories.slug, catSlug)))
        .limit(1);

      if (existingCat) {
        finalCategoryId = existingCat.id;
      } else {
        const [insertedCat] = await db
          .insert(categories)
          .values({
            name: newCat,
            slug: catSlug,
          })
          .returning({ id: categories.id });
        finalCategoryId = insertedCat.id;
      }
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        name,
        slug: finalSlug,
        brandId: finalBrandId,
        categoryId: finalCategoryId,
        priceIdr: Math.round(data.priceIdr),
        stock: Number.isInteger(data.stock) ? Math.max(0, data.stock) : 1,
        conditionGrade: data.conditionGrade ? String(data.conditionGrade) : null,
        defects: data.defects?.trim() || null,
        inclusions: data.inclusions ?? [],
        description: data.description?.trim() || null,
        features: data.features ?? [],
        weightGrams: data.weightGrams ?? 350,
        isFeatured: !!data.isFeatured,
        active: data.active !== false,
      })
      .returning({ id: products.id });

    if (data.images && data.images.length > 0) {
      await db.insert(productImages).values(
        data.images.map((img, idx) => ({
          productId: newProduct.id,
          url: img.url,
          kind: img.kind || "body",
          position: img.position ?? idx,
          isPrimary: !!img.isPrimary || idx === 0,
        }))
      );
    }

    // Hubungkan dengan tag best-seller jika ditandai sebagai Most Wanted
    if (data.isMostWanted) {
      let [tag] = await db.select({ id: tags.id }).from(tags).where(eq(tags.slug, "best-seller")).limit(1);
      if (!tag) {
        const [inserted] = await db
          .insert(tags)
          .values({
            name: "Best Seller",
            slug: "best-seller",
            kind: "promo",
          })
          .returning({ id: tags.id });
        tag = inserted;
      }
      if (tag) {
        await db.insert(productTags).values({
          productId: newProduct.id,
          tagId: tag.id,
        });
      }
    }

    updateTag("products");
    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath("/admin/products");

    return { ok: true, productId: newProduct.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan produk ke database.";
    return { ok: false, error: message };
  }
}

export async function toggleMostWantedAction(productId: string): Promise<{ ok: boolean; isMostWanted?: boolean; error?: string }> {
  await guard();
  try {
    let [tag] = await db.select({ id: tags.id }).from(tags).where(eq(tags.slug, "best-seller")).limit(1);
    if (!tag) {
      const [inserted] = await db
        .insert(tags)
        .values({
          name: "Best Seller",
          slug: "best-seller",
          kind: "promo",
        })
        .returning({ id: tags.id });
      tag = inserted;
    }

    const [existing] = await db
      .select({ productId: productTags.productId })
      .from(productTags)
      .where(and(eq(productTags.productId, productId), eq(productTags.tagId, tag.id)))
      .limit(1);

    let isNowMostWanted = false;
    if (existing) {
      await db
        .delete(productTags)
        .where(and(eq(productTags.productId, productId), eq(productTags.tagId, tag.id)));
      isNowMostWanted = false;
    } else {
      await db.insert(productTags).values({
        productId,
        tagId: tag.id,
      });
      isNowMostWanted = true;
    }

    updateTag("products");
    revalidatePath("/");
    revalidatePath("/admin/products");
    return { ok: true, isMostWanted: isNowMostWanted };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Gagal mengubah status Most Wanted." };
  }
}

export async function toggleFeaturedAction(productId: string): Promise<{ ok: boolean; isFeatured?: boolean; error?: string }> {
  await guard();
  try {
    const [cur] = await db.select({ isFeatured: products.isFeatured }).from(products).where(eq(products.id, productId)).limit(1);
    if (!cur) return { ok: false, error: "Produk tidak ditemukan." };
    const next = !cur.isFeatured;
    await db.update(products).set({ isFeatured: next, updatedAt: new Date() }).where(eq(products.id, productId));
    updateTag("products");
    revalidatePath("/");
    revalidatePath("/admin/products");
    return { ok: true, isFeatured: next };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Gagal mengubah status unggulan." };
  }
}

export async function uploadProductImageAction(formData: FormData): Promise<{ ok: boolean; url?: string; error?: string }> {
  await guard();
  try {
    const file = formData.get("file") as File | null;
    if (!file) return { ok: false, error: "File tidak ditemukan." };
    if (file.size > 10 * 1024 * 1024) return { ok: false, error: "Ukuran file maksimal 10MB." };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = file.name.toLowerCase().endsWith(".png") ? "png" : file.name.toLowerCase().endsWith(".webp") ? "webp" : "jpg";
    const filename = `product-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const endpoint = process.env.S3_ENDPOINT;
    const bucket = s3Env("S3_BUCKET_PUBLIC") || "vintaagemeew-public";

    if (endpoint && s3Env("S3_ACCESS_KEY_ID")) {
      try {
        const { PutObjectCommand } = await import("@aws-sdk/client-s3");
        const client = s3Client();

        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: `products/${filename}`,
            Body: buffer,
            ContentType: ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg",
          })
        );

        const publicUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL 
          ? `${process.env.NEXT_PUBLIC_S3_PUBLIC_URL.replace(/\/$/, "")}/products/${filename}`
          : `${endpoint.replace(/\/$/, "")}/${bucket}/products/${filename}`;

        return { ok: true, url: publicUrl };
      } catch (s3Err) {
        console.warn("S3 upload gagal, simpan ke lokal public/uploads/:", s3Err);
      }
    }

    // Fallback penyimpanan lokal: public/uploads/
    const fs = await import("fs/promises");
    const path = await import("path");
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, filename), buffer);

    return { ok: true, url: `/uploads/${filename}` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengunggah foto.";
    return { ok: false, error: message };
  }
}

export async function deleteProductAction(productId: string): Promise<{ ok: boolean; error?: string }> {
  await guard();
  try {
    // tolak hapus bila masih terikat pesanan aktif (2.3)
    const [linked] = await db
      .select({ n: count() })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orderItems.productId, productId),
          inArray(orders.status, ["PENDING_PAYMENT", "PROCESSING"]),
        ),
      );
    if (Number(linked.n) > 0) {
      return { ok: false, error: "Produk masih terikat pesanan aktif (menunggu bayar/diproses). Tunggu sampai pesanan selesai atau dibatalkan." };
    }

    await db.delete(products).where(eq(products.id, productId));
    updateTag("products");
    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath("/admin/products");
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus produk.";
    return { ok: false, error: message };
  }
}

export async function createBrandAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await guard();
  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length < 2) return { ok: false, error: "Nama merek minimal 2 karakter." };
  if (name.length > 60) return { ok: false, error: "Nama merek maksimal 60 karakter." };

  try {
    const brandSlug = slugify(name);
    const [existing] = await db
      .select({ id: brands.id })
      .from(brands)
      .where(or(ilike(brands.name, name), eq(brands.slug, brandSlug)))
      .limit(1);

    if (existing) return { ok: false, error: "Merek ini sudah terdaftar di sistem." };

    await db.insert(brands).values({ name, slug: brandSlug });
    updateTag("products");
    revalidatePath("/admin/brands");
    revalidatePath("/admin/products/new");
    revalidatePath("/");
    revalidatePath("/products");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Gagal menambahkan merek." };
  }
}

export async function deleteBrandAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await guard();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "ID merek tidak valid." };

  try {
    const [inUse] = await db
      .select({ n: count() })
      .from(products)
      .where(eq(products.brandId, id));

    if (Number(inUse?.n ?? 0) > 0) {
      return { ok: false, error: "Merek ini tidak dapat dihapus karena masih memiliki unit kamera yang terdaftar." };
    }

    await db.delete(brands).where(eq(brands.id, id));
    updateTag("products");
    revalidatePath("/admin/brands");
    revalidatePath("/admin/products/new");
    revalidatePath("/");
    revalidatePath("/products");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Gagal menghapus merek." };
  }
}

export async function createCategoryAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await guard();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name || name.length < 2) return { ok: false, error: "Nama kategori minimal 2 karakter." };
  if (name.length > 60) return { ok: false, error: "Nama kategori maksimal 60 karakter." };

  try {
    const categorySlug = slugify(name);
    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(or(ilike(categories.name, name), eq(categories.slug, categorySlug)))
      .limit(1);

    if (existing) return { ok: false, error: "Kategori ini sudah terdaftar di sistem." };

    await db.insert(categories).values({ name, slug: categorySlug, description });
    updateTag("products");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/products/new");
    revalidatePath("/");
    revalidatePath("/products");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Gagal menambahkan kategori." };
  }
}

export async function deleteCategoryAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await guard();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "ID kategori tidak valid." };

  try {
    const [inUse] = await db
      .select({ n: count() })
      .from(products)
      .where(eq(products.categoryId, id));

    if (Number(inUse?.n ?? 0) > 0) {
      return {
        ok: false,
        error: `Kategori ini tidak dapat dihapus karena masih digunakan oleh ${inUse?.n} unit kamera. Silakan pindahkan kamera ke kategori lain terlebih dahulu.`,
      };
    }

    await db.delete(categories).where(eq(categories.id, id));
    updateTag("products");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/products/new");
    revalidatePath("/");
    revalidatePath("/products");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Gagal menghapus kategori." };
  }
}

export async function uploadTestimonialImageAction(
  formData: FormData
): Promise<{ ok: boolean; url?: string; error?: string }> {
  await guard();
  try {
    const file = formData.get("file") as File | null;
    if (!file) return { ok: false, error: "File foto tidak ditemukan." };
    if (file.size > 5 * 1024 * 1024) return { ok: false, error: "Ukuran foto maksimal 5 MB." };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = file.name.toLowerCase().endsWith(".png")
      ? "png"
      : file.name.toLowerCase().endsWith(".webp")
        ? "webp"
        : "jpg";
    const filename = `testi-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const endpoint = process.env.S3_ENDPOINT;
    const bucket = s3Env("S3_BUCKET_PUBLIC") || "vintaagemeew-public";

    if (endpoint && s3Env("S3_ACCESS_KEY_ID")) {
      try {
        const { PutObjectCommand } = await import("@aws-sdk/client-s3");
        const client = s3Client();

        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: `testimonials/${filename}`,
            Body: buffer,
            ContentType: ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg",
          })
        );

        const publicUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL
          ? `${process.env.NEXT_PUBLIC_S3_PUBLIC_URL.replace(/\/$/, "")}/testimonials/${filename}`
          : `${endpoint.replace(/\/$/, "")}/${bucket}/testimonials/${filename}`;

        return { ok: true, url: publicUrl };
      } catch (s3Err) {
        console.warn("S3 upload testimoni gagal, simpan ke lokal public/uploads/:", s3Err);
      }
    }

    const fs = await import("fs/promises");
    const path = await import("path");
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, filename), buffer);

    return { ok: true, url: `/uploads/${filename}` };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Gagal mengunggah foto testimoni." };
  }
}

export async function createTestimonialAction(input: {
  customerName: string;
  rating: number;
  content: string;
  screenshotUrl?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  await guard();
  const customerName = input.customerName?.trim();
  const content = input.content?.trim() ?? "";
  const screenshotUrl = input.screenshotUrl?.trim() || null;
  const rating = Math.min(5, Math.max(1, Math.round(Number(input.rating) || 5)));

  if (!customerName || customerName.length < 2) {
    return { ok: false, error: "Nama pembeli minimal 2 karakter." };
  }
  if (customerName.length > 100) {
    return { ok: false, error: "Nama pembeli maksimal 100 karakter." };
  }
  if (!content && !screenshotUrl) {
    return { ok: false, error: "Isi ulasan atau foto testimoni wajib diisi minimal salah satu." };
  }

  try {
    await db.insert(testimonials).values({
      customerName,
      rating,
      content: content || "Puas belanja di vintaagemeew!",
      screenshotUrl,
      isActive: true,
      sortOrder: 0,
    });

    revalidatePath("/");
    revalidatePath("/product/[slug]", "page");
    revalidatePath("/admin/testimonials");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Gagal menyimpan testimoni." };
  }
}

export async function toggleTestimonialActiveAction(
  id: string
): Promise<{ ok: boolean; isActive?: boolean; error?: string }> {
  await guard();
  try {
    const [cur] = await db
      .select({ isActive: testimonials.isActive })
      .from(testimonials)
      .where(eq(testimonials.id, id))
      .limit(1);
    if (!cur) return { ok: false, error: "Testimoni tidak ditemukan." };
    const next = !cur.isActive;
    await db.update(testimonials).set({ isActive: next }).where(eq(testimonials.id, id));
    revalidatePath("/");
    revalidatePath("/product/[slug]", "page");
    revalidatePath("/admin/testimonials");
    return { ok: true, isActive: next };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Gagal mengubah status testimoni." };
  }
}

export async function deleteTestimonialAction(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  await guard();
  try {
    await db.delete(testimonials).where(eq(testimonials.id, id));
    revalidatePath("/");
    revalidatePath("/product/[slug]", "page");
    revalidatePath("/admin/testimonials");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Gagal menghapus testimoni." };
  }
}

export async function updateProductAction(
  productId: string,
  data: ProductInputData
): Promise<{ ok: boolean; productId?: string; error?: string }> {
  await guard();

  const name = data.name?.trim();
  if (!name || name.length < 3) {
    return { ok: false, error: "Nama kamera minimal 3 karakter." };
  }
  if (!data.priceIdr || data.priceIdr < 100_000) {
    return { ok: false, error: "Harga kamera tidak valid (minimal Rp 100.000)." };
  }

  const wantsActive = data.active !== false;
  if (wantsActive) {
    const g = data.conditionGrade ?? null;
    if (g === null || !Number.isFinite(g) || g < 1 || g > 10) {
      return {
        ok: false,
        error: "Skor kondisi (1.0–10.0) wajib diisi untuk kamera yang dipublikasikan.",
      };
    }
    if (!data.images?.length) {
      return { ok: false, error: "Minimal 1 foto kamera wajib diunggah untuk publikasi." };
    }
  }

  try {
    const [existingProduct] = await db
      .select({ id: products.id, slug: products.slug })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!existingProduct) {
      return { ok: false, error: "Produk tidak ditemukan." };
    }

    let finalBrandId = data.brandId || null;
    const newBrand = data.newBrandName?.trim();
    if (newBrand) {
      const brandSlug = slugify(newBrand);
      const [existingBrand] = await db
        .select({ id: brands.id })
        .from(brands)
        .where(or(ilike(brands.name, newBrand), eq(brands.slug, brandSlug)))
        .limit(1);

      if (existingBrand) {
        finalBrandId = existingBrand.id;
      } else {
        const [insertedBrand] = await db
          .insert(brands)
          .values({ name: newBrand, slug: brandSlug })
          .returning({ id: brands.id });
        finalBrandId = insertedBrand.id;
      }
    }

    let finalCategoryId = data.categoryId || null;
    const newCat = data.newCategoryName?.trim();
    if (newCat) {
      const catSlug = slugify(newCat);
      const [existingCat] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(or(ilike(categories.name, newCat), eq(categories.slug, catSlug)))
        .limit(1);

      if (existingCat) {
        finalCategoryId = existingCat.id;
      } else {
        const [insertedCat] = await db
          .insert(categories)
          .values({ name: newCat, slug: catSlug })
          .returning({ id: categories.id });
        finalCategoryId = insertedCat.id;
      }
    }

    await db
      .update(products)
      .set({
        name,
        brandId: finalBrandId,
        categoryId: finalCategoryId,
        priceIdr: Math.round(data.priceIdr),
        stock: Number.isInteger(data.stock) ? Math.max(0, data.stock) : 1,
        conditionGrade: data.conditionGrade ? String(data.conditionGrade) : null,
        defects: data.defects?.trim() || null,
        inclusions: data.inclusions ?? [],
        description: data.description?.trim() || null,
        features: data.features ?? [],
        weightGrams: data.weightGrams ?? 350,
        isFeatured: !!data.isFeatured,
        active: data.active !== false,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    await db.delete(productImages).where(eq(productImages.productId, productId));
    if (data.images && data.images.length > 0) {
      await db.insert(productImages).values(
        data.images.map((img, idx) => ({
          productId,
          url: img.url,
          kind: img.kind || "body",
          position: img.position ?? idx,
          isPrimary: !!img.isPrimary || idx === 0,
        }))
      );
    }

    let [bestTag] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.slug, "best-seller"))
      .limit(1);
    if (!bestTag && data.isMostWanted) {
      const [inserted] = await db
        .insert(tags)
        .values({ name: "Best Seller", slug: "best-seller", kind: "promo" })
        .returning({ id: tags.id });
      bestTag = inserted;
    }

    if (bestTag) {
      await db
        .delete(productTags)
        .where(and(eq(productTags.productId, productId), eq(productTags.tagId, bestTag.id)));
      if (data.isMostWanted) {
        await db.insert(productTags).values({ productId, tagId: bestTag.id });
      }
    }

    updateTag("products");
    revalidatePath("/products");
    revalidatePath(`/product/${existingProduct.slug}`);
    revalidatePath("/");
    revalidatePath("/admin/products");

    return { ok: true, productId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui produk.";
    return { ok: false, error: message };
  }
}

export async function uploadBannerImageAction(
  formData: FormData
): Promise<{ ok: boolean; url?: string; error?: string }> {
  await guard();
  try {
    const file = formData.get("file") as File | null;
    if (!file) return { ok: false, error: "File gambar tidak ditemukan." };
    if (file.size > 10 * 1024 * 1024) return { ok: false, error: "Ukuran gambar maksimal 10 MB." };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = file.name.toLowerCase().endsWith(".png")
      ? "png"
      : file.name.toLowerCase().endsWith(".webp")
        ? "webp"
        : "jpg";
    const filename = `banner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const endpoint = process.env.S3_ENDPOINT;
    const bucket = s3Env("S3_BUCKET_PUBLIC") || "vintaagemeew-public";

    if (endpoint && s3Env("S3_ACCESS_KEY_ID")) {
      try {
        const { PutObjectCommand } = await import("@aws-sdk/client-s3");
        const client = s3Client();

        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: `banners/${filename}`,
            Body: buffer,
            ContentType: ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg",
          })
        );

        const publicUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL
          ? `${process.env.NEXT_PUBLIC_S3_PUBLIC_URL.replace(/\/$/, "")}/banners/${filename}`
          : `${endpoint.replace(/\/$/, "")}/${bucket}/banners/${filename}`;

        return { ok: true, url: publicUrl };
      } catch (s3Err) {
        console.warn("S3 upload banner gagal, simpan ke lokal public/uploads/:", s3Err);
      }
    }

    const fs = await import("fs/promises");
    const path = await import("path");
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, filename), buffer);

    return { ok: true, url: `/uploads/${filename}` };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Gagal mengunggah gambar banner." };
  }
}

export async function createBannerAction(input: {
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  ctaText?: string | null;
  ctaUrl?: string | null;
  sortOrder?: number;
}): Promise<{ ok: boolean; error?: string }> {
  await guard();
  const title = input.title?.trim();
  const imageUrl = input.imageUrl?.trim();
  if (!title || title.length < 2) return { ok: false, error: "Judul banner minimal 2 karakter." };
  if (!imageUrl) return { ok: false, error: "Gambar banner wajib diunggah atau diisi URL-nya." };

  try {
    await db.insert(banners).values({
      title: title.slice(0, 150),
      subtitle: input.subtitle?.trim() || null,
      imageUrl,
      ctaText: input.ctaText?.trim().slice(0, 80) || "Lihat Katalog",
      ctaUrl: input.ctaUrl?.trim() || "/products",
      sortOrder: Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 0,
      isActive: true,
    });

    revalidatePath("/");
    revalidatePath("/admin/banners");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Gagal menambahkan banner." };
  }
}

export async function updateBannerAction(
  id: string,
  input: {
    title: string;
    subtitle?: string | null;
    imageUrl: string;
    ctaText?: string | null;
    ctaUrl?: string | null;
    sortOrder?: number;
  }
): Promise<{ ok: boolean; error?: string }> {
  await guard();
  const title = input.title?.trim();
  const imageUrl = input.imageUrl?.trim();
  if (!title || title.length < 2) return { ok: false, error: "Judul banner minimal 2 karakter." };
  if (!imageUrl) return { ok: false, error: "Gambar banner wajib diisi." };

  try {
    await db
      .update(banners)
      .set({
        title: title.slice(0, 150),
        subtitle: input.subtitle?.trim() || null,
        imageUrl,
        ctaText: input.ctaText?.trim().slice(0, 80) || null,
        ctaUrl: input.ctaUrl?.trim() || null,
        sortOrder: Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 0,
      })
      .where(eq(banners.id, id));

    revalidatePath("/");
    revalidatePath("/admin/banners");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Gagal memperbarui banner." };
  }
}

export async function toggleBannerActiveAction(
  id: string
): Promise<{ ok: boolean; isActive?: boolean; error?: string }> {
  await guard();
  try {
    const [cur] = await db
      .select({ isActive: banners.isActive })
      .from(banners)
      .where(eq(banners.id, id))
      .limit(1);
    if (!cur) return { ok: false, error: "Banner tidak ditemukan." };
    const next = !cur.isActive;
    await db.update(banners).set({ isActive: next }).where(eq(banners.id, id));
    revalidatePath("/");
    revalidatePath("/admin/banners");
    return { ok: true, isActive: next };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Gagal mengubah status banner." };
  }
}

export async function deleteBannerAction(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  await guard();
  try {
    await db.delete(banners).where(eq(banners.id, id));
    revalidatePath("/");
    revalidatePath("/admin/banners");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Gagal menghapus banner." };
  }
}

