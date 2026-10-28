"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Camera,
  Upload,
  Trash2,
  Check,
  Image as ImageIcon,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import {
  createProductAction,
  updateProductAction,
  uploadProductImageAction,
  type ProductInputData,
} from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

type BrandOption = { id: string; name: string };
type CategoryOption = { id: string; name: string };

export interface InitialProductData {
  id: string;
  name: string;
  brandId: string | null;
  categoryId: string | null;
  priceIdr: number;
  stock: number;
  weightGrams: number | null;
  conditionGrade: string | null;
  defects: string | null;
  inclusions: string[];
  description: string | null;
  features: string[];
  isFeatured: boolean;
  isMostWanted: boolean;
  active: boolean;
  images: {
    url: string;
    kind: "body" | "sample";
    isPrimary: boolean;
    position: number;
  }[];
}

interface ProductFormProps {
  brands: BrandOption[];
  categories: CategoryOption[];
  initialProduct?: InitialProductData;
}

const COMMON_INCLUSIONS = [
  "Baterai Original",
  "Desktop Charger",
  "Memory Card SD 4GB",
  "Tali Strap",
  "Pouch Kamera",
  "Kabel Data USB",
  "Box / Dus Asli",
];

const COMMON_FEATURES = [
  "CCD Sensor",
  "HD Results",
  "Beginner Friendly",
  "Optical Zoom 4x",
  "Wide Angle 28mm",
  "Vintage Film Tone",
  "Flip Screen",
  "Warm Retro Tone",
];

