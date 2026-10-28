import type { Metadata } from "next";
import Link from "next/link";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { listProducts, catalogFacets, type CatalogFilters } from "@/lib/catalog";
import { ProductCard, EmptyState } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Katalog Digicam | vintagemeew",
  description: "Kamera digital saku vintage & preloved terkurasi. Filter brand, kategori, kondisi fisik, fitur, dan rentang harga.",
};

const PAGE = 16;
const arr = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

const SORTS = [
  ["featured", "Unggulan"],
  ["price_asc", "Termurah"],
  ["price_desc", "Termahal"],
  ["newest", "Terbaru"],
] as const;

const CONDITIONS = [
  ["gte9", "9–10 (Like New / Excellent)"],
  ["gte7", "7–8.9 (Very Good / Good)"],
  ["lt7", "Di bawah 7"],
] as const;

const VALID_CONDITIONS = new Set<CatalogFilters["condition"]>(["gte9", "gte7", "lt7"]);
const VALID_SORTS = new Set<CatalogFilters["sort"]>(["featured", "price_asc", "price_desc", "newest"]);

function href(next: Record<string, string | string[] | undefined>, page?: number) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (!v) continue;
    (Array.isArray(v) ? v : [v]).forEach((x) => x && sp.append(k, x));
  }
  if (page && page > 1) sp.set("page", String(page));
  const q = sp.toString();
  return `/products${q ? `?${q}` : ""}`;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const rawCond = typeof sp.condition === "string" ? sp.condition : undefined;
  const condition = rawCond && VALID_CONDITIONS.has(rawCond as CatalogFilters["condition"])
    ? (rawCond as CatalogFilters["condition"])
    : undefined;

  const rawSort = typeof sp.sort === "string" ? sp.sort : "featured";
  const sort = VALID_SORTS.has(rawSort as CatalogFilters["sort"])
    ? (rawSort as CatalogFilters["sort"])
    : "featured";

  const search = typeof sp.search === "string" && sp.search.trim() ? sp.search.trim() : undefined;

  const filters: CatalogFilters = {
    search,
    brand: arr(sp.brand),
    category: arr(sp.category),
    tag: arr(sp.tag),
    condition,
    minPrice: sp.min ? Number(sp.min) : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
    sort,
    limit: PAGE,
    offset: (page - 1) * PAGE,
  };

  let data = { items: [] as Awaited<ReturnType<typeof listProducts>>["items"], total: 0 };
  let facets: Awaited<ReturnType<typeof catalogFacets>> = { brands: [], categories: [], tags: [] };
  let dbDown = false;
  try {
    [data, facets] = await Promise.all([listProducts(filters), catalogFacets()]);
  } catch {
    dbDown = true;
  }

  const pages = Math.max(1, Math.ceil(data.total / PAGE));
  const now = { ...sp, page: undefined };
  const toggle = (key: "brand" | "category" | "tag", value: string) => {
    const cur = arr(sp[key]);
    const next = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
    return href({ ...now, [key]: next.length ? next : undefined });
  };

  const activeCount =
    arr(sp.brand).length +
    arr(sp.category).length +
    arr(sp.tag).length +
    (condition ? 1 : 0) +
    (sp.min || sp.max ? 1 : 0) +
    (search ? 1 : 0);

  const filterContent = (
    <>
      <Filter title="Brand">
        {facets.brands.map((b) => (
          <Chip key={b.slug} href={toggle("brand", b.slug)} active={arr(sp.brand).includes(b.slug)}>
            {b.name}
          </Chip>
        ))}
      </Filter>
      <Filter title="Kategori">
        {facets.categories.map((c) => (
          <Chip key={c.slug} href={toggle("category", c.slug)} active={arr(sp.category).includes(c.slug)}>
            {c.name}
          </Chip>
        ))}
      </Filter>
      <Filter title="Kondisi Fisik">
        {CONDITIONS.map(([v, label]) => (
          <Chip
            key={v}
            href={href({ ...now, condition: condition === v ? undefined : v })}
            active={condition === v}
          >
            {label}
          </Chip>
        ))}
      </Filter>
      {facets.tags.length > 0 && (
        <Filter title="Fitur Tambahan">
          {facets.tags.map((t) => (
            <Chip key={t.slug} href={toggle("tag", t.slug)} active={arr(sp.tag).includes(t.slug)}>
              {t.name}
            </Chip>
          ))}
        </Filter>
      )}
      <Filter title="Rentang Harga (IDR)">
        <form action="/products" method="GET" className="flex flex-col gap-2.5">
          {arr(sp.brand).map((b) => (
            <input key={`brand-${b}`} type="hidden" name="brand" value={b} />
          ))}
          {arr(sp.category).map((c) => (
            <input key={`cat-${c}`} type="hidden" name="category" value={c} />
          ))}
          {arr(sp.tag).map((t) => (
            <input key={`tag-${t}`} type="hidden" name="tag" value={t} />
          ))}
          {condition && <input type="hidden" name="condition" value={condition} />}
          {search && <input type="hidden" name="search" value={search} />}
          {sort && sort !== "featured" && <input type="hidden" name="sort" value={sort} />}

          <div className="flex items-center gap-2">
            <Input
              name="min"
              type="number"
              inputMode="numeric"
              placeholder="Min"
              aria-label="Harga minimum"
              defaultValue={typeof sp.min === "string" ? sp.min : ""}
              className="h-9 rounded-xl px-3 text-xs"
            />
            <span className="text-xs text-muted-foreground">s/d</span>
            <Input
              name="max"
              type="number"
              inputMode="numeric"
              placeholder="Maks"
              aria-label="Harga maksimum"
              defaultValue={typeof sp.max === "string" ? sp.max : ""}
              className="h-9 rounded-xl px-3 text-xs"
            />
          </div>
          <Button type="submit" size="sm" className="h-9 rounded-full text-xs font-bold shadow-xs">
            Terapkan Harga
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Isi nominal Rupiah tanpa titik (contoh: 2500000).
          </p>
        </form>
      </Filter>
      {activeCount > 0 && (
        <Button asChild variant="ghost" size="sm" className="h-9 justify-start px-2 text-xs font-bold text-primary">
          <Link href="/products">
            <X className="h-3.5 w-3.5" />
            <span>Reset Semua Filter ({activeCount})</span>
          </Link>
        </Button>
      )}
    </>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Koleksi Toko</p>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Katalog Kamera</h1>
          </div>
          <span className="y2k-pill-badge">
            {dbDown ? "Memuat ulang" : `${data.total} unit ditemukan`}
          </span>
        </div>

        <form action="/products" method="GET" className="flex flex-wrap items-center gap-2">
          {arr(sp.brand).map((b) => (
            <input key={`s-brand-${b}`} type="hidden" name="brand" value={b} />
          ))}
          {arr(sp.category).map((c) => (
            <input key={`s-cat-${c}`} type="hidden" name="category" value={c} />
          ))}
          {arr(sp.tag).map((t) => (
            <input key={`s-tag-${t}`} type="hidden" name="tag" value={t} />
          ))}
          {condition && <input type="hidden" name="condition" value={condition} />}
          {typeof sp.min === "string" && sp.min && <input type="hidden" name="min" value={sp.min} />}
          {typeof sp.max === "string" && sp.max && <input type="hidden" name="max" value={sp.max} />}
          {sort && sort !== "featured" && <input type="hidden" name="sort" value={sort} />}

          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              name="search"
              defaultValue={search ?? ""}
              placeholder="Cari nama kamera, seri, atau fitur (mis. Canon Ixus, CCD, Flip Screen)..."
              className="h-10 w-full rounded-full pl-10 pr-4 text-xs sm:text-sm"
            />
          </div>
          <Button type="submit" className="h-10 rounded-full px-5 text-xs font-bold shadow-xs">
            Cari
          </Button>
          {search && (
            <Button asChild variant="outline" className="h-10 rounded-full px-3.5 text-xs font-semibold">
              <Link href={href({ ...now, search: undefined })}>
                <X className="h-3.5 w-3.5" />
                <span>Hapus kata kunci</span>
              </Link>
            </Button>
          )}
        </form>
      </header>

      <details className="lg:hidden mb-5 rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
        <summary className="cursor-pointer font-bold text-xs flex items-center justify-between text-foreground py-1">
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span>Filter &amp; Spesifikasi {activeCount > 0 ? `(${activeCount} Aktif)` : ""}</span>
          </span>
          <span className="text-primary font-bold text-xs">Buka Filter ▾</span>
        </summary>
        <div className="mt-3.5 pt-3.5 border-t border-border space-y-5">
          {filterContent}
        </div>
      </details>

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block space-y-5 y2k-card p-4 h-fit">
          {filterContent}
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Urutkan:</span>
            {SORTS.map(([v, label]) => (
              <Chip key={v} href={href({ ...now, sort: v })} active={sort === v}>
                {label}
              </Chip>
            ))}
          </div>

          {dbDown ? (
            <EmptyState
              title="Katalog kamera sedang disiapkan"
              hint="Silakan muat ulang halaman beberapa saat lagi."
            />
          ) : data.items.length === 0 ? (
            <EmptyState
              title="Tidak ada kamera yang cocok"
              hint="Coba kurangi filter yang aktif atau gunakan kata kunci pencarian lain."
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {data.items.map((p, i) => (
                <ProductCard key={p.id} p={p} priority={i < 4} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Paginasi katalog">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={href(now, n)}
                  aria-current={n === page ? "page" : undefined}
                  className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-xs font-bold transition-colors ${
                    n === page
                      ? "bg-primary text-white shadow-xs"
                      : "border border-border bg-card hover:border-primary hover:text-primary"
                  }`}
                >
                  {n}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

function Filter({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ href: h, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={h}
      className={`inline-flex min-h-8 items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "bg-primary text-white shadow-2xs"
          : "border border-border bg-card text-foreground hover:border-primary hover:text-primary"
      }`}
    >
      {children}
    </Link>
  );
}
