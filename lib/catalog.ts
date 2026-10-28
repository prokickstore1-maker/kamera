/** Query katalog — satu tempat semua baca produk untuk storefront. */
import { db } from "@/db";
import {
  products,
  brands,
  categories,
  productImages,
  productTags,
  tags,
  banners,
  testimonials,
  paymentMethods,
  settings,
} from "@/db/schema";
import { eq, and, desc, asc, sql, ilike, or, inArray, lte, gte, count } from "drizzle-orm";

export type ProductListItem = {
  id: string;
  slug: string;
  name: string;
  priceIdr: number;
  stock: number;
  conditionGrade: string | null;
  features: string[] | null;
  isFeatured: boolean;
  createdAt: Date;
  brandName: string | null;
  categoryName: string | null;
  primaryImage: string | null;
  tagNames: string[];
};

export type CatalogFilters = {
  search?: string;
  brand?: string[];
  category?: string[];
  condition?: "gte9" | "gte7" | "lt7";
  tag?: string[];
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
  sort?: "featured" | "price_asc" | "price_desc" | "newest";
};

const PAGE_SIZE = 16;

function condWhere(condition: CatalogFilters["condition"]) {
  if (condition === "gte9") return gte(products.conditionGrade, "9");
  if (condition === "gte7") return and(gte(products.conditionGrade, "7"), lte(products.conditionGrade, "8.9"));
  if (condition === "lt7") return sql`${products.conditionGrade} < 7`;
  return undefined;
}

/** Lengkapi item dengan foto utama + nama tag dalam dua query batch. */
async function hydrate(rows: Omit<ProductListItem, "primaryImage" | "tagNames">[]): Promise<ProductListItem[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [imgs, tagRows] = await Promise.all([
    db
      .select({ productId: productImages.productId, url: productImages.url, position: productImages.position, isPrimary: productImages.isPrimary })
      .from(productImages)
      .where(inArray(productImages.productId, ids))
      .orderBy(productImages.position),
    db
      .select({ productId: productTags.productId, name: tags.name })
      .from(productTags)
      .innerJoin(tags, eq(productTags.tagId, tags.id))
      .where(and(inArray(productTags.productId, ids), eq(tags.kind, "promo"))),
  ]);

  const primary = new Map<string, string>();
  for (const im of imgs) {
    const cur = primary.get(im.productId);
    if (!cur || (im.isPrimary && !cur.startsWith("P:"))) primary.set(im.productId, `${im.isPrimary ? "P:" : ""}${im.url}`);
  }
  const tagBy = new Map<string, string[]>();
  for (const t of tagRows) tagBy.set(t.productId, [...(tagBy.get(t.productId) ?? []), t.name]);

  return rows.map((r) => ({
    ...r,
    primaryImage: primary.get(r.id)?.replace(/^P:/, "") ?? null,
    tagNames: tagBy.get(r.id) ?? [],
  }));
}

