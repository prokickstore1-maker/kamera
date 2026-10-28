import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { db } from "./index";
import { eq } from "drizzle-orm";
import {
  categories,
  brands,
  tags,
  products,
  productImages,
  productTags,
  banners,
  paymentMethods,
  settings,
  testimonials,
} from "./schema";

/** 8 merek digicam populer dunia — ditambah di atas data scrape. */
const EXTRA_BRANDS = [
  "Olympus",
  "Panasonic Lumix",
  "Casio",
  "Kodak",
  "Ricoh",
  "Samsung",
  "Leica",
  "Pentax",
] as const;

/** Testimoni awal — konten jujur khas digicam vintage, bukan buzzword. */
const DEFAULT_TESTIMONIALS = [
  {
    customerName: "Dinda A.",
    rating: 5,
    content:
      "Paketnya rapi banget, ada bubble wrap dua lapis. Kondisi bodi sesuai catatan minus di deskripsi, fotonya beneran khas CCD yang aku cari.",
    sortOrder: 1,
  },
  {
    customerName: "Rafi P.",
    rating: 5,
    content:
      "Admin fast respon, tips main shutter lag-nya dikasih tahu sejak mulai dites. Memory card-nya udah include jadi langsung bisa dipakai.",
    sortOrder: 2,
  },
  {
    customerName: "Salsa R.",
    rating: 4,
    content:
      "Kameranya sesuai foto sampel asli, enggak ada koreksi warna berlebihan. Kirimnya agak lama karena jauh, tapi aman sampai Pare.",
    sortOrder: 3,
  },
] as const;

dotenv.config();

function parseDetails(rawDetails: string | null) {
  if (!rawDetails) {
    return { conditionGrade: null, defects: null, inclusions: [] };
  }

  // 1. Parse condition grade (N/10 or N.N/10 or N.N/body condition)
  const gradeMatch = rawDetails.match(
    /([0-9]+(?:\.[0-9]+)?)\s*\/\s*(?:10\s*)?(?:body\s*condition)?/i
  );
  const conditionGrade = gradeMatch ? gradeMatch[1] : null;

  // 2. Parse defects (minus/defects : ... up to inclusions/kelengkapan)
  const defectMatch = rawDetails.match(
    /(?:minus\/defects|minus|defects)\s*:\s*([\s\S]*?)(?=(?:\n\s*🎀|\n\s*inclusions|\n\s*kelengkapan|$))/i
  );
  let defects: string | null = defectMatch ? defectMatch[1].trim() : null;
  if (defects) {
    // Clean out emoji-only marks or empty dashes
    if (/^[❌\s\-\.]+$/.test(defects) || defects.toLowerCase() === "none") {
      defects = null;
    }
  }

  // 3. Parse inclusions
  const incMatch = rawDetails.match(/(?:inclusions|kelengkapan)\s*:\s*([\s\S]*)/i);
  let inclusions: string[] = [];
  if (incMatch) {
    const cleaned = incMatch[1].replace(
      /[\u22b9\u08ea\u02d6\u2606\u5f61\ud83c\udf80\n]/g,
      ", "
    );
    inclusions = cleaned
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && !s.startsWith(":"));
  }

  return { conditionGrade, defects, inclusions };
}

interface RawPrice {
  currency: string;
  amount: number;
}

