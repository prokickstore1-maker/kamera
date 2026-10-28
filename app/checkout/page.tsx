import type { Metadata } from "next";
import { db } from "@/db";
import { settings, paymentMethods } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CheckoutForm } from "@/components/checkout-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout | vintaagemeew", robots: { index: false } };

function parseList(v: string | undefined): string[] {
  if (!v) return [];
  try {
    const arr = JSON.parse(v);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default async function CheckoutPage() {
  let cfg = { feeUtama: 0, feeLuar: 0, utama: [] as string[], blocked: [] as string[] };
  let pms: { id: string; code: string; name: string; accountNumber?: string | null }[] = [];
  let down = false;
  try {
    const [rows, pms2] = await Promise.all([
      db.select({ key: settings.key, value: settings.value }).from(settings),
      db.select().from(paymentMethods).where(eq(paymentMethods.isActive, true)),
    ]);
    const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    cfg = {
      feeUtama: Number(m.shipping_fee_utama ?? 0),
      feeLuar: Number(m.shipping_fee_luar ?? 0),
      utama: parseList(m.provinces_zona_utama),
      blocked: parseList(m.provinces_diblokir),
    };
    pms = pms2;
  } catch {
    down = true;
  }

  if (down) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-semibold">Toko sedang dalam perawatan singkat.</p>
        <p className="mt-2 text-sm text-muted-foreground">Coba lagi beberapa saat.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight">Checkout</h1>
      <CheckoutForm
        feeUtama={cfg.feeUtama}
        feeLuar={cfg.feeLuar}
        utama={cfg.utama}
        blocked={cfg.blocked}
        paymentMethods={pms}
      />
    </div>
  );
}
