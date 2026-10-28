import Link from "next/link";
import { CameraOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-secondary text-primary">
        <CameraOff className="h-8 w-8" />
      </div>
      <span className="y2k-pill-badge mb-3">Halaman Tidak Ditemukan</span>
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
        Kamera atau Halaman Sudah Tidak Tersedia
      </h1>
      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
        Unit kamera yang Anda cari mungkin sudah terjual atau tautan halaman telah berubah. Silakan periksa koleksi digicam aktif di katalog.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg" className="rounded-full">
          <Link href="/products">Lihat Katalog Kamera</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="rounded-full">
          <Link href="/" className="inline-flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            <span>Ke Beranda</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}

