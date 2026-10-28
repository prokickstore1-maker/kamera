import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { isAdmin } from "@/lib/admin-session";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pengaturan Toko | Admin", robots: { index: false } };

export default async function AdminSettingsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  let rows: { key: string; value: string }[] = [];
  try {
    rows = await db.select({ key: settings.key, value: settings.value }).from(settings);
  } catch {
    rows = [];
  }
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <div>
      <h1 className="mb-3 text-xl font-extrabold">Pengaturan Toko</h1>
      <SettingsForm initial={map} />
    </div>
  );
}
