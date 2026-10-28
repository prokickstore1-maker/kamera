import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, listActiveTestimonials } from "@/lib/catalog";
import { conditionLabel } from "@/lib/condition";
import { rupiah } from "@/lib/format";
import { ProductGallery } from "@/components/product-gallery";
import { AddToCartButton } from "@/components/add-to-cart";
import { TestimonialsSection } from "@/components/testimonials-section";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await getProduct(slug);
    if (!p || !p.active) return { title: "Kamera tidak ditemukan | vintaagemeew" };
    return {
      title: `${p.name} | vintaagemeew`,
      description: `${p.name} ${conditionLabel(p.conditionGrade) ?? ""} ${rupiah(p.priceIdr)}. ${p.description ?? ""}`.trim(),
      openGraph: { images: p.images[0]?.url ? [p.images[0].url] : [] },
    };
  } catch {
    return { title: "vintaagemeew" };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let p: Awaited<ReturnType<typeof getProduct>> = null;
  let testimonials: Awaited<ReturnType<typeof listActiveTestimonials>> = [];
  try {
    [p, testimonials] = await Promise.all([
      getProduct(slug),
      listActiveTestimonials(12),
    ]);
  } catch {
    p = null;
  }
  if (!p || !p.active) notFound();

  const label = conditionLabel(p.conditionGrade);
  const grade = p.conditionGrade ? Number(p.conditionGrade) : null;
  const soldOut = p.stock <= 0;
  const hasSpecsOrWeight = Boolean((p.specs && p.specs.length > 0) || p.weightGrams);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
        <span aria-hidden>/</span>
        <Link href="/products" className="hover:text-primary transition-colors">Katalog</Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-foreground">{p.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={p.images} name={p.name} />

        <div>
          {(() => {
            const seen = new Set<string>();
            const badges: string[] = [];
            const ignored = new Set(["best seller", "best-seller", "hot", "fan fave"]);
            const norm = (s: string) => s.trim().toLowerCase();
            const catNorm = p.categoryName ? norm(p.categoryName) : "";

            for (const f of p.features ?? []) {
              const n = norm(f);
              if (!seen.has(n) && n !== catNorm && !ignored.has(n)) {
                seen.add(n);
                badges.push(f);
              }
            }
            for (const t of p.tagNames ?? []) {
              const n = norm(t);
              if (!seen.has(n) && n !== catNorm && !ignored.has(n)) {
                seen.add(n);
                badges.push(t);
              }
            }

            if (!badges.length) return null;

            return (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {badges.slice(0, 3).map((text) => (
                  <span key={text} className="y2k-pill-badge">
                    {text}
                  </span>
                ))}
              </div>
            );
          })()}

          <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{p.name}</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {[p.brandName, p.categoryName].filter(Boolean).join(" • ")}
          </p>

          <p className="mt-4 text-2xl sm:text-3xl font-extrabold font-mono text-primary">{rupiah(p.priceIdr)}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {grade !== null ? (
              <span className="inline-flex items-baseline gap-1 rounded-xl border border-primary/20 bg-secondary px-3 py-1.5">
                <strong className="text-lg font-extrabold font-mono text-secondary-foreground">
                  {grade.toFixed(1).replace(".0", "")}
                </strong>
                <span className="text-xs font-semibold text-secondary-foreground/80">/ 10</span>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Kondisi sedang diinspeksi</span>
            )}
            {label && <span className="y2k-pill-badge">{label}</span>}
            <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
              {soldOut ? "Stok habis" : `Stok tersedia: ${p.stock} unit`}
            </span>
          </div>

          <div className="mt-6">
            <AddToCartButton
              product={{
                productId: p.id,
                slug: p.slug,
                name: p.name,
                price: p.priceIdr,
                imageUrl: p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? null,
                stock: p.stock,
              }}
            />
          </div>

          <section className="mt-6 space-y-3.5 text-sm">
            <div className="y2k-card p-4">
              <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Catatan Fisik &amp; Minus
              </h2>
              {p.defects && p.defects.trim() ? (
                <p className="mt-1.5 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-foreground">
                  {p.defects}
                </p>
              ) : (
                <p className="mt-1.5 text-xs sm:text-sm font-semibold text-emerald-700">
                  ✓ Tidak ada minus fungsi maupun fisik yang mengganggu
                </p>
              )}
            </div>

            <div className="y2k-card p-4">
              <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Kelengkapan Paket
              </h2>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {(p.inclusions ?? []).length ? (
                  p.inclusions!.map((i) => (
                    <span
                      key={i}
                      className="rounded-full border border-primary/20 bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground"
                    >
                      {i}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Unit kamera saja (sesuai deskripsi)</span>
                )}
              </div>
            </div>

            {hasSpecsOrWeight && (
              <div className="y2k-card p-4">
                <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Spesifikasi Teknis
                </h2>
                <dl className="mt-2.5 divide-y divide-border">
                  {(p.specs ?? []).map((s) => (
                    <div key={s.key} className="grid grid-cols-3 gap-2 py-2">
                      <dt className="text-xs font-medium text-muted-foreground">{s.key}</dt>
                      <dd className="col-span-2 text-xs font-semibold text-foreground">{s.value}</dd>
                    </div>
                  ))}
                  {p.weightGrams ? (
                    <div className="grid grid-cols-3 gap-2 py-2">
                      <dt className="text-xs font-medium text-muted-foreground">Berat Estimasi</dt>
                      <dd className="col-span-2 text-xs font-semibold text-foreground">{p.weightGrams} gram</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            )}

            {p.description && (
              <div className="y2k-card p-4">
                <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                  Deskripsi Kurator
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed text-foreground">{p.description}</p>
              </div>
            )}

            {p.detailRaw && (
              <details className="y2k-card p-4">
                <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Rincian Lengkap dari Toko
                </summary>
                <p className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                  {p.detailRaw}
                </p>
              </details>
            )}
          </section>
        </div>
      </div>

      <TestimonialsSection items={testimonials} />
    </div>
  );
}
