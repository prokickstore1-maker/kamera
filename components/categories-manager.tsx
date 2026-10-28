"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FolderTree, Plus, Trash2, ExternalLink, Search, Camera } from "lucide-react";
import { createCategoryAction, deleteCategoryAction } from "@/lib/admin-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  productCount: number;
};

export function CategoriesManager({ initialCategories }: { initialCategories: CategoryItem[] }) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [newCatName, setNewCatName] = React.useState("");
  const [newCatDesc, setNewCatDesc] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const filtered = initialCategories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || newCatName.trim().length < 2) {
      toast.error("Nama kategori minimal 2 karakter.");
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.append("name", newCatName.trim());
    if (newCatDesc.trim()) {
      fd.append("description", newCatDesc.trim());
    }

    try {
      const res = await createCategoryAction(fd);
      if (res.ok) {
        toast.success(`Kategori "${newCatName.trim()}" berhasil ditambahkan!`);
        setNewCatName("");
        setNewCatDesc("");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menambahkan kategori.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat menambahkan kategori.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string, count: number) => {
    if (count > 0) {
      toast.error(`Tidak dapat menghapus kategori "${name}" karena masih memiliki ${count} unit kamera.`);
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${name}"?`)) return;

    const fd = new FormData();
    fd.append("id", id);

    try {
      const res = await deleteCategoryAction(fd);
      if (res.ok) {
        toast.success(`Kategori "${name}" berhasil dihapus.`);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus kategori.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat menghapus kategori.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-primary" />
            <span>Kelola Kategori Kamera</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar klasifikasi jenis kamera (Digicam, Point &amp; Shoot, Mirrorless, dll). Kategori aktif otomatis tampil di katalog pembeli.
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs px-2.5 py-1 font-bold">
          Total: {initialCategories.length} Kategori
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Kolom Kiri: Form Tambah Kategori */}
        <Card className="md:col-span-1 shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              <span>Tambah Kategori Baru</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Tambahkan jenis kamera baru ke dalam sistem vintagemeew.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCategory} className="space-y-3.5">
              <div className="space-y-1.5">
                <label htmlFor="cat-name" className="text-xs font-semibold">
                  Nama Kategori <span className="text-destructive">*</span>
                </label>
                <Input
                  id="cat-name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Contoh: Film / Analog Camera"
                  className="h-9 text-xs"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="cat-desc" className="text-xs font-semibold">
                  Deskripsi Singkat (Opsional)
                </label>
                <Input
                  id="cat-desc"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Contoh: Kamera roll film 35mm"
                  className="h-9 text-xs"
                  disabled={submitting}
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || !newCatName.trim()}
                className="w-full h-9 text-xs font-bold gap-1.5 bg-primary text-white hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{submitting ? "Menyimpan..." : "Simpan Kategori"}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Kolom Kanan: Tabel / List Kategori */}
        <Card className="md:col-span-2 shadow-xs border-border/80">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold">Daftar Kategori Terdaftar</CardTitle>
                <CardDescription className="text-xs">
                  {filtered.length} dari {initialCategories.length} kategori ditampilkan
                </CardDescription>
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cari kategori..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 divide-y divide-border/60">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Tidak ada kategori yang cocok dengan &quot;{search}&quot;.
              </div>
            ) : (
              filtered.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3.5 sm:px-4 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-foreground truncate">
                        {cat.name}
                      </span>
                      <code className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                        {cat.slug}
                      </code>
                    </div>
                    {cat.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {cat.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cat.productCount > 0 ? (
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-semibold gap-1 py-0.5 px-2 bg-primary/10 text-primary border border-primary/20"
                      >
                        <Camera className="h-3 w-3" />
                        <span>{cat.productCount} unit</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground py-0.5 px-2">
                        0 unit
                      </Badge>
                    )}

                    {cat.productCount > 0 && (
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Link
                          href={`/products?category=${cat.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Lihat di Katalog Toko"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={cat.productCount > 0}
                      onClick={() => handleDeleteCategory(cat.id, cat.name, cat.productCount)}
                      className={
                        cat.productCount > 0
                          ? "h-8 w-8 opacity-30 cursor-not-allowed text-muted-foreground"
                          : "h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      }
                      title={
                        cat.productCount > 0
                          ? "Kategori ini masih memiliki unit kamera aktif"
                          : "Hapus Kategori"
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
