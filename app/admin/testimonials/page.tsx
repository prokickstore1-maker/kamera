import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { MessageSquareHeart } from "lucide-react";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { isAdmin } from "@/lib/admin-session";
import { TestimonialsManager } from "@/components/testimonials-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Kelola Testimoni | Admin",
  robots: { index: false },
};

export default async function AdminTestimonialsPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const items = await db
    .select()
    .from(testimonials)
    .orderBy(testimonials.sortOrder, desc(testimonials.createdAt));

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold flex items-center gap-2 text-foreground">
            <MessageSquareHeart className="h-5 w-5 text-primary shrink-0" />
            <span>Kelola Testimoni Pembeli</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Unggah foto bukti testimoni/hasil jepretan pembeli, atur rating bintang, dan tampilkan di halaman produk serta beranda.
          </p>
        </div>
      </div>

      <TestimonialsManager initialItems={items} />
    </div>
  );
}

