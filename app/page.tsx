import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { homeSections, type ProductListItem } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { HeroBanner } from "@/components/hero-banner";
import { TestimonialsSection } from "@/components/testimonials-section";
import { rupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

function Grid({ title, subtitle, items }: { title: string; subtitle?: string; items: ProductListItem[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-12 sm:mt-14">
      <div className="mb-5 flex items-end justify-between border-b border-border pb-3">
        <div>
          {subtitle && (
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-0.5">{subtitle}</p>
          )}
          <h2 className="text-lg font-extrabold tracking-tight text-foreground sm:text-xl">{title}</h2>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1 shrink-0 text-xs font-bold text-primary hover:underline py-1"
        >
          <span>Lihat semua</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {items.slice(0, 8).map((p, i) => (
          <ProductCard key={p.id} p={p} priority={i < 4} />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  let data: Awaited<ReturnType<typeof homeSections>> | null = null;
  let dbDown = false;
  try {
    data = await homeSections();
  } catch {
    dbDown = true;
  }

  const newest = data?.sections?.newest ?? [];
  const bestSellers = data?.sections?.best ?? [];
  const featured = data?.sections?.featured ?? [];
  const stats = data?.stats ?? { total: 0, termurah: 0, termahal: 0 };
  const hero = featured[0] ?? newest[0] ?? bestSellers[0] ?? null;

  return (
    <div className="pb-16">
      <section className="relative border-b border-border bg-gradient-to-b from-secondary/40 via-background to-background">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-16">
          <div className="flex flex-col justify-center">
            <div className="mb-4">
              <span className="y2k-pill-badge">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                Kurasi Digicam Era 2000-an
              </span>
            </div>

            <h1 className="text-[clamp(2.6rem,7vw,5rem)] leading-[0.95] font-black tracking-tight text-foreground">
              Digicam{" "}
              <span className="font-display italic font-normal text-primary">
                Vintage
              </span>
              <span className="text-primary">.</span>
            </h1>

            <p className="mt-4 max-w-lg text-base font-bold leading-snug text-foreground sm:text-lg">
              Kamera saku digital era 2000-an, <span className="text-primary">dites satu per satu</span> dan dikirim siap pakai memotret.
            </p>

            <div className="mt-4 max-w-lg space-y-3">
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Kami memeriksa fungsi optik, layar, flash, dan tombol setiap digicam{" "}
                <strong className="font-semibold text-foreground">preloved &amp; unit baru</strong> sebelum masuk katalog.
              </p>

              <ul className="grid gap-2 pt-2 border-t border-border text-xs sm:text-[13px] text-foreground">
                <li className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                    <Check className="h-3 w-3" />
                  </span>
                  <span>
                    <strong className="font-bold">Kondisi fisik</strong> ditulis terbuka beserta skor dan catatan minus bodi
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                    <Check className="h-3 w-3" />
                  </span>
                  <span>
                    <strong className="font-bold">Kelengkapan paket</strong> dirinci jelas per unit di halaman produk
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                    <Check className="h-3 w-3" />
                  </span>
                  <span>
                    <strong className="font-bold">Hasil jepretan asli</strong> disertakan untuk melihat karakter warna sensor
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/products"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-primary/90 transition-all active:scale-95"
              >
                <span>
                  {stats.total > 0 ? `Jelajahi Katalog (${stats.total} Unit)` : "Jelajahi Katalog"}
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/specifications"
                className="inline-flex h-11 items-center rounded-full border border-border bg-card px-5 text-xs sm:text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                Panduan Memilih Digicam
              </Link>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            {hero && (
              <div className="relative z-10 w-full max-w-md">
                <Link href={`/product/${hero.slug}`} className="y2k-card group block overflow-hidden p-3 sm:p-4">
                  <div className="camera-viewfinder-frame relative aspect-[4/5] overflow-hidden rounded-xl border border-border bg-secondary/40">
                    {hero.primaryImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={hero.primaryImage}
                        alt={hero.name}
                        fetchPriority="high"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        Foto kamera
                      </div>
                    )}

                    <div className="absolute left-3 bottom-3 rounded-full border border-primary/30 bg-card/95 px-3 py-1.5 text-[11px] font-bold text-foreground shadow-sm backdrop-blur">
                      ✓ Dites 100% Fungsi Normal
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-end justify-between gap-3 pt-1">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        Sorotan Kurator
                      </p>
                      <p className="truncate text-sm sm:text-base font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors">
                        {hero.name}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm sm:text-base font-extrabold font-mono text-primary">
                      {rupiah(hero.priceIdr)}
                    </p>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-3.5 border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center gap-3 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <span className="text-primary" aria-hidden>✦</span> Brand:
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/products"
              className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-bold text-white shadow-xs hover:bg-primary/90 shrink-0 transition-colors"
            >
              {stats.total > 0 ? `Semua (${stats.total})` : "Semua"}
            </Link>
            {(data?.brands ?? []).map((b) => (
              <Link
                key={b.slug}
                href={`/products?brand=${b.slug}`}
                className="inline-flex h-9 items-center rounded-full border border-border bg-background px-4 text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-all shrink-0 hover:bg-secondary/60"
              >
                {b.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <HeroBanner banners={data?.banners ?? []} />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {dbDown ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            Katalog sedang dimuat ulang. Silakan segarkan halaman beberapa saat lagi.
          </p>
        ) : (
          <>
            <Grid title="Baru Masuk" subtitle="Koleksi Terbaru" items={newest} />
            <Grid title="Most Wanted" subtitle="Paling Banyak Dicari" items={bestSellers} />
            <Grid title="Pilihan Kurator" subtitle="Rekomendasi Toko" items={featured} />

            <TestimonialsSection items={data?.testimonials ?? []} />
          </>
        )}
      </div>
    </div>
  );
}
