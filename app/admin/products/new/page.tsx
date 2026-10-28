import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { brands, categories } from "@/db/schema";
import { isAdmin } from "@/lib/admin-session";
import { ProductForm } from "@/components/product-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Upload Produk Baru | Admin",
  robots: { index: false },
};

export default async function NewProductPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  let allBrands: { id: string; name: string }[] = [];
  let allCats: { id: string; name: string }[] = [];

  try {
    allBrands = await db
      .select({ id: brands.id, name: brands.name })
      .from(brands)
      .orderBy(brands.name);

    allCats = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .orderBy(categories.name);
  } catch {
    allBrands = [];
    allCats = [];
  }

  return <ProductForm brands={allBrands} categories={allCats} />;
}
