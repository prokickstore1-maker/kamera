import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Video, Clock, AlertCircle, ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Garansi & Retur | vintagemeew" };

export default function ReturnsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <span className="y2k-pill-badge mb-2">Perlindungan Pembeli</span>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Kebijakan Garansi &amp; Retur
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Setiap kamera di vintagemeew telah melewati inspeksi fungsi sebelum dikirim. Berikut ketentuan klaim garansi fungsi jika barang yang diterima tidak sesuai catatan deskripsi.
        </p>
      </header>

      <div className="space-y-4 text-sm leading-relaxed text-foreground">
        <section className="y2k-card p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
              <Video className="h-4 w-4" />
            </div>
            <h2 className="font-extrabold text-base">1. Video Unboxing Tanpa Jeda (Wajib)</h2>
          </div>
          <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Rekam video pembukaan paket tanpa jeda atau suntingan, mulai dari resi dan segel paket terlihat utuh hingga kamera dinyalakan dan diuji fungsi dasarnya. Video ini menjadi bukti utama apabila terjadi kendala pengiriman.
          </p>
        </section>

        <section className="y2k-card p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
              <Clock className="h-4 w-4" />
            </div>
            <h2 className="font-extrabold text-base">2. Batas Waktu Pengajuan Klaim (2x24 Jam)</h2>
          </div>
          <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Laporkan kendala maksimal 2x24 jam sejak status kurir menyatakan paket telah diterima. Hubungi admin melalui WhatsApp dengan menyertakan nomor pesanan dan rekaman video unboxing untuk proses verifikasi.
          </p>
        </section>

        <section className="y2k-card p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h2 className="font-extrabold text-base">3. Cakupan Garansi Fungsi</h2>
          </div>
          <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Garansi mencakup ketidaksesuaian fungsi utama (lensa macet, flash mati, layar rusak, atau tombol tidak merespons) yang tidak tercantum pada bagian <strong>Catatan Fisik &amp; Minus</strong> di halaman produk saat pembelian.
          </p>
        </section>

        <section className="y2k-card p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
              <AlertCircle className="h-4 w-4" />
            </div>
            <h2 className="font-extrabold text-base">4. Kondisi yang Tidak Dapat Diretur</h2>
          </div>
          <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Klaim tidak berlaku untuk kerusakan akibat terjatuh atau terkena cairan setelah diterima, pembongkaran mandiri, kehilangan aksesoris kelengkapan, atau preferensi subjektif terhadap karakter warna sensor kamera lawas.
          </p>
        </section>
      </div>

      <div className="mt-8">
        <Link
          href="/products"
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-xs font-bold text-primary hover:border-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Katalog</span>
        </Link>
      </div>
    </article>
  );
}
