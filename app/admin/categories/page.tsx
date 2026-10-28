import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-session";
import { CategoriesManager, type CategoryItem } from "@/components/categories-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Kelola Kategori Kamera | Admin",
  robots: { index: false },
};

export default async function AdminCategoriesPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  let catRows: CategoryItem[] = [];
  try {
    const raw = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        createdAt: categories.createdAt,
        productCount: count(products.id),
      })
      .from(categories)
      .leftJoin(products, eq(products.categoryId, categories.id))
      .groupBy(categories.id, categories.name, categories.slug, categories.description, categories.createdAt)
      .orderBy(desc(count(products.id)), categories.name);

    catRows = raw.map((r) => ({
      ...r,
      productCount: Number(r.productCount ?? 0),
    }));
  } catch {
    catRows = [];
  }

  return <CategoriesManager initialCategories={catRows} />;
}
