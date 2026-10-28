"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  Plus,
  Trash2,
  Upload,
  Loader2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  X,
} from "lucide-react";
import {
  createTestimonialAction,
  toggleTestimonialActiveAction,
  deleteTestimonialAction,
  uploadTestimonialImageAction,
} from "@/lib/admin-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export type TestimonialRow = {
  id: string;
  customerName: string;
  rating: number;
  content: string;
  screenshotUrl: string | null;
  isActive: boolean;
  createdAt: Date;
};

export function TestimonialsManager({ initialItems }: { initialItems: TestimonialRow[] }) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadTestimonialImageAction(fd);
      if (res.ok && res.url) {
        setScreenshotUrl(res.url);
        toast.success("Foto testimoni berhasil diunggah.");
      } else {
        toast.error(res.error ?? "Gagal mengunggah foto testimoni.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengunggah foto.");
    } finally {
      setUploading(false);
      inputEl.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createTestimonialAction({
        customerName,
        rating,
        content,
        screenshotUrl: screenshotUrl || null,
      });

      if (res.ok) {
        toast.success(`Testimoni dari "${customerName}" berhasil ditambahkan.`);
        setCustomerName("");
        setRating(5);
        setContent("");
        setScreenshotUrl("");
        router.refresh();
      } else {
        toast.error(res.error ?? "Gagal menyimpan testimoni.");
      }
    });
  }

  function handleToggleActive(item: TestimonialRow) {
    startTransition(async () => {
      const res = await toggleTestimonialActiveAction(item.id);
      if (res.ok) {
        toast.success(
          res.isActive
            ? `Testimoni "${item.customerName}" ditampilkan di halaman toko.`
            : `Testimoni "${item.customerName}" disembunyikan.`
        );
        router.refresh();
      } else {
        toast.error(res.error ?? "Gagal mengubah status testimoni.");
      }
    });
  }

  function handleDelete(item: TestimonialRow) {
    setDeletingId(item.id);
    startTransition(async () => {
      const res = await deleteTestimonialAction(item.id);
      setDeletingId(null);
      if (res.ok) {
        toast.success(`Testimoni "${item.customerName}" berhasil dihapus.`);
        router.refresh();
      } else {
        toast.error(res.error ?? "Gagal menghapus testimoni.");
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
              <span>Tambah Testimoni Pembeli</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Unggah foto hasil jepretan/bukti chat pembeli, pilih rating bintang, dan masukkan nama serta ulasan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="customerName" className="text-xs font-semibold">
                  Nama Pembeli *
                </Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Nadia Putri / @nadiaptr"
                  required
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Rating Bintang *</Label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      type="button"
                      variant={rating >= star ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRating(star)}
                      className="h-9 px-2.5 rounded-xl gap-1 text-xs font-bold"
                      aria-label={`Pilih ${star} bintang`}
                    >
                      <Star className={`h-3.5 w-3.5 ${rating >= star ? "fill-white" : ""}`} />
                      <span>{star}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Foto / Screenshot Testimoni</Label>
                {screenshotUrl ? (
                  <div className="relative overflow-hidden rounded-xl border border-border bg-secondary/30 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={screenshotUrl}
                      alt="Preview testimoni"
                      className="h-40 w-full rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => setScreenshotUrl("")}
                      className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-sm"
                      aria-label="Hapus foto testimoni"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-border p-4 text-center hover:border-primary/60 transition-colors bg-secondary/20">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      id="testi-photo-upload"
                      className="hidden"
                    />
                    <label
                      htmlFor="testi-photo-upload"
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
                        {uploading ? "Mengunggah Foto…" : "Upload Gambar Testimoni"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        JPG, PNG, atau WEBP (maks. 5 MB)
                      </span>
                    </label>
                  </div>
                )}

                <Input
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                  placeholder="Atau tempel URL gambar langsung (opsional)..."
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="testi-content" className="text-xs font-semibold">
                  Isi Ulasan /Komentar Pembeli
                </Label>
                <Textarea
                  id="testi-content"
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Contoh: Kameranya mulus sesuai deskripsi, hasil jepretan CCD-nya hangat dan pengiriman cepat!"
                  className="text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={pending || uploading || !customerName.trim()}
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
                    Simpan &amp; Tampilkan Testimoni
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-bold">
                Daftar Testimoni ({initialItems.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Testimoni berstatus Aktif tampil otomatis di antara detail produk dan footer serta di beranda.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {initialItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Belum ada testimoni. Silakan unggah testimoni pertama melalui formulir di samping.
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Foto</TableHead>
                      <TableHead>Pembeli &amp; Rating</TableHead>
                      <TableHead>Ulasan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="w-16">
                          {item.screenshotUrl ? (
                            <a
                              href={item.screenshotUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block h-12 w-12 overflow-hidden rounded-lg border border-border bg-secondary"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.screenshotUrl}
                                alt={item.customerName}
                                className="h-full w-full object-cover"
                              />
                            </a>
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/40 text-muted-foreground">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-xs text-foreground">{item.customerName}</p>
                          <div className="mt-1 flex items-center gap-0.5 text-primary">
                            {Array.from({ length: item.rating }).map((_, idx) => (
                              <Star key={idx} className="h-3 w-3 fill-primary text-primary" />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {item.content}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={item.isActive ? "default" : "outline"}
                            className="text-[10px]"
                          >
                            {item.isActive ? "Aktif" : "Disembunyikan"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              disabled={pending}
                              onClick={() => handleToggleActive(item)}
                              title={item.isActive ? "Sembunyikan dari toko" : "Tampilkan di toko"}
                              aria-label={item.isActive ? "Sembunyikan testimoni" : "Tampilkan testimoni"}
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
                                  disabled={pending && deletingId === item.id}
                                  title="Hapus testimoni"
                                  aria-label={`Hapus testimoni ${item.customerName}`}
                                  className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md rounded-2xl">
                                <DialogHeader>
                                  <DialogTitle className="text-base font-extrabold">
                                    Hapus Testimoni Ini?
                                  </DialogTitle>
                                  <DialogDescription className="text-xs leading-relaxed">
                                    Anda yakin ingin menghapus testimoni dari{" "}
                                    <strong>{item.customerName}</strong>?
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
    </div>
  );
}

