import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { products, brands, tags, productTags } from "@/db/schema";
import { desc, eq, ilike, getTableColumns } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-session";
import { rupiah } from "@/lib/format";
import { conditionLabel } from "@/lib/condition";
import { StockStepper } from "@/components/stock-stepper";
import { ProductRowActions } from "@/components/product-row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Search, Plus, Flame, Star } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Inventaris Produk | Admin", robots: { index: false } };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const sp = await searchParams;
  const q = sp.q?.trim();

  let rows: (typeof products.$inferSelect & { brandName: string | null })[] = [];
  let mostWantedSet = new Set<string>();
  try {
    const [prodRows, mwRows] = await Promise.all([
      db
        .select({ ...getTableColumns(products), brandName: brands.name })
        .from(products)
        .leftJoin(brands, eq(products.brandId, brands.id))
        .where(q ? ilike(products.name, `%${q}%`) : undefined)
        .orderBy(desc(products.createdAt))
        .limit(200),
      db
        .select({ productId: productTags.productId })
        .from(productTags)
        .innerJoin(tags, eq(productTags.tagId, tags.id))
        .where(eq(tags.slug, "best-seller")),
    ]);
    rows = prodRows;
    mostWantedSet = new Set(mwRows.map((r) => r.productId));
  } catch {
    rows = [];
    mostWantedSet = new Set();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <span>Inventaris Digicam</span>
          </h1>
          <span className="text-xs font-semibold text-muted-foreground">{rows.length} unit kamera terdaftar</span>
        </div>

        <Button asChild size="sm" className="rounded-full shadow-xs gap-1.5 font-bold text-xs h-9 px-4">
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" />
            <span>Tambah Kamera Baru</span>
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <form method="GET" className="flex items-center gap-2 max-w-sm flex-1">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Cari kamera (Sony, Canon, G7X...)"
              className="h-9 w-full rounded-full pl-8 text-xs"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="rounded-full text-xs h-9 px-4">
            Cari
          </Button>
        </form>
      </div>

      <div className="md:hidden space-y-3">
        {rows.map((p) => {
          const isMw = mostWantedSet.has(p.id);
          return (
            <Card key={p.id} className="p-3.5 shadow-xs border-border/80 bg-card">
              <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2.5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${p.slug}`}
                    className="font-bold text-sm text-foreground hover:text-primary transition-colors truncate block"
                  >
                    {p.name}
                  </Link>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="text-[11px] text-muted-foreground">
                      {p.brandName ?? "Tanpa merek"} • {conditionLabel(p.conditionGrade) ?? "belum diinspeksi"}
                    </span>
                    {isMw && (
                      <Badge variant="destructive" className="text-[9px] px-1.5 py-0 font-bold uppercase gap-1">
                        <Flame className="h-2.5 w-2.5" />
                        <span>Most Wanted</span>
                      </Badge>
                    )}
                    {p.isFeatured && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1.5 py-0 font-bold uppercase gap-1"
                      >
                        <Star className="h-2.5 w-2.5" />
                        <span>Unggulan</span>
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge
                  variant={p.active ? "default" : "secondary"}
                  className="text-[10px] uppercase font-bold shrink-0"
                >
                  {p.active ? "AKTIF" : "DRAFT"}
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                    Harga
                  </span>
                  <p className="font-mono font-bold text-sm text-foreground">{rupiah(p.priceIdr)}</p>
                  <Badge variant="outline" className="font-bold text-[10px] mt-1">
                    Kondisi: {p.conditionGrade ? `${Number(p.conditionGrade).toFixed(1)}/10` : "N/A"}
                  </Badge>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-1">
                    Stok Unit
                  </span>
                  <StockStepper productId={p.id} stock={p.stock} />
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">Aksi Katalog:</span>
                <ProductRowActions
                  productId={p.id}
                  productName={p.name}
                  isMostWanted={isMw}
                  isFeatured={p.isFeatured}
                />
              </div>
            </Card>
          );
        })}

        {!rows.length && (
          <Card className="p-8 text-center text-muted-foreground text-xs">
            Tidak ada produk ditemukan.
          </Card>
        )}
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/40">
              <TableRow>
                <TableHead>Produk &amp; Brand</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Kondisi</TableHead>
                <TableHead>Stok Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi Cepat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => {
                const isMw = mostWantedSet.has(p.id);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/product/${p.slug}`}
                          className="font-bold text-foreground hover:text-primary transition-colors"
                        >
                          {p.name}
                        </Link>
                        {isMw && (
                          <Badge variant="destructive" className="text-[9px] px-1.5 py-0 font-bold uppercase gap-1">
                            <Flame className="h-2.5 w-2.5" />
                            <span>Most Wanted</span>
                          </Badge>
                        )}
                        {p.isFeatured && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1.5 py-0 font-bold uppercase gap-1"
                          >
                            <Star className="h-2.5 w-2.5" />
                            <span>Unggulan</span>
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {p.brandName ?? "Tanpa merek"} • {conditionLabel(p.conditionGrade) ?? "belum diinspeksi"}
                      </p>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-foreground">
                      {rupiah(p.priceIdr)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold text-xs">
                        {p.conditionGrade ? `${Number(p.conditionGrade).toFixed(1)}/10` : "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StockStepper productId={p.id} stock={p.stock} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={p.active ? "default" : "secondary"}
                        className="text-[10px] uppercase font-bold"
                      >
                        {p.active ? "AKTIF" : "DRAFT"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ProductRowActions
                        productId={p.id}
                        productName={p.name}
                        isMostWanted={isMw}
                        isFeatured={p.isFeatured}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                    Tidak ada produk ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-[11px] text-muted-foreground">
        Gunakan tombol + atau − untuk memperbarui stok unit secara langsung, atau ikon di kolom kanan untuk menandai Most Wanted, Unggulan, dan menghapus produk. Ringkasan penjualan tersedia di{" "}
        <Link href="/admin" className="text-primary hover:underline font-semibold">
          dashboard
        </Link>
        .
      </p>
    </div>
  );
}