async function seed() {
  console.log("🌸 Starting vintagemeew database seed...");

  const dataDir = path.join(process.cwd(), "data");

  // Load scraped datasets
  const brandsRaw = JSON.parse(
    fs.readFileSync(path.join(dataDir, "brands.json"), "utf8")
  );
  const tagsRaw = JSON.parse(
    fs.readFileSync(path.join(dataDir, "tags.json"), "utf8")
  );
  const productsRaw = JSON.parse(
    fs.readFileSync(path.join(dataDir, "products.json"), "utf8")
  );

  const CLEAN_CATEGORIES = [
    {
      name: "Digital Pocket / Digicam",
      slug: "digital-pocket",
      description: "Kamera digital saku ringkas dengan sensor CCD/CMOS vintage",
    },
    {
      name: "Point & Shoot",
      slug: "point-shoot",
      description: "Kamera otomatis praktis tinggal bidik dan jepret",
    },
    {
      name: "Mirrorless",
      slug: "mirrorless",
      description: "Kamera digital dengan sensor besar & lensa lepas-tukar",
    },
    {
      name: "DSLR",
      slug: "dslr",
      description: "Kamera refleks digital untuk fotografi profesional",
    },
    {
      name: "Film / Analog Camera",
      slug: "film-analog",
      description: "Kamera roll film 35mm nuansa analog klasik",
    },
    {
      name: "Camcorder / Handycam",
      slug: "camcorder-handycam",
      description: "Perekam video digital format vintage Y2K",
    },
    {
      name: "Instax / Instant Camera",
      slug: "instax-instant",
      description: "Kamera cetak foto langsung instan",
    },
    {
      name: "Aksesoris & Lensa",
      slug: "accessories-lenses",
      description: "Baterai, memory card, strap, charger, dan aksesoris kamera",
    },
  ];

  console.log(`[1/6] Seeding ${CLEAN_CATEGORIES.length} curated categories...`);
  const catIdMap: Record<string, string> = {};

  for (const c of CLEAN_CATEGORIES) {
    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, c.slug))
      .limit(1);

    if (existing) {
      catIdMap[c.slug] = existing.id;
    } else {
      const [inserted] = await db
        .insert(categories)
        .values({
          name: c.name,
          slug: c.slug,
          description: c.description,
        })
        .returning({ id: categories.id });
      catIdMap[c.slug] = inserted.id;
    }
  }

  console.log(`[2/6] Seeding ${brandsRaw.length + EXTRA_BRANDS.length} brands...`);
  for (const b of brandsRaw) {
    await db
      .insert(brands)
      .values({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logoUrl: null,
      })
      .onConflictDoNothing();
  }
  for (const name of EXTRA_BRANDS) {
    await db
      .insert(brands)
      .values({ name, slug: name.toLowerCase().replace(/\s+/g, "-"), logoUrl: null })
      .onConflictDoNothing();
  }

  console.log(`[3/6] Seeding tags...`);
  const CONDITION_LABELS_TO_PRUNE = new Set([
    "Brand New",
    "Like New",
    "Very good",
    "Good",
    "Used",
  ]);

  const validTagIds = new Set<string>();

  for (const t of tagsRaw) {
    // Skip condition labels because condition_grade replaces them
    if (CONDITION_LABELS_TO_PRUNE.has(t.name)) {
      continue;
    }

    // Convert non-condition tags like Wifi to promo kind
    const kind = t.slug === "wifi" ? "promo" : t.kind;

    await db
      .insert(tags)
      .values({
        id: t.id,
        name: t.name,
        slug: t.slug,
        kind: kind,
        colorHex: t.color || "#ec4899",
      })
      .onConflictDoNothing();

    validTagIds.add(t.id);
  }

  console.log(`[4/6] Seeding ${productsRaw.length} products & images...`);
  for (const p of productsRaw) {
    const { conditionGrade, defects, inclusions } = parseDetails(p.details);

    // IDR price extraction
    let priceIdr = p.display_price;
    if (Array.isArray(p.prices)) {
      const idrObj = (p.prices as RawPrice[]).find((pr) => pr.currency === "IDR");
      if (idrObj && idrObj.amount) {
        priceIdr = idrObj.amount;
      }
    }

    // If conditionGrade is missing, deactivate product
    const isActive = conditionGrade ? Boolean(p.active) : false;

    // Map to clean category
    const upperName = (p.name || "").toUpperCase();
    let resolvedCatId = catIdMap["digital-pocket"];
    if (
      upperName.includes("SX610") ||
      upperName.includes("SX730") ||
      upperName.includes("SX740") ||
      upperName.includes("RX100") ||
      upperName.includes("P310")
    ) {
      resolvedCatId = catIdMap["point-shoot"];
    }

    await db
      .insert(products)
      .values({
        id: p.id,
        name: p.name,
        slug: p.slug,
        brandId: p.brand_id,
        categoryId: resolvedCatId,
        description: p.description?.trim() || null,
        conditionGrade: conditionGrade ? String(conditionGrade) : null,
        defects: defects,
        inclusions: inclusions,
        detailsRaw: p.details?.trim() || null,
        features: Array.isArray(p.features) ? p.features : [],
        specifications: Array.isArray(p.specifications) ? p.specifications : [],
        priceIdr: Number(priceIdr),
        stock: p.stock ?? 1,
        weightGrams: p.weight_grams ?? null,
        isFeatured: Boolean(p.featured),
        active: isActive,
      })
      .onConflictDoNothing();

    // Seed product images (position sorted, first image is primary)
    if (Array.isArray(p.images)) {
      for (let idx = 0; idx < p.images.length; idx++) {
        const img = p.images[idx];
        await db
          .insert(productImages)
          .values({
            id: img.id,
            productId: p.id,
            url: img.url,
            objectKey: img.object_key,
            kind: "body",
            position: idx,
            isPrimary: idx === 0,
          })
          .onConflictDoNothing();
      }
    }

    // Seed product tags
    if (Array.isArray(p.tags)) {
      for (const t of p.tags) {
        if (validTagIds.has(t.id)) {
          await db
            .insert(productTags)
            .values({
              productId: p.id,
              tagId: t.id,
            })
            .onConflictDoNothing();
        }
      }
    }
  }

  console.log(`[5/6] Seeding default banners, testimonials & payment methods...`);
  // banners tidak punya unique key selain id → cek dulu agar reseed tidak menduplikasi
  const [existingBanner] = await db.select({ id: banners.id }).from(banners).limit(1);
  if (!existingBanner) {
    await db.insert(banners).values({
      title: "Digicam pilihan, sudah dites",
      subtitle: "Stok 1 unit per kamera. Minus bodi dicatat apa adanya.",
      imageUrl: "https://minio.girlyglimpse.com/girly-glimpse-products/products/0ebf8455-f0b1-4157-85d6-2c869189aae7/1792338002223991291-32ad6860.jpeg",
      ctaText: "Lihat katalog",
      ctaUrl: "/products",
      sortOrder: 0,
      isActive: true,
    });
  }

  const defaultPayments = [
    {
      code: "QRIS_INSTANT",
      name: "QRIS Instan (GoPay, OVO, ShopeePay, BCA, Mandiri)",
      accountNumber: null,
      accountHolder: "vintagemeew Official",
      qrImageUrl: "https://minio.girlyglimpse.com/static/sample-qris.png",
      instructions:
        "Scan QRIS dengan aplikasi m-Banking atau E-Wallet apa pun. Simpan bukti transfer untuk diunggah di halaman invoice.",
      isActive: true,
      sortOrder: 1,
    },
    {
      code: "BCA_TRANSFER",
      name: "Transfer Bank BCA",
      accountNumber: "8730291823",
      accountHolder: "VINTAGEMEEW KEDIRI",
      qrImageUrl: null,
      instructions:
        "Transfer ke nomor rekening BCA di atas. Pastikan nominal transfer sesuai dengan total invoice.",
      isActive: true,
      sortOrder: 2,
    },
    {
      code: "MANDIRI_TRANSFER",
      name: "Transfer Bank Mandiri",
      accountNumber: "1230098765432",
      accountHolder: "VINTAGEMEEW KEDIRI",
      qrImageUrl: null,
      instructions:
        "Transfer ke nomor rekening Bank Mandiri di atas. Upload slip transfer untuk verifikasi admin.",
      isActive: true,
      sortOrder: 3,
    },
  ];

  for (const pm of defaultPayments) {
    await db.insert(paymentMethods).values(pm).onConflictDoNothing();
  }

  // selaraskan data lama di DB (rekening masih "JKT")
  await db
    .update(paymentMethods)
    .set({ accountHolder: "VINTAGEMEEW KEDIRI" })
    .where(eq(paymentMethods.accountHolder, "VINTAGEMEEW JKT"));

  const [existingTesti] = await db.select({ id: testimonials.id }).from(testimonials).limit(1);
  if (!existingTesti) {
    await db.insert(testimonials).values(
      DEFAULT_TESTIMONIALS.map((t) => ({
        customerName: t.customerName,
        rating: t.rating,
        content: t.content,
        sortOrder: t.sortOrder,
        isActive: true,
      })),
    );
  }

  console.log(`[6/6] Seeding default store settings...`);
  const defaultSettings = [
    {
      key: "store_name",
      value: "vintagemeew",
      description: "Nama resmi toko",
    },
    {
      key: "store_tagline",
      value: "Kurasi Kamera Digital Saku Vintage & Preloved",
      description: "Tagline header",
    },
    {
      key: "whatsapp_number",
      value: "6281295661659",
      description: "Nomor WhatsApp admin",
    },
    {
      key: "shipping_fee_utama",
      value: "25000",
      description: "Ongkos kirim Zona Utama (Flat IDR)",
    },
    {
      key: "shipping_fee_luar",
      value: "45000",
      description: "Ongkos kirim Zona Luar (Flat IDR)",
    },
    {
      key: "provinces_zona_utama",
      value: JSON.stringify([
        "DKI Jakarta",
        "Jawa Barat",
        "Banten",
        "Jawa Tengah",
        "DI Yogyakarta",
        "Jawa Timur",
      ]),
      description: "Daftar provinsi zona utama",
    },
    {
      key: "auto_cancel_hours",
      value: "2",
      description: "Batas waktu auto-cancel pesanan pending (jam)",
    },
    {
      key: "running_banner_text",
      value: "Ongkir Flat 2 Zona se-Indonesia • Semua Unit Dites Sebelum Dikirim",
      description: "Teks berjalan di atas navbar",
    },
    {
      key: "store_address",
      value: "Pare, Kediri, Jawa Timur",
      description: "Alamat fisik / lokasi toko",
    },
  ];

  for (const s of defaultSettings) {
    await db.insert(settings).values(s).onConflictDoNothing();
  }

  console.log("🎉 Seeding completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