export async function listProducts(f: CatalogFilters = {}): Promise<{ items: ProductListItem[]; total: number }> {
  const conditions = [eq(products.active, true)];

  if (f.search) {
    const q = `%${f.search}%`;
    conditions.push(
      or(
        ilike(products.name, q),
        ilike(products.description, q),
        sql`exists (select 1 from jsonb_array_elements_text(${products.features}) feat where feat ilike ${q})`,
      )!,
    );
  }
  if (f.minPrice !== undefined && Number.isFinite(f.minPrice)) conditions.push(gte(products.priceIdr, f.minPrice));
  if (f.maxPrice !== undefined && Number.isFinite(f.maxPrice)) conditions.push(lte(products.priceIdr, f.maxPrice));
  const c = condWhere(f.condition);
  if (c) conditions.push(c);

  if (f.brand?.length) {
    const rows = await db.select({ id: brands.id }).from(brands).where(inArray(brands.slug, f.brand));
    if (!rows.length) return { items: [], total: 0 };
    conditions.push(inArray(products.brandId, rows.map((r) => r.id)));
  }
  if (f.category?.length) {
    const rows = await db.select({ id: categories.id }).from(categories).where(inArray(categories.slug, f.category));
    if (!rows.length) return { items: [], total: 0 };
    conditions.push(inArray(products.categoryId, rows.map((r) => r.id)));
  }
  if (f.tag?.length) {
    // filter multi-tag: produk harus punya SEMUA tag terpilih (AND antartag)
    for (const slug of f.tag) {
      conditions.push(
        sql`exists (select 1 from product_tags pt join tags t on t.id = pt.tag_id where pt.product_id = ${products.id} and t.slug = ${slug})`,
      );
    }
  }

  const where = and(...conditions);
  const order =
    f.sort === "price_asc"
      ? [asc(products.priceIdr)]
      : f.sort === "price_desc"
        ? [desc(products.priceIdr)]
        : f.sort === "newest"
          ? [desc(products.createdAt)]
          : [sql`${products.isFeatured} desc`, desc(products.createdAt)];

  const [rows, [cnt]] = await Promise.all([
    db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        priceIdr: products.priceIdr,
        stock: products.stock,
        conditionGrade: products.conditionGrade,
        features: products.features,
        isFeatured: products.isFeatured,
        createdAt: products.createdAt,
        brandName: brands.name,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(...order)
      .limit(f.limit ?? PAGE_SIZE)
      .offset(f.offset ?? 0),
    db.select({ n: count() }).from(products).where(where),
  ]);

  return { items: await hydrate(rows), total: Number(cnt.n) };
}

/** Opsi filter — nilai DISTINCT dari data aktif. */
export async function catalogFacets() {
  const [brandRows, catRows, tagRows] = await Promise.all([
    db
      .select({ slug: brands.slug, name: brands.name })
      .from(brands)
      .innerJoin(products, eq(products.brandId, brands.id))
      .where(eq(products.active, true))
      .groupBy(brands.id, brands.slug, brands.name)
      .orderBy(brands.name),
    db
      .select({ slug: categories.slug, name: categories.name })
      .from(categories)
      .innerJoin(products, eq(products.categoryId, categories.id))
      .where(eq(products.active, true))
      .groupBy(categories.id, categories.slug, categories.name)
      .orderBy(categories.name),
    db
      .select({ slug: tags.slug, name: tags.name })
      .from(tags)
      .innerJoin(productTags, eq(productTags.tagId, tags.id))
      .innerJoin(products, eq(productTags.productId, products.id))
      .where(and(eq(products.active, true), eq(tags.kind, "promo")))
      .groupBy(tags.id, tags.slug, tags.name)
      .orderBy(tags.name),
  ]);

  const JUNK_TAGS = new Set([
    "best-seller",
    "hot",
    "fan-fave",
    "thai-it-girls-fav",
    "hailey-biebers",
    "kendall-jenners",
    "madison-beers",
  ]);

  const catSlugs = new Set(catRows.map((c) => c.slug));
  const curatedTags = tagRows.filter((t) => !JUNK_TAGS.has(t.slug) && !catSlugs.has(t.slug));

  return { brands: brandRows, categories: catRows, tags: curatedTags };
}

export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  detailRaw: string | null;
  priceIdr: number;
  stock: number;
  conditionGrade: string | null;
  defects: string | null;
  inclusions: string[] | null;
  features: string[] | null;
  specs: { key: string; value: string }[] | null;
  weightGrams: number | null;
  isFeatured: boolean;
  active: boolean;
  brandName: string | null;
  categoryName: string | null;
  images: { url: string; kind: string; position: number; isPrimary: boolean }[];
  tagNames: string[];
};

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  const [row] = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      description: products.description,
      detailRaw: products.detailsRaw,
      priceIdr: products.priceIdr,
      stock: products.stock,
      conditionGrade: products.conditionGrade,
      defects: products.defects,
      inclusions: products.inclusions,
      features: products.features,
      specs: products.specifications,
      weightGrams: products.weightGrams,
      isFeatured: products.isFeatured,
      active: products.active,
      brandName: brands.name,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.active, true)))
    .limit(1);

  if (!row) return null;

  const [imgs, tagRows] = await Promise.all([
    db
      .select({ url: productImages.url, kind: productImages.kind, position: productImages.position, isPrimary: productImages.isPrimary })
      .from(productImages)
      .where(eq(productImages.productId, row.id))
      .orderBy(productImages.position),
    db
      .select({ name: tags.name })
      .from(productTags)
      .innerJoin(tags, eq(productTags.tagId, tags.id))
      .where(and(eq(productTags.productId, row.id), eq(tags.kind, "promo"))),
  ]);

  return { ...row, images: imgs, tagNames: tagRows.map((t) => t.name) };
}

