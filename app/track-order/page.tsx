import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { rupiah, formatDate } from "@/lib/format";
import { CopyButton } from "@/components/copy-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PackageSearch, AlertCircle, ArrowLeft, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lacak Pesanan | vintagemeew", robots: { index: false } };

const STATUS_STEP: Record<string, number> = {
  PENDING_PAYMENT: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  COMPLETED: 4,
  CANCELLED: 0,
};

function normalizeWa(v: string): string {
  const d = v.replace(/[^\d]/g, "");
  return d.startsWith("0") ? `62${d.slice(1)}` : d;
}

function courierTrackUrl(courier: string | null | undefined, resi: string): string {
  const c = (courier ?? "").toLowerCase();
  const r = encodeURIComponent(resi.trim());
  if (c.includes("j&t") || c.includes("jnt")) return `https://jet.co.id/track`;
  if (c.includes("jne")) return `https://www.jne.co.id/id/tracking/trace`;
  if (c.includes("sicepat")) return `https://www.sicepat.com/checkAwb`;
  if (c.includes("pos")) return `https://www.posindonesia.co.id/id/tracking`;
  if (c.includes("anteraja")) return `https://anteraja.id/tracking`;
  return `https://cekresi.com/?noresi=${r}`;
}

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ no?: string; hp?: string; err?: string }>;
}) {
  const sp = await searchParams;
  let result: (typeof orders.$inferSelect) | null = null;
  let err = sp.err ?? "";

  if (sp.no || sp.hp) {
    const ip = await clientIp();
    const rl = rateLimit("track", ip, 15, 15 * 60_000);
    if (!rl.ok) {
      err = "Terlalu banyak percobaan pencarian. Mohon tunggu beberapa saat.";
    } else if (!sp.no || !sp.hp) {
      err = "Nomor pesanan dan nomor WhatsApp wajib diisi.";
    } else {
      try {
        const [row] = await db
          .select()
          .from(orders)
          .where(
            and(
              eq(orders.orderNumber, sp.no.trim().toUpperCase()),
              sql`regexp_replace(regexp_replace(${orders.customerPhone}, '[^0-9]', '', 'g'), '^0', '62') = ${normalizeWa(sp.hp)}`,
            ),
          )
          .limit(1);
        if (!row) err = "Pesanan tidak ditemukan. Periksa kembali nomor pesanan dan nomor WhatsApp Anda.";
        else result = row;
      } catch {
        err = "Layanan sedang sibuk, silakan coba lagi.";
      }
    }
  }

  const step = result ? STATUS_STEP[result.status] ?? 0 : 0;
  const steps = ["Menunggu Bayar", "Diproses", "Dikirim", "Selesai"];

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <PackageSearch className="h-6 w-6 text-primary" />
          <span>Lacak Pesanan</span>
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Masukkan nomor pesanan dan nomor WhatsApp yang digunakan saat checkout untuk memeriksa status pengiriman.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form method="GET" className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="no">Nomor Pesanan</Label>
              <Input
                id="no"
                name="no"
                defaultValue={sp.no ?? ""}
                placeholder="VMW-20261028-001"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hp">Nomor WhatsApp Pembeli</Label>
              <Input
                id="hp"
                name="hp"
                defaultValue={sp.hp ?? ""}
                inputMode="tel"
                placeholder="0812xxxx atau 62812xxxx"
                required
              />
            </div>
            <Button type="submit" className="w-full rounded-full shadow-xs">
              Lacak Pesanan Saya
            </Button>
          </form>

          {err && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-semibold">{err}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase">Nomor Pesanan</span>
                <CardTitle className="text-lg font-mono font-extrabold text-foreground">
                  {result.orderNumber}
                </CardTitle>
              </div>
              <Badge variant="default" className="text-xs font-bold uppercase tracking-wider px-3 py-1">
                {result.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(result.createdAt)} • Total:{" "}
              <span className="font-bold font-mono text-foreground">{rupiah(result.totalAmount)}</span>
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {result.status !== "CANCELLED" && (
              <ol className="flex gap-2" aria-label="Status pengiriman">
                {steps.map((s, i) => (
                  <li key={s} className="flex-1">
                    <div className={`h-2 rounded-full transition-all ${i < step ? "bg-primary" : "bg-muted"}`} />
                    <p
                      className={`mt-1.5 text-center text-[10px] leading-tight ${
                        i < step ? "font-bold text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {s}
                    </p>
                  </li>
                ))}
              </ol>
            )}

            {result.trackingNumber && (
              <div className="rounded-2xl border border-primary/20 bg-secondary/60 p-3.5 text-xs space-y-2.5">
                <span className="font-semibold text-muted-foreground block">Kurir &amp; Nomor Resi Pengiriman:</span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-card font-bold">
                      {result.courierName}
                    </Badge>
                    <code className="rounded-lg bg-card px-2.5 py-1 font-mono font-bold text-foreground border border-border">
                      {result.trackingNumber}
                    </code>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CopyButton
                      value={result.trackingNumber}
                      label="Salin"
                      toastMessage="Nomor resi berhasil disalin"
                    />
                    <a
                      href={courierTrackUrl(result.courierName, result.trackingNumber)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1 rounded-full bg-primary px-3 text-xs font-bold text-white hover:bg-primary/90 transition-colors"
                    >
                      <span>Cek Kurir</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-1">
              <Link
                href={`/invoice/${result.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span>Buka Halaman Invoice Lengkap →</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="mt-8 text-center text-xs">
        <Link href="/" className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>
      </p>
    </div>
  );
}
