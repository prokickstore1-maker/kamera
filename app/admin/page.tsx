import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { count, desc, eq, sql, lte, and } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-session";
import { rupiah, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Truck, AlertTriangle, DollarSign, LayoutDashboard } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard Admin | vintaagemeew", robots: { index: false } };

export default async function AdminDashboard() {
  if (!(await isAdmin())) redirect("/admin/login");

  let stats = { perluProses: 0, dikirim: 0, stokKritis: 0, omset: 0 };
  let recent: (typeof orders.$inferSelect)[] = [];
  try {
    const [perlu] = await db
      .select({ n: count() })
      .from(orders)
      .where(sql`${orders.status} in ('PENDING_PAYMENT','PROCESSING')`);
    const [kirim] = await db.select({ n: count() }).from(orders).where(eq(orders.status, "SHIPPED"));
    const [kritis] = await db
      .select({ n: count() })
      .from(products)
      .where(and(lte(products.stock, 1), eq(products.active, true)));
    const [omset] = await db
      .select({ n: sql<number>`coalesce(sum(${orders.totalAmount}),0)::int` })
      .from(orders)
      .where(eq(orders.status, "COMPLETED"));
    stats = { perluProses: Number(perlu.n), dikirim: Number(kirim.n), stokKritis: Number(kritis?.n ?? 0), omset: Number(omset.n) };
    recent = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(5);
  } catch {
    /* DB down: tampilkan kosong */
  }

  const statCards = [
    { label: "Perlu Diproses", value: String(stats.perluProses), icon: Clock, desc: "Pending / Processing" },
    { label: "Sedang Dikirim", value: String(stats.dikirim), icon: Truck, desc: "Dalam perjalanan" },
    { label: "Stok Kritis", value: String(stats.stokKritis), icon: AlertTriangle, desc: "Stok tersisa ≤ 1" },
    { label: "Omzet Selesai", value: rupiah(stats.omset), icon: DollarSign, desc: "Status Completed" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <span>Ringkasan Toko</span>
        </h1>
        <span className="text-xs text-muted-foreground font-semibold">Live Mode</span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground">{c.label}</CardTitle>
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold font-mono text-foreground">{c.value}</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{c.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-bold text-foreground">5 Pesanan Terbaru</CardTitle>
          <Link href="/admin/orders" className="text-xs font-semibold text-primary hover:underline">
            Lihat Semua Pesanan →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile List (< md) */}
          <div className="md:hidden divide-y divide-border/60">
            {recent.map((o) => (
              <div key={o.id} className="p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <Link href={`/admin/orders/${o.id}`} className="font-mono font-bold text-foreground hover:text-primary">
                    {o.orderNumber}
                  </Link>
                  <Badge variant="outline" className="text-[10px] font-bold uppercase">
                    {o.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-medium text-foreground">{o.customerName}</span>
                  <span className="font-mono font-bold text-foreground">{rupiah(o.totalAmount)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground text-right">{formatDate(o.createdAt)}</p>
              </div>
            ))}
            {!recent.length && (
              <div className="p-8 text-center text-muted-foreground text-xs">
                Belum ada riwayat pesanan masuk.
              </div>
            )}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/40">
                <TableRow>
                  <TableHead>Nomor Order</TableHead>
                  <TableHead>Nama Pembeli</TableHead>
                  <TableHead>Total Tagihan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Waktu Masuk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link href={`/admin/orders/${o.id}`} className="font-mono font-bold hover:text-primary transition-colors">
                        {o.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">{o.customerName}</TableCell>
                    <TableCell className="font-mono font-bold text-foreground">{rupiah(o.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase">
                        {o.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {!recent.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-28 text-center text-muted-foreground text-xs">
                      Belum ada riwayat pesanan masuk.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
