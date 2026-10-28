import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { asc, desc } from "drizzle-orm";
import { Image as ImageIcon } from "lucide-react";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { isAdmin } from "@/lib/admin-session";
import { BannersManager } from "@/components/banners-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Kelola Banner | Admin",
  robots: { index: false },
};

export default async function AdminBannersPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const items = await db
    .select()
    .from(banners)
    .orderBy(asc(banners.sortOrder), desc(banners.createdAt));

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold flex items-center gap-2 text-foreground">
            <ImageIcon className="h-5 w-5 text-primary shrink-0" />
            <span>Kelola Banner Promo Beranda</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tambah, edit, urutkan, atau ganti foto banner promo yang tampil di halaman utama toko.
          </p>
        </div>
      </div>

      <BannersManager initialItems={items} />
    </div>
  );
}

