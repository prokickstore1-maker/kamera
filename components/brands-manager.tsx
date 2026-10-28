"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tag, Plus, Trash2, ExternalLink, Search, Camera } from "lucide-react";
import { createBrandAction, deleteBrandAction } from "@/lib/admin-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type BrandItem = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  productCount: number;
};

export function BrandsManager({ initialBrands }: { initialBrands: BrandItem[] }) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [newBrandName, setNewBrandName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const filtered = initialBrands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim() || newBrandName.trim().length < 2) {
      toast.error("Nama merek minimal 2 karakter.");
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.append("name", newBrandName.trim());

    try {
      const res = await createBrandAction(fd);
      if (res.ok) {
        toast.success(`Merek "${newBrandName.trim()}" berhasil ditambahkan!`);
        setNewBrandName("");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menambahkan merek.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat menambahkan merek.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBrand = async (id: string, name: string, count: number) => {
    if (count > 0) {
      toast.error(`Tidak dapat menghapus merek "${name}" karena masih memiliki ${count} unit kamera.`);
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus merek "${name}"?`)) return;

    const fd = new FormData();
    fd.append("id", id);

    try {
      const res = await deleteBrandAction(fd);
      if (res.ok) {
        toast.success(`Merek "${name}" berhasil dihapus.`);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus merek.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat menghapus merek.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            <span>Kelola Merek Kamera</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar seluruh brand digicam. Merek yang memiliki unit aktif otomatis tampil di beranda &amp; katalog pembeli.
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs px-2.5 py-1 font-bold">
          Total: {initialBrands.length} Merek
        </Badge>
      </div>

      {/* Form Tambah Brand Baru */}
      <Card className="border-border shadow-xs bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <span>Tambah Merek Kamera Baru</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Ketik nama produsen/brand kamera (contoh: Olympus, Casio, Contax, Minolta, Kodak, Leica, Ricoh, Yashica).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddBrand} className="flex flex-col sm:flex-row gap-2.5 max-w-lg">
            <Input
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="Ketik nama merek kamera baru…"
              disabled={submitting}
              className="h-10 text-xs sm:text-sm flex-1"
            />
            <Button
              type="submit"
              disabled={submitting || !newBrandName.trim()}
              className="h-10 rounded-xl px-5 text-xs font-bold shrink-0"
            >
              {submitting ? "Menyimpan…" : "+ Tambah Merek"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search & Filter */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari merek kamera…"
            className="h-9 w-full rounded-full pl-8 text-xs bg-card"
          />
        </div>
        <p className="text-xs text-muted-foreground font-semibold">
          Menampilkan {filtered.length} dari {initialBrands.length} merek
        </p>
      </div>

      {/* Grid Kartu Merek */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((b) => (
          <Card key={b.id} className="p-4 shadow-2xs border-border/80 bg-card flex flex-col justify-between hover:border-primary/50 transition-all">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm text-foreground truncate">{b.name}</h3>
                  <p className="text-[10px] font-mono text-muted-foreground">slug: {b.slug}</p>
                </div>
                {b.productCount > 0 ? (
                  <Badge variant="default" className="text-[9px] font-bold shrink-0 px-2 py-0.5">
                    Aktif di Toko
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[9px] font-bold shrink-0 px-2 py-0.5 text-muted-foreground">
                    0 Produk
                  </Badge>
                )}
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Camera className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>
                  {b.productCount > 0 ? (
                    <strong className="text-foreground">{b.productCount} Unit Kamera Terdaftar</strong>
                  ) : (
                    <span>Belum ada kamera yang memakai merek ini</span>
                  )}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8 text-[11px] rounded-lg gap-1.5 px-2.5 font-semibold"
              >
                <Link href={`/products?brand=${b.slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 text-primary" />
                  <span>Lihat di Katalog</span>
                </Link>
              </Button>

              {b.productCount === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteBrand(b.id, b.name, b.productCount)}
                  className="h-8 text-[11px] rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2"
                  title="Hapus merek ini"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline ml-1">Hapus</span>
                </Button>
              )}
            </div>
          </Card>
        ))}

        {!filtered.length && (
          <div className="col-span-full py-12 text-center text-xs text-muted-foreground bg-card border border-border rounded-2xl">
            Tidak ada merek kamera yang cocok dengan kata kunci &ldquo;{search}&rdquo;.
          </div>
        )}
      </div>
    </div>
  );
}
