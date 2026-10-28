import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Keranjang Belanja | vintaagemeew", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight">Keranjang Belanja</h1>
      <CartView />
    </div>
  );
}
