"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Camera,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  PlusCircle,
  Tag,
  FolderTree,
  MessageSquareHeart,
  Image as ImageIcon,
} from "lucide-react";
import { logoutAction } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Kelola Pesanan", icon: ShoppingBag, exact: false },
  { href: "/admin/products", label: "Inventaris Produk", icon: Camera, exact: true },
  { href: "/admin/brands", label: "Kelola Merek", icon: Tag, exact: true },
  { href: "/admin/categories", label: "Kelola Kategori", icon: FolderTree, exact: true },
  { href: "/admin/banners", label: "Kelola Banner", icon: ImageIcon, exact: true },
  { href: "/admin/testimonials", label: "Kelola Testimoni", icon: MessageSquareHeart, exact: true },
  { href: "/admin/products/new", label: "Upload Kamera Baru", icon: PlusCircle, exact: true },
  { href: "/admin/settings", label: "Pengaturan Toko", icon: Settings, exact: false },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="space-y-1.5 px-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all group",
              isActive
                ? "bg-primary text-white shadow-xs font-bold"
                : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                isActive ? "text-white" : "text-muted-foreground group-hover:text-primary"
              )}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function AdminDesktopSidebar() {
  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-3 px-6 border-b border-border/80">
        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-primary shrink-0 shadow-xs">
          <Camera className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-sm text-foreground tracking-tight truncate">
            vintagemeew
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
              Admin Panel
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 py-6 overflow-y-auto">
        <p className="px-6 mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Menu Navigasi
        </p>
        <NavLinks />
      </div>

      <div className="border-t border-border/80 p-4 space-y-2 bg-secondary/20">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="w-full justify-start rounded-xl text-xs font-semibold h-9"
        >
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5 text-primary" />
            <span>Kunjungi Toko ↗</span>
          </Link>
        </Button>

        <form action={logoutAction}>
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className="w-full justify-start rounded-xl text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 gap-2"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Keluar Sesi</span>
          </Button>
        </form>
      </div>
    </aside>
  );
}

export function AdminMobileHeader() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur md:hidden">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-border bg-secondary/50"
              aria-label="Buka Menu Sidebar Admin"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 flex flex-col bg-card border-r border-border">
            <SheetHeader className="p-5 border-b border-border/80 text-left">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-primary shrink-0">
                  <Camera className="h-4 w-4" />
                </div>
                <div>
                  <SheetTitle className="text-sm font-extrabold text-foreground tracking-tight">
                    vintagemeew
                  </SheetTitle>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Panel Admin
                  </p>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 py-5 overflow-y-auto">
              <p className="px-5 mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Navigasi Admin
              </p>
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>

            <div className="border-t border-border/80 p-4 space-y-2 bg-secondary/20">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full justify-start rounded-xl text-xs font-semibold h-9"
              >
                <Link
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-primary" />
                  <span>Kunjungi Toko ↗</span>
                </Link>
              </Button>

              <form action={logoutAction}>
                <Button
                  variant="ghost"
                  size="sm"
                  type="submit"
                  className="w-full justify-start rounded-xl text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 gap-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Keluar Sesi</span>
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/admin" className="font-extrabold text-sm tracking-tight text-foreground flex items-center gap-1.5">
          <span>vintagemeew</span>
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-bold uppercase">
            Admin
          </Badge>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="text-xs h-9 px-3 rounded-full">
          <Link href="/" target="_blank" rel="noopener noreferrer">
            Toko ↗
          </Link>
        </Button>
      </div>
    </header>
  );
}
