"use server";

import { revalidatePath, updateTag } from "next/cache";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { isAdmin } from "@/lib/admin-session";

const ALLOWED = new Set([
  "shipping_fee_utama",
  "shipping_fee_luar",
  "provinces_zona_utama",
  "provinces_diblokir",
  "auto_cancel_hours",
  "whatsapp_number",
  "running_banner_text",
]);

export async function saveSettings(input: Record<string, string>): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Sesi habis, login ulang." };

  // validasi nilai numerik = trust boundary
  for (const key of ["shipping_fee_utama", "shipping_fee_luar"]) {
    const v = input[key];
    if (v !== undefined && (!/^\d+$/.test(v) || Number(v) > 5_000_000)) {
      return { ok: false, error: "Tarif ongkir harus angka wajar." };
    }
  }
  const hrs = input.auto_cancel_hours;
  if (hrs !== undefined && (!/^\d+$/.test(hrs) || Number(hrs) < 1 || Number(hrs) > 72)) {
    return { ok: false, error: "Auto-cancel 1–72 jam." };
  }
  const wa = input.whatsapp_number;
  if (wa !== undefined && !/^(\+?62|0)8\d{6,13}$/.test(wa.replace(/[\s-]/g, ""))) {
    return { ok: false, error: "Nomor WhatsApp tidak valid." };
  }

  try {
    for (const [key, value] of Object.entries(input)) {
      if (!ALLOWED.has(key)) continue;
      await db
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
    }
    // read-your-writes: admin langsung lihat perubahan
    updateTag("settings");
    revalidatePath("/");
    revalidatePath("/checkout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal menyimpan pengaturan." };
  }
}