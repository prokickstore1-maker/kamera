import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Camera } from "lucide-react";

export const metadata: Metadata = { title: "Panduan Spesifikasi Digicam | vintaagemeew" };

const TERMS = [
  [
    "Sensor CCD vs CMOS",
    "Sensor CCD era 2000-an menghasilkan tone warna hangat dengan kontras flash yang tegas khas kamera saku lawas. Sensor CMOS generasi lebih baru unggul pada kecepatan fokus dan pemotretan di ruangan redup.",
  ],
  [
    "Optical Zoom vs Digital Zoom",
    "Optical zoom menggerakkan elemen lensa fisik sehingga ketajaman gambar tetap terjaga saat memotret objek jauh. Digital zoom hanya memperbesar potongan piksel gambar. Prioritaskan angka optical zoom (misalnya 3x hingga 10x).",
  ],
  [
    "Resolusi Megapixel (MP)",
    "Untuk kebutuhan unggah media sosial dan cetak ukuran 4R hingga 6R, resolusi 4 MP sampai 12 MP sudah sangat memadai. Karakter hasil foto digicam lebih banyak ditentukan oleh jenis sensor dan bukaan lensa.",
  ],
  [
    "Baterai & Pengisian Daya",
    "Sebagian besar digicam memakai baterai lithium-ion tipe khusus (seperti NB-4L, NP-BG1, atau EN-EL10) yang diisi menggunakan desktop charger eksternal. Periksa daftar kelengkapan pada setiap halaman produk.",
  ],
  [
    "Focal Length (Setara 35mm)",
    "Angka milimeter (misalnya 28–112mm) menunjukkan sudut pandang lensa. Angka awal 24mm atau 28mm lebih lebar (cocok untuk foto grup/lanskap), sedangkan 35mm atau 38mm lebih mengerucut untuk potret.",
  ],
] as const;

export default function SpecificationsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <span className="y2k-pill-badge mb-2">Kamus Singkat Pembeli</span>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Panduan Spesifikasi Digicam
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Istilah teknis yang sering muncul pada halaman detail kamera saku digital tahun 2000-an agar Anda bisa memilih unit yang sesuai kebutuhan.
        </p>
      </header>

      <dl className="space-y-4">
        {TERMS.map(([k, v]) => (
          <div key={k} className="y2k-card p-5">
            <dt className="flex items-center gap-2 font-extrabold text-sm sm:text-base text-foreground">
              <Camera className="h-4 w-4 text-primary shrink-0" />
              <span>{k}</span>
            </dt>
            <dd className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8">
        <Link
          href="/products"
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-xs font-bold text-primary hover:border-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Lihat Katalog Kamera</span>
        </Link>
      </div>
    </article>
  );
}