export function ProductForm({ brands, categories, initialProduct }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!initialProduct;
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const [name, setName] = React.useState(initialProduct?.name ?? "");
  const [brandId, setBrandId] = React.useState<string>(
    initialProduct?.brandId ?? brands[0]?.id ?? ""
  );
  const [isNewBrand, setIsNewBrand] = React.useState(false);
  const [newBrandName, setNewBrandName] = React.useState("");

  const defaultCategoryId = React.useMemo(() => {
    if (initialProduct?.categoryId) return initialProduct.categoryId;
    const digicam = categories.find(
      (c) => c.name.toLowerCase().includes("digicam") || c.name.toLowerCase().includes("pocket")
    );
    return digicam?.id ?? categories[0]?.id ?? "";
  }, [categories, initialProduct?.categoryId]);

  const [categoryId, setCategoryId] = React.useState<string>(defaultCategoryId);
  const [isNewCategory, setIsNewCategory] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");

  const [priceIdr, setPriceIdr] = React.useState<number>(initialProduct?.priceIdr ?? 2500000);
  const [stock, setStock] = React.useState<number>(initialProduct?.stock ?? 1);
  const [weightGrams, setWeightGrams] = React.useState<number>(
    initialProduct?.weightGrams ?? 350
  );

  // Vintage Condition State
  const [conditionGrade, setConditionGrade] = React.useState<string>(
    initialProduct ? (initialProduct.conditionGrade ?? "9.0") : "9.5"
  );
  const [defects, setDefects] = React.useState(initialProduct?.defects ?? "");
  const [selectedInclusions, setSelectedInclusions] = React.useState<string[]>(
    initialProduct
      ? initialProduct.inclusions
      : ["Baterai Original", "Desktop Charger", "Memory Card SD 4GB", "Tali Strap"]
  );
  const [customInclusion, setCustomInclusion] = React.useState("");

  // Description & Features
  const [description, setDescription] = React.useState(initialProduct?.description ?? "");
  const [selectedFeatures, setSelectedFeatures] = React.useState<string[]>(
    initialProduct ? initialProduct.features : ["CCD Sensor", "HD Results"]
  );
  const [customFeature, setCustomFeature] = React.useState("");

  // Images State
  const [images, setImages] = React.useState<
    { url: string; kind: "body" | "sample"; isPrimary: boolean; position: number }[]
  >(initialProduct?.images ?? []);
  const [urlInput, setUrlInput] = React.useState("");

  // Publishing State
  const [active, setActive] = React.useState(initialProduct ? initialProduct.active : true);
  const [isFeatured, setIsFeatured] = React.useState(initialProduct?.isFeatured ?? false);
  const [isMostWanted, setIsMostWanted] = React.useState(initialProduct?.isMostWanted ?? false);

  // Handlers
  const toggleInclusion = (item: string) => {
    setSelectedInclusions((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const addCustomInclusion = () => {
    if (customInclusion.trim() && !selectedInclusions.includes(customInclusion.trim())) {
      setSelectedInclusions((prev) => [...prev, customInclusion.trim()]);
      setCustomInclusion("");
    }
  };

  const toggleFeature = (item: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const addCustomFeature = () => {
    if (customFeature.trim() && !selectedFeatures.includes(customFeature.trim())) {
      setSelectedFeatures((prev) => [...prev, customFeature.trim()]);
      setCustomFeature("");
    }
  };

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fd = new FormData();
      fd.append("file", file);

      try {
        const res = await uploadProductImageAction(fd);
        if (res.ok && res.url) {
          setImages((prev) => [
            ...prev,
            {
              url: res.url!,
              kind: "body",
              isPrimary: prev.length === 0,
              position: prev.length,
            },
          ]);
          successCount++;
        } else {
          toast.error(`Gagal mengunggah ${file.name}: ${res.error}`);
        }
      } catch {
        toast.error(`Gagal mengunggah ${file.name}`);
      }
    }

    setUploading(false);
    if (successCount > 0) {
      toast.success(`${successCount} foto berhasil diunggah!`);
    }
    e.target.value = "";
  };

  const addUrlImage = (kind: "body" | "sample" = "body") => {
    if (!urlInput.trim()) return;
    setImages((prev) => [
      ...prev,
      {
        url: urlInput.trim(),
        kind,
        isPrimary: prev.length === 0,
        position: prev.length,
      },
    ]);
    setUrlInput("");
    toast.success("Foto ditambahkan dari URL!");
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const filtered = prev.filter((_, idx) => idx !== index);
      if (prev[index]?.isPrimary && filtered.length > 0) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const setPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        isPrimary: idx === index,
      }))
    );
  };

  const toggleImageKind = (index: number) => {
    setImages((prev) =>
      prev.map((img, idx) =>
        idx === index
          ? { ...img, kind: img.kind === "body" ? "sample" : "body" }
          : img
      )
    );
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama kamera wajib diisi.");
      return;
    }
    if (images.length === 0) {
      toast.error("Minimal sertakan 1 foto kamera.");
      return;
    }
    if (isNewBrand && !newBrandName.trim()) {
      toast.error("Silakan ketik nama brand baru.");
      return;
    }
    if (isNewCategory && !newCategoryName.trim()) {
      toast.error("Silakan ketik nama kategori baru.");
      return;
    }

    setLoading(true);
    const payload: ProductInputData = {
      name: name.trim(),
      brandId: isNewBrand ? null : (brandId || null),
      newBrandName: isNewBrand ? newBrandName.trim() : null,
      categoryId: isNewCategory ? null : (categoryId || null),
      newCategoryName: isNewCategory ? newCategoryName.trim() : null,
      priceIdr: Number(priceIdr),
      stock: Number(stock),
      conditionGrade: conditionGrade ? parseFloat(conditionGrade) : null,
      defects: defects.trim() || null,
      inclusions: selectedInclusions,
      description: description.trim() || null,
      features: selectedFeatures,
      weightGrams: Number(weightGrams) || 350,
      isFeatured,
      isMostWanted,
      active,
      images,
    };

    try {
      const res = isEdit
        ? await updateProductAction(initialProduct.id, payload)
        : await createProductAction(payload);
      if (res.ok) {
        toast.success(
          isEdit
            ? "Perubahan produk kamera berhasil disimpan!"
            : "Kamera baru berhasil diterbitkan ke katalog!"
        );
        router.push("/admin/products");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menyimpan kamera.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan sistem.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Inventaris Produk</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Camera className="h-6 w-6 text-primary" />
            <span>{isEdit ? "Edit Data Kamera" : "Upload & Kurasi Kamera Baru"}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEdit
              ? `Perbarui informasi, harga, kondisi fisik, dan galeri foto untuk ${initialProduct.name}.`
              : "Daftarkan unit digicam vintage dengan data kondisi transparan dan galeri jepretan CCD."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-full text-xs">
            <Link href="/admin/products">Batal</Link>
          </Button>
          <Button
            type="submit"
            disabled={loading}
            size="sm"
            className="rounded-full text-xs font-bold shadow-xs px-5"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            {loading ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Simpan & Terbitkan"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Kolom Kiri: Form Utama (2 Span) */}
        <div className="space-y-6 md:col-span-2">
          {/* 1. Identitas Produk */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <span>1. Identitas &amp; Brand Kamera</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Nama model kamera, produsen brand, dan klasifikasi kategori.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold">
                  Nama Kamera <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Canon Powershot A3200 IS"
                  required
                  className="h-10 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="brand" className="text-xs font-semibold">
                      Brand / Merek
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewBrand((prev) => !prev);
                        if (!isNewBrand) setNewBrandName("");
                      }}
                      className="text-[11px] font-bold text-primary hover:underline transition-colors"
                    >
                      {isNewBrand ? "← Pilih dari list" : "+ Tambah Brand Baru"}
                    </button>
                  </div>
                  {isNewBrand ? (
                    <Input
                      id="newBrand"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      placeholder="Contoh: Olympus, Casio, Lumix, Kodak"
                      className="h-10 text-xs"
                      autoFocus
                    />
                  ) : (
                    <Select value={brandId} onValueChange={setBrandId}>
                      <SelectTrigger id="brand" className="h-10 text-xs">
                        <SelectValue placeholder="Pilih Brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((b) => (
                          <SelectItem key={b.id} value={b.id} className="text-xs">
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="category" className="text-xs font-semibold">
                      Kategori Utama
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewCategory((prev) => !prev);
                        if (!isNewCategory) setNewCategoryName("");
                      }}
                      className="text-[11px] font-bold text-primary hover:underline transition-colors"
                    >
                      {isNewCategory ? "← Pilih dari list" : "+ Tambah Kategori Baru"}
                    </button>
                  </div>
                  {isNewCategory ? (
                    <Input
                      id="newCategory"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Contoh: Compact Slim, Camcorder Vintage"
                      className="h-10 text-xs"
                      autoFocus
                    />
                  ) : (
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger id="category" className="h-10 text-xs">
                        <SelectValue placeholder="Pilih Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="price" className="text-xs font-semibold">
                    Harga Jual (IDR) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="100000"
                    step="50000"
                    value={priceIdr}
                    onChange={(e) => setPriceIdr(Number(e.target.value))}
                    required
                    className="h-10 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="stock" className="text-xs font-semibold">
                    Stok Unit
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    max="99"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="h-10 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground">Default 1 untuk unit vintage.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="weight" className="text-xs font-semibold">
                    Berat (Gram)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(Number(e.target.value))}
                    className="h-10 text-xs font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Kondisi Fisik & Kelengkapan Vintage */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <span>2. Kondisi Fisik &amp; Kelengkapan Vintage</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Transparansi catatan minus fisik dan kelengkapan aksesoris penting bagi pembeli digicam.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="grade" className="text-xs font-semibold">
                  Nilai Kondisi Fisik (Skala 1 - 10)
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="grade"
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="10.0"
                    value={conditionGrade}
                    onChange={(e) => setConditionGrade(e.target.value)}
                    className="h-10 w-28 text-xs font-mono font-bold"
                  />
                  <span className="y2k-pill-badge">
                    {parseFloat(conditionGrade) >= 9.5
                      ? "Like New (9.5+)"
                      : parseFloat(conditionGrade) >= 9.0
                      ? "Excellent (9.0 - 9.4)"
                      : parseFloat(conditionGrade) >= 8.0
                      ? "Very Good (8.0 - 8.9)"
                      : parseFloat(conditionGrade) >= 6.0
                      ? "Good (6.0 - 7.9)"
                      : "Used (< 6.0)"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="defects" className="text-xs font-semibold">
                  Catatan Minus / Defect Bodi
                </Label>
                <Textarea
                  id="defects"
                  rows={2}
                  value={defects}
                  onChange={(e) => setDefects(e.target.value)}
                  placeholder="Contoh: Sedikit lecet halus pemakaian normal di sudut bawah. Lensa optik 100% bening tanpa jamur, flash terang, zoom lancar."
                  className="text-xs resize-none"
                />
              </div>

              {/* Inclusions Chips */}
              <div className="space-y-2 pt-1">
                <Label className="text-xs font-semibold">Kelengkapan Paket Kamera</Label>
                <div className="flex flex-wrap gap-1.5">
                  {[...new Set([...COMMON_INCLUSIONS, ...selectedInclusions])].map((item) => {
                    const sel = selectedInclusions.includes(item);
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => toggleInclusion(item)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all flex items-center gap-1 ${
                          sel
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "bg-background text-muted-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {sel && <Check className="h-3 w-3" />}
                        <span>{item}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Input Custom Inclusion */}
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    value={customInclusion}
                    onChange={(e) => setCustomInclusion(e.target.value)}
                    placeholder="Tambah kelengkapan lain (cth: Card Reader Type-C)..."
                    className="h-8 text-xs flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomInclusion();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomInclusion}
                    className="h-8 text-xs"
                  >
                    + Tambah
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Deskripsi & Karakter Jepretan */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <span>3. Deskripsi &amp; Karakter Warna CCD</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Jelaskan karakter sensor, resolusi megapixel, dan keunggulan estetika jepretan kamera ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="desc" className="text-xs font-semibold">
                  Deskripsi Lengkap
                </Label>
                <Textarea
                  id="desc"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kamera saku legendaris dengan sensor CCD khas 2000-an yang menghasilkan tone warna kulit hangat dan nostalgic vintage vibe..."
                  className="text-xs"
                />
              </div>

              {/* Fitur PDP Badges */}
              <div className="space-y-2 pt-1">
                <Label className="text-xs font-semibold">Fitur / Highlight PDP (Badge)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {[...new Set([...COMMON_FEATURES, ...selectedFeatures])].map((item) => {
                    const sel = selectedFeatures.includes(item);
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => toggleFeature(item)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all flex items-center gap-1 ${
                          sel
                            ? "bg-secondary text-foreground border-primary font-bold shadow-xs"
                            : "bg-background text-muted-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {sel && <Check className="h-3 w-3 text-primary" />}
                        <span>{item}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Input
                    value={customFeature}
                    onChange={(e) => setCustomFeature(e.target.value)}
                    placeholder="Tambah highlight lain (cth: Selfie Mirror)..."
                    className="h-8 text-xs flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomFeature();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomFeature}
                    className="h-8 text-xs"
                  >
                    + Tambah
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Foto Galeri & Opsi Publikasi (1 Span) */}
        <div className="space-y-6">
          {/* Galeri Foto */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                <span>Galeri Foto ({images.length})</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Upload foto bodi kamera dan foto sampel jepretan asli.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload Trigger */}
              <div className="rounded-xl border-2 border-dashed border-border p-4 text-center hover:border-primary/60 transition-colors bg-secondary/20">
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  id="camera-photos"
                  className="hidden"
                />
                <label
                  htmlFor="camera-photos"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                >
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {uploading ? "Sedang Mengunggah…" : "Pilih File Foto"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Mendukung JPG, PNG, WEBP (maks 10MB)
                  </span>
                </label>
              </div>

              {/* URL Input Alternatif */}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="url" className="text-[11px] font-semibold text-muted-foreground">
                  Atau Masukkan URL Gambar:
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    id="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://...foto.jpg"
                    className="h-8 text-xs flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addUrlImage("body")}
                    className="h-8 text-xs px-2.5"
                  >
                    + Bodi
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => addUrlImage("sample")}
                    className="h-8 text-xs px-2"
                    title="Foto Sampel Jepretan"
                  >
                    + Sampel
                  </Button>
                </div>
              </div>

              {/* List Foto Terpilih */}
              <div className="space-y-2 pt-2 border-t border-border">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl border border-border p-2 bg-card text-xs shadow-2xs"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={`Foto ${idx + 1}`}
                      className="h-12 w-12 rounded-lg object-cover border border-border shrink-0 bg-muted"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(idx)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                            img.isPrimary
                              ? "bg-primary text-white border-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {img.isPrimary ? "★ Sampul Utama" : "Set Utama"}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleImageKind(idx)}
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                            img.kind === "sample"
                              ? "bg-primary/15 text-primary border-primary/30"
                              : "bg-secondary text-foreground border-border"
                          }`}
                        >
                          {img.kind === "sample" ? "Foto Sampel" : "Foto Bodi"}
                        </button>
                      </div>
                      <p className="truncate text-[10px] text-muted-foreground mt-1 font-mono">
                        {img.url}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeImage(idx)}
                      aria-label={`Hapus foto ${idx + 1}`}
                      className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {images.length === 0 && (
                  <p className="text-center py-6 text-xs text-muted-foreground">
                    Belum ada foto ditambahkan.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Opsi Publikasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-foreground block">Aktif di Katalog</span>
                  <span className="text-[11px] text-muted-foreground">
                    Dapat dilihat dan dibeli oleh pembeli
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer border-t border-border pt-3">
                <div>
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span>Most Wanted</span>
                    <span className="text-[9px] bg-secondary text-secondary-foreground border border-primary/20 px-1.5 py-0.5 rounded-full font-bold uppercase">
                      Beranda
                    </span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Tampilkan di seksi &ldquo;Most Wanted&rdquo; pada beranda toko
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isMostWanted}
                  onChange={(e) => setIsMostWanted(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer border-t border-border pt-3">
                <div>
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span>Kamera Unggulan</span>
                    <span className="text-[9px] bg-secondary text-secondary-foreground border border-primary/20 px-1.5 py-0.5 rounded-full font-bold uppercase">
                      Hero
                    </span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Tampilkan di seksi &ldquo;Pilihan Kurator&rdquo; dan kandidat Hero
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
              </label>

              <div className="pt-3 border-t border-border">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full font-bold shadow-md h-10"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {loading
                    ? "Menyimpan…"
                    : isEdit
                      ? "Simpan Perubahan Kamera"
                      : "Simpan & Terbitkan Kamera"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
