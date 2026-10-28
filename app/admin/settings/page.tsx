import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { settings, paymentMethods } from "@/db/schema";
import { isAdmin } from "@/lib/admin-session";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pengaturan Toko & Rekening | Admin", robots: { index: false } };

export default async function AdminSettingsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  let rows: { key: string; value: string }[] = [];
  let payments: (typeof paymentMethods.$inferSelect)[] = [];
  try {
    [rows, payments] = await Promise.all([
      db.select({ key: settings.key, value: settings.value }).from(settings),
      db.select().from(paymentMethods).orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.name)),
    ]);
  } catch {
    rows = [];
    payments = [];
  }
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">Pengaturan Toko &amp; Rekening Pembayaran</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Kelola nomor rekening bank, gambar QRIS, tarif ongkir, WhatsApp admin, dan teks banner toko.
        </p>
      </div>
      <SettingsForm initial={map} paymentMethods={payments} />
    </div>
  );
}
