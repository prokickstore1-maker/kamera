"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, Search, Menu, PackageSearch, X } from "lucide-react";
import { useCart, cartCount } from "@/lib/cart";
import { useHydrated } from "@/lib/use-hydrated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function CartNavButton() {
  const items = useCart();
  const n = cartCount(items);
  const mounted = useHydrated();
  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className="h-10 px-3 text-xs font-bold tracking-wider text-foreground hover:bg-secondary hover:text-primary transition-colors"
    >
      <Link href="/cart" aria-label="Keranjang Belanja" className="flex items-center gap-1.5">
        <ShoppingBag className="h-4 w-4" />
        <span className="hidden sm:inline">Keranjang</span>
        <span className="rounded-full bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-secondary-foreground">
          {mounted ? n : 0}
        </span>
      </Link>
    </Button>
  );
}

export function ShopShell({
  children,
  bannerText,
}: {
  children: React.ReactNode;
  bannerText?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = pathname.startsWith("/admin");
  if (isAdmin) return <>{children}</>;

  const announcement =
    bannerText && bannerText.trim().length > 0
      ? bannerText.trim()
      : "Ongkir flat 2 zona se-Indonesia • Semua unit kamera dites fungsi sebelum dikirim";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-foreground focus:text-background"
      >
        Lewati ke konten utama
      </a>

      <div className="w-full bg-secondary/90 border-b border-border py-2 px-4 text-foreground text-[11px] font-semibold tracking-wide">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <p className="truncate">
            <span className="text-primary font-bold mr-1.5" aria-hidden>✦</span>
            {announcement}
          </p>
          <div className="hidden md:flex items-center gap-4 text-muted-foreground text-[11px] shrink-0">
            <Link href="/track-order" className="hover:text-primary transition-colors">
              Lacak Pesanan
            </Link>
            <span aria-hidden>•</span>
            <Link href="/returns" className="hover:text-primary transition-colors">
              Garansi &amp; Retur
            </Link>
            <span aria-hidden>•</span>
            <Link href="/specifications" className="hover:text-primary transition-colors">
              Panduan Kamera
            </Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 gap-2 lg:gap-6">
          <div className="md:hidden flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-secondary"
                  aria-label="Menu navigasi"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-60 rounded-2xl border-border bg-card p-1.5 shadow-lg"
              >
                <DropdownMenuItem asChild className="rounded-xl py-2.5">
                  <Link href="/products" className="text-xs font-bold text-primary">
                    Semua Katalog Kamera
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-xl py-2">
                  <Link href="/products?brand=canon" className="text-xs">
                    Canon Ixus / PowerShot
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl py-2">
                  <Link href="/products?brand=sony" className="text-xs">
                    Sony Cyber-shot
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl py-2">
                  <Link href="/products?brand=nikon" className="text-xs">
                    Nikon Coolpix
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl py-2">
                  <Link href="/products?brand=fujifilm" className="text-xs">
                    Fujifilm FinePix
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl py-2">
                  <Link href="/products?brand=olympus" className="text-xs">
                    Olympus Mju / Camedia
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl py-2">
                  <Link href="/products?brand=casio" className="text-xs">
                    Casio Exilim
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-xl py-2">
                  <Link href="/track-order" className="text-xs">
                    Lacak Pesanan
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl py-2">
                  <Link href="/returns" className="text-xs">
                    Garansi &amp; Retur
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl py-2">
                  <Link href="/specifications" className="text-xs">
                    Panduan Spesifikasi
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center justify-center md:justify-start flex-1 md:flex-initial shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl font-black tracking-[0.14em] sm:tracking-[0.18em] text-foreground uppercase hover:opacity-85 transition-opacity whitespace-nowrap"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.jpg"
                alt="vintagemeew logo"
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover border border-border shrink-0 shadow-2xs"
              />
              <span>
                VINTAGE<span className="text-primary">MEEW</span>
              </span>
            </Link>
          </div>

          <nav
            aria-label="Navigasi utama"
            className="hidden md:flex items-center gap-3.5 lg:gap-5 text-xs font-bold tracking-wider text-muted-foreground"
          >
            <Link
              href="/products"
              className="text-foreground underline decoration-primary/70 decoration-2 underline-offset-4 hover:text-primary transition-colors whitespace-nowrap"
            >
              Semua Kamera
            </Link>
            <Link href="/products?brand=canon" className="hover:text-primary transition-colors whitespace-nowrap">
              Canon
            </Link>
            <Link href="/products?brand=sony" className="hover:text-primary transition-colors whitespace-nowrap">
              Sony
            </Link>
            <Link href="/products?brand=nikon" className="hover:text-primary transition-colors whitespace-nowrap">
              Nikon
            </Link>
            <Link href="/products?brand=fujifilm" className="hidden lg:inline hover:text-primary transition-colors whitespace-nowrap">
              Fujifilm
            </Link>
            <Link href="/products?brand=olympus" className="hidden xl:inline hover:text-primary transition-colors whitespace-nowrap">
              Olympus
            </Link>
            <Link href="/products" className="text-xs font-bold text-primary hover:underline transition-all whitespace-nowrap">
              + Brand Lain
            </Link>
          </nav>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen((v) => !v)}
              aria-expanded={searchOpen}
              aria-label="Cari kamera"
              className="h-10 px-2.5 sm:px-3 text-xs font-bold tracking-wider text-foreground hover:bg-secondary hover:text-primary transition-colors"
            >
              {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              <span className="hidden md:inline">Cari</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden sm:inline-flex h-10 px-2.5 text-xs font-bold tracking-wider text-foreground hover:bg-secondary hover:text-primary transition-colors"
            >
              <Link href="/track-order" className="flex items-center gap-1.5">
                <PackageSearch className="h-4 w-4" />
                <span className="hidden lg:inline">Lacak</span>
              </Link>
            </Button>

            <CartNavButton />
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-border bg-card px-4 py-3 sm:px-6">
            <form
              action="/products"
              method="GET"
              onSubmit={(e) => {
                e.preventDefault();
                const q = searchQuery.trim();
                setSearchOpen(false);
                router.push(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
              }}
              className="mx-auto flex max-w-2xl items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  name="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari model kamera, seri, atau sensor (mis. Canon Ixus, Sony W830, CCD)..."
                  autoFocus
                  className="h-10 rounded-full pl-10 pr-4 text-xs sm:text-sm"
                />
              </div>
              <Button type="submit" size="sm" className="h-10 rounded-full px-5 text-xs font-bold">
                Cari Kamera
              </Button>
            </form>
          </div>
        )}
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border bg-card text-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 grid gap-10 md:grid-cols-4 text-xs">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.jpg"
                alt="vintagemeew logo"
                className="h-7 w-7 rounded-full object-cover border border-border shrink-0"
              />
              <p className="text-sm font-black tracking-[0.18em] uppercase text-foreground">
                VINTAGE<span className="text-primary">MEEW</span>
              </p>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Kurasi kamera digital saku (digicam) era 2000-an preloved &amp; unit baru. Dites satu per satu, catatan kondisi transparan, dan siap dipakai memotret.
            </p>
          </div>

          <div className="space-y-2.5">
            <p className="font-bold tracking-wider uppercase text-foreground text-[11px]">Koleksi Kamera</p>
            <Link href="/products?brand=canon" className="block py-0.5 text-muted-foreground hover:text-primary transition-colors">
              Canon Ixus / PowerShot
            </Link>
            <Link href="/products?brand=sony" className="block py-0.5 text-muted-foreground hover:text-primary transition-colors">
              Sony Cyber-shot
            </Link>
            <Link href="/products?brand=nikon" className="block py-0.5 text-muted-foreground hover:text-primary transition-colors">
              Nikon Coolpix
            </Link>
            <Link href="/products" className="block py-0.5 font-semibold text-primary hover:underline transition-colors">
              Lihat Semua Katalog →
            </Link>
          </div>

          <div className="space-y-2.5">
            <p className="font-bold tracking-wider uppercase text-foreground text-[11px]">Layanan Pembeli</p>
            <Link href="/track-order" className="block py-0.5 text-muted-foreground hover:text-primary transition-colors">
              Lacak Status Pesanan
            </Link>
            <Link href="/returns" className="block py-0.5 text-muted-foreground hover:text-primary transition-colors">
              Kebijakan Garansi &amp; Retur
            </Link>
            <Link href="/specifications" className="block py-0.5 text-muted-foreground hover:text-primary transition-colors">
              Panduan Spesifikasi Digicam
            </Link>
          </div>

          <div className="space-y-2.5">
            <p className="font-bold tracking-wider uppercase text-foreground text-[11px]">Standar Inspeksi</p>
            <p className="text-muted-foreground leading-relaxed">
              Setiap unit diperiksa secara menyeluruh: mekanisme lensa zoom, tombol shutter, lampu flash, slot memori, dan kualitas sensor.
            </p>
            <p className="text-primary pt-1 font-semibold">Pare, Kediri, Jawa Timur</p>
          </div>
        </div>

        <div className="border-t border-border/60 py-6 text-center text-[11px] tracking-wider text-muted-foreground">
          © {new Date().getFullYear()} vintagemeew • Pare, Kediri.
        </div>
      </footer>
    </div>
  );
}
