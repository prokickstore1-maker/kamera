import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Syarat & Ketentuan — vintaagemeew" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold">Syarat & Ketentuan</h1>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Pesanan yang belum dibayar dibatalkan otomatis setelah batas waktu pada invoice (default 2 jam); stok otomatis
          kembali sehingga unit lain pembeli tidak terkunci.
        </p>
        <p>
          Pembayaran manual (transfer/QRIS) diverifikasi admin. Klik ganda tombol pesanan aman — sistem menolak duplikat
          dengan kunci idempoten.
        </p>
        <p>
          Semua harga dalam Rupiah. Ongkir zona tetap dihitung otomatis sesuai provinsi sebelum konfirmasi.
        </p>
        <p>Foto kondisi unit adalah unit yang dikirim; preloved wajar ada bekas pemakaian sebagaimana tercatat.</p>
      </div>
      <p className="mt-8 text-xs">
        <Link href="/" className="text-primary hover:underline">← Kembali</Link>
      </p>
    </article>
  );
}