const LIST_COLUMNS = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  priceIdr: products.priceIdr,
  stock: products.stock,
  conditionGrade: products.conditionGrade,
  features: products.features,
  isFeatured: products.isFeatured,
  createdAt: products.createdAt,
  brandName: brands.name,
  categoryName: categories.name,
};

/** Section beranda. */
export async function homeSections() {
  const [best, newest, featured, bannerRows, testiRows, statRows, brandRows] = await Promise.all([
    db
      .select({ id: products.id })
      .from(products)
      .innerJoin(productTags, eq(productTags.productId, products.id))
      .innerJoin(tags, eq(productTags.tagId, tags.id))
      .where(and(eq(tags.slug, "best-seller"), eq(products.active, true)))
      .orderBy(desc(products.isFeatured), desc(products.createdAt))
      .limit(8),
    db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.active, true))
      .orderBy(desc(products.createdAt))
      .limit(8),
    db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.active, true), eq(products.isFeatured, true)))
      .orderBy(desc(products.createdAt))
      .limit(8),
    db.select().from(banners).where(eq(banners.isActive, true)).orderBy(banners.sortOrder),
    db
      .select()
      .from(testimonials)
      .where(eq(testimonials.isActive, true))
      .orderBy(testimonials.sortOrder, desc(testimonials.createdAt))
      .limit(9),
    db
      .select({
        total: count(),
        termurah: sql<number>`coalesce(min(${products.priceIdr}),0)::int`,
        termahal: sql<number>`coalesce(max(${products.priceIdr}),0)::int`,
      })
      .from(products)
      .where(eq(products.active, true)),
    db
      .select({ id: brands.id, name: brands.name, slug: brands.slug })
      .from(brands)
      .innerJoin(products, eq(products.brandId, brands.id))
      .where(eq(products.active, true))
      .groupBy(brands.id, brands.name, brands.slug)
      .orderBy(brands.name),
  ]);

  const ids = [...new Set([...best, ...newest, ...featured].map((r) => r.id))];
  const rows = ids.length
    ? await db
        .select(LIST_COLUMNS)
        .from(products)
        .leftJoin(brands, eq(products.brandId, brands.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(inArray(products.id, ids))
    : [];
  const items = await hydrate(rows);
  const byId = new Map(items.map((i) => [i.id, i]));
  const pick = (list: { id: string }[]) => list.map((r) => byId.get(r.id)).filter((x): x is ProductListItem => !!x);

  const stat = statRows[0];

  return {
    sections: { best: pick(best), newest: pick(newest), featured: pick(featured) },
    banners: bannerRows,
    testimonials: testiRows,
    brands: brandRows,
    stats: {
      total: Number(stat?.total ?? 0),
      termurah: Number(stat?.termurah ?? 0),
      termahal: Number(stat?.termahal ?? 0),
    },
  };
}

export async function settingsMap(): Promise<Record<string, string>> {
  const rows = await db.select({ key: settings.key, value: settings.value }).from(settings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function activePaymentMethods() {
  return db.select().from(paymentMethods).where(eq(paymentMethods.isActive, true)).orderBy(paymentMethods.sortOrder);
}

export async function listActiveTestimonials(limit = 6) {
  return db
    .select()
    .from(testimonials)
    .where(eq(testimonials.isActive, true))
    .orderBy(testimonials.sortOrder, desc(testimonials.createdAt))
    .limit(limit);
}
