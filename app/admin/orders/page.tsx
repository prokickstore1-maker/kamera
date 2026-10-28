import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-session";
import { cancelExpiredOrders } from "@/lib/orders";
import { rupiah, formatDate } from "@/lib/format";
import { OrderActions } from "@/components/order-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Search, X } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pesanan | Admin", robots: { index: false } };

const TABS = [
  ["ALL", "Semua"],
  ["PENDING_PAYMENT", "Menunggu Bayar"],
  ["PROCESSING", "Diproses"],
  ["SHIPPED", "Dikirim"],
  ["COMPLETED", "Selesai"],
  ["CANCELLED", "Dibatalkan"],
] as const;
const TAB_KEYS = TABS.map(([k]) => k);

function statusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "COMPLETED":
    case "PROCESSING":
      return "default";
    case "CANCELLED":
      return "destructive";
    case "SHIPPED":
      return "secondary";
    default:
      return "outline";
  }
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const sp = await searchParams;
  const status = (TAB_KEYS as readonly string[]).includes(sp.status ?? "ALL") ? sp.status ?? "ALL" : "ALL";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  try {
    await cancelExpiredOrders();
  } catch {
    /* biarkan halaman tetap tampil bila DB sibuk */
  }

  let rows: (typeof orders.$inferSelect)[] = [];
  try {
    const conds = [];
    if (status !== "ALL") conds.push(eq(orders.status, status));
    if (q) {
      conds.push(
        or(
          ilike(orders.orderNumber, `%${q}%`),
          ilike(orders.customerName, `%${q}%`),
          ilike(orders.customerPhone, `%${q}%`)
        )!
      );
    }
    rows = await db
      .select()
      .from(orders)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(100);
  } catch {
    rows = [];
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary shrink-0" />
          <span>Kelola Pesanan</span>
        </h1>
        <span className="text-xs font-semibold text-muted-foreground">{rows.length} pesanan termuat</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-3 px-3 sm:mx-0 sm:px-0" aria-label="Filter status pesanan">
          {TABS.map(([t, label]) => {
            const p = new URLSearchParams();
            if (t !== "ALL") p.set("status", t);
            if (q) p.set("q", q);
            const qs = p.toString();
            return (
              <Link
                key={t}
                href={`/admin/orders${qs ? `?${qs}` : ""}`}
                className={`inline-flex h-9 items-center rounded-full px-3.5 text-xs font-semibold transition-all shrink-0 ${
                  status === t
                    ? "bg-primary text-white shadow-xs font-bold"
                    : "border border-border/80 bg-card text-foreground hover:border-primary/50"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <form action="/admin/orders" method="GET" className="flex items-center gap-1.5 w-full sm:w-auto">
          {status !== "ALL" && <input type="hidden" name="status" value={status} />}
          <div className="relative flex-1 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Cari no. order, nama, WA..."
              className="h-9 w-full rounded-full pl-8.5 pr-3 text-xs"
            />
          </div>
          <Button type="submit" size="sm" className="h-9 rounded-full px-3.5 text-xs font-bold shrink-0">
            Cari
          </Button>
          {q && (
            <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
              <Link
                href={`/admin/orders${status === "ALL" ? "" : `?status=${status}`}`}
                title="Reset pencarian"
                aria-label="Reset pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </form>
      </div>

      <div className="md:hidden space-y-3">
        {rows.map((o) => (
          <Card key={o.id} className="p-3.5 shadow-xs border-border/80 bg-card">
            <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2.5">
              <div>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="font-mono font-extrabold text-sm text-foreground hover:text-primary transition-colors block"
                >
                  {o.orderNumber}
                </Link>
                <span className="text-[11px] text-muted-foreground">{formatDate(o.createdAt)}</span>
              </div>
              <Badge
                variant={statusBadgeVariant(o.status)}
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shrink-0"
              >
                {o.status.replace("_", " ")}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 py-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                  Pembeli
                </span>
                <p className="font-semibold text-foreground truncate">{o.customerName}</p>
                <a
                  href={`https://wa.me/${o.customerPhone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-primary hover:underline font-mono"
                >
                  {o.customerPhone}
                </a>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                  Total Tagihan
                </span>
                <p className="font-mono font-bold text-sm text-foreground">{rupiah(o.totalAmount)}</p>
                <span className="text-[11px] text-muted-foreground">
                  {o.proofUploadedAt ? (
                    <span className="text-emerald-600 font-bold">Bukti: Ada ✓</span>
                  ) : (
                    "Bukti: Belum ada"
                  )}
                </span>
              </div>
            </div>

            {o.trackingNumber && (
              <div className="rounded-lg bg-secondary/50 p-2 text-xs mb-3 flex items-center justify-between">
                <span className="text-muted-foreground text-[11px] font-semibold">{o.courierName}</span>
                <code className="font-mono font-bold text-foreground text-[11px] bg-background px-1.5 py-0.5 rounded border border-border/60">
                  {o.trackingNumber}
                </code>
              </div>
            )}

            <div className="pt-2.5 border-t border-border/60 flex items-center justify-between gap-2">
              <Link
                href={`/admin/orders/${o.id}`}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Detail Lengkap →
              </Link>
              <OrderActions order={{ id: o.id, status: o.status }} />
            </div>
          </Card>
        ))}

        {!rows.length && (
          <Card className="p-8 text-center text-muted-foreground text-xs">
            Tidak ada pesanan dengan status &ldquo;{status}&rdquo;.
          </Card>
        )}
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/40">
              <TableRow>
                <TableHead className="w-[180px]">Nomor &amp; Tanggal</TableHead>
                <TableHead>Pembeli</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Bukti Bayar</TableHead>
                <TableHead>Kurir &amp; Resi</TableHead>
                <TableHead className="text-right">Aksi Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((o) => (
                <TableRow key={o.id} className="align-top">
                  <TableCell>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-mono font-bold hover:text-primary transition-colors block"
                    >
                      {o.orderNumber}
                    </Link>
                    <span className="text-[11px] text-muted-foreground">{formatDate(o.createdAt)}</span>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-foreground">{o.customerName}</p>
                    <p className="text-[11px] text-muted-foreground">{o.customerPhone}</p>
                    <Badge
                      variant={statusBadgeVariant(o.status)}
                      className="mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0"
                    >
                      {o.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono font-bold text-foreground">
                    {rupiah(o.totalAmount)}
                  </TableCell>
                  <TableCell>
                    {o.proofUploadedAt ? (
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="inline-flex items-center gap-1 font-bold text-xs text-emerald-600 hover:underline"
                      >
                        <span>Tersedia ✓</span>
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">Belum ada</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {o.trackingNumber ? (
                      <div className="space-y-0.5">
                        <span className="font-semibold text-muted-foreground block">{o.courierName}</span>
                        <code className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded text-[11px]">
                          {o.trackingNumber}
                        </code>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Belum dikirim</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <OrderActions order={{ id: o.id, status: o.status }} />
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                    Tidak ada pesanan dengan status &ldquo;{status}&rdquo;.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
