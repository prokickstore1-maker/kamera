import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { brands, categories, productImages, products, productTags, tags } from "@/db/schema";
import { isAdmin } from "@/lib/admin-session";
import { ProductForm } from "@/components/product-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Edit Kamera | Admin",
  robots: { index: false },
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) notFound();

  const [brandRows, categoryRows, imageRows, mwRows] = await Promise.all([
    db.select({ id: brands.id, name: brands.name }).from(brands).orderBy(asc(brands.name)),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.name)),
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.position)),
    db
      .select({ tagId: productTags.tagId })
      .from(productTags)
      .innerJoin(tags, eq(productTags.tagId, tags.id))
      .where(and(eq(productTags.productId, id), eq(tags.slug, "best-seller")))
      .limit(1),
  ]);

  return (
    <ProductForm
      brands={brandRows}
      categories={categoryRows}
      initialProduct={{
        id: product.id,
        name: product.name,
        brandId: product.brandId,
        categoryId: product.categoryId,
        priceIdr: product.priceIdr,
        stock: product.stock,
        weightGrams: product.weightGrams,
        conditionGrade: product.conditionGrade,
        defects: product.defects,
        inclusions: product.inclusions ?? [],
        description: product.description,
        features: product.features ?? [],
        isFeatured: product.isFeatured,
        isMostWanted: mwRows.length > 0,
        active: product.active,
        images: imageRows.map((img, idx) => ({
          url: img.url,
          kind: img.kind === "sample" ? "sample" : "body",
          isPrimary: img.isPrimary,
          position: img.position ?? idx,
        })),
      }}
    />
  );
}

