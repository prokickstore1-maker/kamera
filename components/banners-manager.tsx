"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Upload,
  Loader2,
  Eye,
  EyeOff,
  Pencil,
  X,
  Image as ImageIcon,
} from "lucide-react";
import {
  createBannerAction,
  updateBannerAction,
  toggleBannerActiveAction,
  deleteBannerAction,
  uploadBannerImageAction,
} from "@/lib/admin-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export type BannerRow = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  ctaText: string | null;
  ctaUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
};

export function BannersManager({ initialItems }: { initialItems: BannerRow[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ctaText, setCtaText] = useState("Lihat Katalog");
  const [ctaUrl, setCtaUrl] = useState("/products");
  const [sortOrder, setSortOrder] = useState("0");
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  const [editingBanner, setEditingBanner] = useState<BannerRow | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editCtaText, setEditCtaText] = useState("");
  const [editCtaUrl, setEditCtaUrl] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("0");
  const [editUploading, setEditUploading] = useState(false);

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    target: "create" | "edit"
  ) {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;

    if (target === "create") setUploading(true);
    else setEditUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadBannerImageAction(fd);
      if (res.ok && res.url) {
        if (target === "create") setImageUrl(res.url);
        else setEditImageUrl(res.url);
        toast.success("Gambar banner berhasil diunggah.");
      } else {
        toast.error(res.error ?? "Gagal mengunggah gambar banner.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengunggah gambar.");
    } finally {
      if (target === "create") setUploading(false);
      else setEditUploading(false);
      inputEl.value = "";
    }
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createBannerAction({
        title,
        subtitle,
        imageUrl,
        ctaText,
        ctaUrl,
        sortOrder: Number(sortOrder) || 0,
      });

      if (res.ok) {
        toast.success("Banner baru berhasil ditambahkan.");
        setTitle("");
        setSubtitle("");
        setImageUrl("");
        setCtaText("Lihat Katalog");
        setCtaUrl("/products");
        setSortOrder("0");
        router.refresh();
      } else {
        toast.error(res.error ?? "Gagal menambahkan banner.");
      }
    });
  }

  function openEditDialog(item: BannerRow) {
    setEditingBanner(item);
    setEditTitle(item.title);
    setEditSubtitle(item.subtitle ?? "");
    setEditImageUrl(item.imageUrl);
    setEditCtaText(item.ctaText ?? "Lihat Katalog");
    setEditCtaUrl(item.ctaUrl ?? "/products");
    setEditSortOrder(String(item.sortOrder ?? 0));
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingBanner) return;
    startTransition(async () => {
      const res = await updateBannerAction(editingBanner.id, {
        title: editTitle,
        subtitle: editSubtitle,
        imageUrl: editImageUrl,
        ctaText: editCtaText,
        ctaUrl: editCtaUrl,
        sortOrder: Number(editSortOrder) || 0,
      });

      if (res.ok) {
        toast.success("Banner berhasil diperbarui.");
        setEditingBanner(null);
        router.refresh();
      } else {
        toast.error(res.error ?? "Gagal memperbarui banner.");
      }
    });
  }

  function handleToggleActive(item: BannerRow) {
    startTransition(async () => {
      const res = await toggleBannerActiveAction(item.id);
      if (res.ok) {
        toast.success(
          res.isActive
            ? `Banner "${item.title}" diaktifkan di beranda.`
            : `Banner "${item.title}" disembunyikan dari beranda.`
        );
        router.refresh();
      } else {
        toast.error(res.error ?? "Gagal mengubah status banner.");
      }
    });
  }

  function handleDelete(item: BannerRow) {
    startTransition(async () => {
      const res = await deleteBannerAction(item.id);
      if (res.ok) {
        toast.success(`Banner "${item.title}" berhasil dihapus.`);
        router.refresh();
      } else {
        toast.error(res.error ?? "Gagal menghapus banner.");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card className="sticky top-20">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              <span>Tambah Banner Promo</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Unggah gambar banner beranda, atur judul, subjudul, dan tautan tombol CTA.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="banner-title" className="text-xs font-semibold">
                  Judul Banner *
                </Label>
                <Input
                  id="banner-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Digicam pilihan, sudah dites"
                  required
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="banner-subtitle" className="text-xs font-semibold">
                  Subjudul / Deskripsi Singkat
                </Label>
                <Input
                  id="banner-subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Contoh: Stok 1 unit per kamera. Minus bodi dicatat jujur."
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Gambar Banner *</Label>
                {imageUrl ? (
                  <div className="relative overflow-hidden rounded-xl border border-border bg-secondary/30 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Preview banner"
                      className="h-32 w-full rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => setImageUrl("")}
                      className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-sm"
                      aria-label="Hapus gambar banner"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-border p-4 text-center hover:border-primary/60 transition-colors bg-secondary/20">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => handleFileUpload(e, "create")}
                      disabled={uploading}
                      id="banner-photo-upload"
                      className="hidden"
                    />
                    <label
                      htmlFor="banner-photo-upload"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                    >
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        {uploading ? "Mengunggah Gambar…" : "Upload Gambar Banner"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Rekomendasi rasio landscape 21:9 (JPG, PNG, WEBP)
                      </span>
                    </label>
                  </div>
                )}

                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Atau tempel URL gambar banner..."
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label htmlFor="banner-cta" className="text-xs font-semibold">
                    Teks Tombol CTA
                  </Label>
                  <Input
                    id="banner-cta"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Lihat Katalog"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="banner-url" className="text-xs font-semibold">
                    URL Tujuan CTA
                  </Label>
                  <Input
                    id="banner-url"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="/products"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="banner-order" className="text-xs font-semibold">
                  Urutan Slide (0 = paling awal)
                </Label>
                <Input
                  id="banner-order"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={pending || uploading || !title.trim() || !imageUrl.trim()}
                className="w-full h-10 text-xs font-bold rounded-full"
              >
                {pending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan…
                  </>
                ) : (
                  <>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Simpan Banner Baru
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">
              Daftar Banner Beranda ({initialItems.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Banner yang berstatus Aktif akan diputar otomatis pada slider promo di halaman utama.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {initialItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Belum ada banner. Silakan tambahkan banner pertama melalui formulir di samping.
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Preview</TableHead>
                      <TableHead>Judul &amp; Subjudul</TableHead>
                      <TableHead>CTA</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="w-28">
                          {item.imageUrl ? (
                            <a
                              href={item.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block h-14 w-24 overflow-hidden rounded-lg border border-border bg-secondary"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                            </a>
                          ) : (
                            <div className="flex h-14 w-24 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/40 text-muted-foreground">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="font-bold text-xs text-foreground">{item.title}</p>
                          {item.subtitle && (
                            <p className="line-clamp-2 text-[11px] text-muted-foreground mt-0.5">
                              {item.subtitle}
                            </p>
                          )}
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Urutan: #{item.sortOrder}
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.ctaText ? (
                            <div className="text-xs">
                              <span className="font-semibold text-foreground block">
                                {item.ctaText}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {item.ctaUrl}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={item.isActive ? "default" : "outline"}
                            className="text-[10px]"
                          >
                            {item.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => openEditDialog(item)}
                              title="Edit banner"
                              aria-label={`Edit banner ${item.title}`}
                              className="h-8 w-8 rounded-full"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              disabled={pending}
                              onClick={() => handleToggleActive(item)}
                              title={item.isActive ? "Sembunyikan banner" : "Tampilkan banner"}
                              aria-label={item.isActive ? "Sembunyikan banner" : "Tampilkan banner"}
                              className="h-8 w-8 rounded-full"
                            >
                              {item.isActive ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </Button>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  disabled={pending}
                                  title="Hapus banner"
                                  aria-label={`Hapus banner ${item.title}`}
                                  className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md rounded-2xl">
                                <DialogHeader>
                                  <DialogTitle className="text-base font-extrabold">
                                    Hapus Banner Ini?
                                  </DialogTitle>
                                  <DialogDescription className="text-xs leading-relaxed">
                                    Anda yakin ingin menghapus banner{" "}
                                    <strong>{item.title}</strong> dari beranda?
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="gap-2 sm:gap-2">
                                  <DialogClose asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="rounded-full text-xs"
                                    >
                                      Batal
                                    </Button>
                                  </DialogClose>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(item)}
                                    className="rounded-full text-xs font-bold"
                                  >
                                    Ya, Hapus
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editingBanner} onOpenChange={(open) => !open && setEditingBanner(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold">Edit Banner Beranda</DialogTitle>
            <DialogDescription className="text-xs">
              Perbarui judul, subjudul, gambar, atau tautan tombol CTA pada banner ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-banner-title" className="text-xs font-semibold">
                Judul Banner *
              </Label>
              <Input
                id="edit-banner-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-banner-subtitle" className="text-xs font-semibold">
                Subjudul
              </Label>
              <Input
                id="edit-banner-subtitle"
                value={editSubtitle}
                onChange={(e) => setEditSubtitle(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Gambar Banner *</Label>
              {editImageUrl && (
                <div className="relative overflow-hidden rounded-xl border border-border bg-secondary/30 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editImageUrl}
                    alt="Preview edit banner"
                    className="h-32 w-full rounded-lg object-cover"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => handleFileUpload(e, "edit")}
                  disabled={editUploading}
                  id="edit-banner-photo-upload"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={editUploading}
                  onClick={() => document.getElementById("edit-banner-photo-upload")?.click()}
                  className="h-9 rounded-full text-xs shrink-0"
                >
                  {editUploading ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  <span>Ganti Gambar</span>
                </Button>
                <Input
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  placeholder="URL gambar..."
                  required
                  className="h-9 text-xs flex-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label htmlFor="edit-banner-cta" className="text-xs font-semibold">
                  Teks Tombol CTA
                </Label>
                <Input
                  id="edit-banner-cta"
                  value={editCtaText}
                  onChange={(e) => setEditCtaText(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-banner-url" className="text-xs font-semibold">
                  URL Tujuan CTA
                </Label>
                <Input
                  id="edit-banner-url"
                  value={editCtaUrl}
                  onChange={(e) => setEditCtaUrl(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-banner-order" className="text-xs font-semibold">
                Urutan Slide
              </Label>
              <Input
                id="edit-banner-order"
                type="number"
                value={editSortOrder}
                onChange={(e) => setEditSortOrder(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingBanner(null)}
                className="rounded-full text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={pending || editUploading}
                className="rounded-full text-xs font-bold"
              >
                {pending ? "Menyimpan…" : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

