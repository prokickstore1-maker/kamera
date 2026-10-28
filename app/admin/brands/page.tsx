import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { brands, products } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-session";
import { BrandsManager, type BrandItem } from "@/components/brands-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Kelola Merek Kamera | Admin",
  robots: { index: false },
};

export default async function AdminBrandsPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  let brandRows: BrandItem[] = [];
  try {
    const raw = await db
      .select({
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        createdAt: brands.createdAt,
        productCount: count(products.id),
      })
      .from(brands)
      .leftJoin(products, eq(products.brandId, brands.id))
      .groupBy(brands.id, brands.name, brands.slug, brands.createdAt)
      .orderBy(desc(count(products.id)), brands.name);

    brandRows = raw.map((r) => ({
      ...r,
      productCount: Number(r.productCount ?? 0),
    }));
  } catch {
    brandRows = [];
  }

  return <BrandsManager initialBrands={brandRows} />;
}
