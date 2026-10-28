import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Kebijakan Privasi — vintagemeew" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold">Kebijakan Privasi</h1>
      <div className="mt-4 space-y-4 text-sm leading-relaxed">
        <p className="text-muted-foreground">
          Kami hanya mengumpulkan data yang diperlukan untuk memproses pesanan: nama, nomor WhatsApp, alamat, dan kode
          pos. Data tersebut dipakai untuk pengiriman dan komunikasi pesanan.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Bukti pembayaran disimpan pada penyimpanan privat; hanya admin yang dapat membacanya lewat tautan berwaktu.</li>
          <li>Kami tidak menjual data pribadi ke pihak ketiga.</li>
          <li>Tautan invoice bersifat rahasia; alamat lengkap pemilik toko dan pembeli tidak ditampilkan di invoice publik.</li>
          <li>Kode pos, nomor WA, dan nama pembeli disamarkan saat digunakan untuk pelacakan pesanan.</li>
        </ul>
      </div>
      <p className="mt-8 text-xs">
        <Link href="/" className="text-primary hover:underline">← Kembali</Link>
      </p>
    </article>
  );
}