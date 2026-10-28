"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useHydrated } from "@/lib/use-hydrated";
import { cartActions, useCart, cartSubtotal, getSnapshotOnce } from "@/lib/cart";
import { cartStock } from "@/lib/actions";
import { rupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ShoppingBag, Trash2, Minus, Plus, ArrowRight } from "lucide-react";

export function CartView() {
  const items = useCart();
  const mounted = useHydrated();

  // sinkron stok/harga dari server saat halaman keranjang dibuka (M-2)
  useEffect(() => {
    if (!mounted) return;
    const ids = getSnapshotOnce().map((i) => i.productId);
    if (!ids.length) return;
    void cartStock(ids).then((rows) => {
      if (rows.length) cartActions.sync(rows);
    });
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary animate-pulse">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">Memuat keranjang belanja…</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="py-20 text-center max-w-sm mx-auto space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary border border-border text-primary">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-foreground">Keranjang Anda Kosong</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Belum ada kamera yang disimpan. Jelajahi katalog untuk melihat unit yang tersedia.
          </p>
        </div>
        <Button asChild size="lg" className="rounded-full shadow-sm">
          <Link href="/products">Ke Katalog Kamera</Link>
        </Button>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);
  const soldOut = items.some((i) => i.stock <= 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <ul className="space-y-3">
        {items.map((i) => {
          const atMax = i.qty >= i.stock;
          return (
            <li key={i.productId}>
              <Card className="overflow-hidden p-3.5 sm:p-4 transition-all hover:border-primary/40">
                <div className="grid grid-cols-[88px_1fr] gap-3.5 sm:gap-4 items-center">
                  <div className="aspect-square overflow-hidden rounded-xl bg-secondary relative border border-border/60">
                    {i.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.imageUrl} alt={i.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        Tanpa foto
                      </div>
                    )}
                    {i.stock <= 0 && (
                      <Badge variant="destructive" className="absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0">
                        Habis
                      </Badge>
                    )}
                  </div>

                  <div className="min-w-0 flex flex-col justify-between h-full">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/product/${i.slug}`}
                          className="line-clamp-2 text-sm font-bold text-foreground hover:text-primary transition-colors"
                        >
                          {i.name}
                        </Link>
                        <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                          {rupiah(i.price)} • Stok tersedia: {i.stock}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => cartActions.remove(i.productId)}
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0"
                        aria-label={`Hapus ${i.name} dari keranjang`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="Kurangi jumlah"
                          className="h-9 w-9 rounded-full"
                          onClick={() => cartActions.setQty(i.productId, i.qty - 1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <Input
                          aria-label={`Jumlah ${i.name}`}
                          inputMode="numeric"
                          value={i.qty}
                          onChange={(e) => cartActions.setQty(i.productId, Number(e.target.value))}
                          className="h-9 w-12 rounded-xl text-center text-xs font-bold px-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="Tambah jumlah"
                          disabled={atMax}
                          title={atMax ? `Maksimal stok tersedia (${i.stock} unit)` : "Tambah jumlah"}
                          className="h-9 w-9 rounded-full"
                          onClick={() => cartActions.setQty(i.productId, i.qty + 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                        {atMax && i.stock > 0 && (
                          <span className="text-[11px] font-semibold text-muted-foreground ml-1">
                            Maks. stok
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-extrabold text-primary font-mono">
                        {rupiah(i.price * i.qty)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <aside>
        <Card className="sticky top-20">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Ringkasan Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">Subtotal Produk</dt>
                <dd className="font-bold text-foreground font-mono">{rupiah(subtotal)}</dd>
              </div>
              <div className="flex justify-between items-center text-muted-foreground text-xs">
                <dt>Ongkir Flat 2 Zona</dt>
                <dd>Dihitung saat checkout</dd>
              </div>
              <Separator />
              <div className="flex justify-between items-baseline pt-1">
                <dt className="font-bold text-foreground">Total Sementara</dt>
                <dd className="text-lg font-extrabold text-primary font-mono">{rupiah(subtotal)}</dd>
              </div>
            </dl>

            {soldOut ? (
              <Button
                type="button"
                size="lg"
                disabled
                className="w-full text-sm font-bold rounded-full"
              >
                Ada Produk Habis di Keranjang
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="w-full text-sm font-bold shadow-sm hover:shadow-md transition-all rounded-full"
              >
                <Link href="/checkout" className="flex items-center justify-center gap-2">
                  <span>Lanjut ke Pembayaran</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <p className="text-center text-[11px] text-muted-foreground">
              Checkout langsung tanpa perlu membuat akun.
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
