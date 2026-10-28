import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = ["", "/products"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly",
    priority: p ? 0.8 : 1,
  }));

  try {
    const { db } = await import("@/db");
    const { products } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const rows = await db
      .select({ slug: products.slug, updatedAt: products.updatedAt })
      .from(products)
      .where(eq(products.active, true));
    return [
      ...staticRoutes,
      ...rows.map((r) => ({
        url: `${base}/product/${r.slug}`,
        lastModified: r.updatedAt ?? new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return staticRoutes; // DB down tetap render sitemap statis
  }
}