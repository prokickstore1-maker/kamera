import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ShopShell } from "@/components/shop-shell";
import { Toaster } from "@/components/ui/sonner";
import { settingsMap } from "@/lib/catalog";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "vintaagemeew | Kurasi Kamera Digital Saku Vintage & Preloved",
  description:
    "Toko kurasi kamera digital saku vintage (digicam) preloved & brand new di Pare, Kediri. Setiap unit dites fungsi, catatan kondisi jujur, dan siap jepret.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let bannerText = "";
  try {
    const s = await settingsMap();
    bannerText = s.running_banner_text?.trim() ?? "";
  } catch {
    bannerText = "";
  }

  return (
    <html lang="id" className={`${plusJakarta.variable} ${playfair.variable} font-sans`}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-secondary selection:text-secondary-foreground">
        <ShopShell bannerText={bannerText}>{children}</ShopShell>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
