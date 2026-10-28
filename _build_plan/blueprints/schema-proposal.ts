import { pgTable, text, integer, boolean, timestamp, jsonb, uuid, varchar, numeric, type AnyPgColumn } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * 1. KATEGORI & BRAND KAMERA
 */
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "set null" }), // data scrape punya parent_id
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const brands = pgTable("brands", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * 2. TAGS (badge/fitur: Best Seller, Pink, Celebrity Pick, Wifi)
 */
export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  kind: varchar("kind", { length: 30 }).notNull().default("promo"), // 'condition' | 'promo'; hanya promo jadi facet
  colorHex: varchar("color_hex", { length: 10 }).default("#ec4899"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * 3. PRODUK KAMERA
 * Satu baris = satu unit kamera. Tidak ada tabel varian.
 * Harga IDR saja; USD dari scrape diabaikan.
 */
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 280 }).notNull().unique(),
  brandId: uuid("brand_id").references(() => brands.id, { onDelete: "set null" }),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),

  description: text("description"),
  conditionGrade: numeric("condition_grade", { precision: 3, scale: 1 }), // 1.0-10.0, diparse dari "N/10 body condition" saat seeder; data mengandung desimal (8.5, 9.5)
  defects: text("defects"),                   // minus/defects, null = tidak ada
  inclusions: jsonb("inclusions").$type<string[]>().default([]), // baterai, charger, memory card, dll
  detailsRaw: text("details_raw"),            // teks asli hasil scrape, arsip
  features: jsonb("features").$type<string[]>().default([]), // teks badge bebas di PDP, bukan facet filter
  specifications: jsonb("specifications").$type<{ key: string; value: string }[]>().default([]),

  priceIdr: integer("price_idr").notNull(),
  // units tunggal untuk kamera preloved; produk brand-new/bundle boleh punya stok >1 dari data.
  stock: integer("stock").notNull().default(1),
  weightGrams: integer("weight_grams"), // info tampil saja, bukan dasar ongkir

  isFeatured: boolean("is_featured").notNull().default(false),
  active: boolean("active").notNull().default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * 4. FOTO PRODUK (satu galeri: bodi + sample shots, urutan position)
 * Dataset awal tidak menandai sample shots dan semua position bernilai 0;
 * admin wajib menata ulang urutan dan menandai kind sebelum produk dipublikasikan.
 */
export const productImages = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  objectKey: text("object_key"),
  kind: varchar("kind", { length: 20 }).notNull().default("body"), // 'body' | 'sample'
  position: integer("position").notNull().default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * 5. RELASI PRODUK & TAGS
 */
export const productTags = pgTable("product_tags", {
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  tagId: uuid("tag_id").references(() => tags.id, { onDelete: "cascade" }).notNull(),
});

/**
 * 6. METODE PEMBAYARAN (QRIS & REKENING BANK)
 */
export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  accountNumber: varchar("account_number", { length: 80 }),
  accountHolder: varchar("account_holder", { length: 120 }),
  qrImageUrl: text("qr_image_url"),
  instructions: text("instructions"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

/**
 * 7. PESANAN
 * expiresAt dipakai auto-cancel PENDING_PAYMENT.
 */
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: varchar("order_number", { length: 60 }).notNull().unique(), // VMW-20261027-001
  idempotencyKey: varchar("idempotency_key", { length: 100 }).unique(),

  customerName: varchar("customer_name", { length: 150 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 30 }).notNull(),
  customerEmail: varchar("customer_email", { length: 150 }),

  addressLine: text("address_line").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  postalCode: varchar("postal_code", { length: 10 }).notNull(),

  subtotalAmount: integer("subtotal_amount").notNull(),
  shippingFee: integer("shipping_fee").notNull().default(0),
  totalAmount: integer("total_amount").notNull(),

  status: varchar("status", { length: 40 }).notNull().default("PENDING_PAYMENT"),
  expiresAt: timestamp("expires_at").notNull(), // auto-cancel ambang waktu
  stockRestoredAt: timestamp("stock_restored_at"), // idempotensi restock: null = belum dikembalikan

  paymentMethodId: uuid("payment_method_id").references(() => paymentMethods.id),
  paymentSnapshot: jsonb("payment_snapshot").$type<{
    code: string;
    name: string;
    accountNumber?: string;
    accountHolder?: string;
    qrImageUrl?: string;
  }>(),

  proofImageUrl: text("proof_image_url"),
  proofUploadedAt: timestamp("proof_uploaded_at"),

  courierName: varchar("courier_name", { length: 60 }),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  internalNotes: text("internal_notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * 8. RINCIAN ITEM PESANAN
 */
export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: varchar("product_name", { length: 255 }).notNull(),
  productPrice: integer("product_price").notNull(),
  quantity: integer("quantity").notNull().default(1),
  subtotal: integer("subtotal").notNull(),
});

/**
 * 9. BANNER HERO
 */
export const banners = pgTable("banners", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 150 }).notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url").notNull(),
  ctaText: varchar("cta_text", { length: 80 }),
  ctaUrl: text("cta_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * 10. PENGATURAN TOKO (KEY-VALUE)
 */
export const settings = pgTable("settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * 11. TESTIMONI PEMBELI
 */
export const testimonials = pgTable("testimonials", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  rating: integer("rating").notNull().default(5),
  content: text("content").notNull(),
  screenshotUrl: text("screenshot_url"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * RELASI
 */
export const productRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  images: many(productImages),
  tags: many(productTags),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
  paymentMethod: one(paymentMethods, { fields: [orders.paymentMethodId], references: [paymentMethods.id] }),
  items: many(orderItems),
}));
