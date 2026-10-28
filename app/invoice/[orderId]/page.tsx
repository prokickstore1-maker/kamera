import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rupiah, formatDate, waLink } from "@/lib/format";
import { ProofUpload } from "@/components/proof-upload";
import { CopyButton } from "@/components/copy-button";
import { settingsMap } from "@/lib/catalog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, MessageCircle, PackageSearch, ShieldCheck, Truck, Download, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invoice Pesanan | vintaagemeew", robots: { index: false } };

function maskName(n: string): string {
  const parts = n.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2) + ".";
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

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

export default async function InvoicePage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  let data: { order: typeof orders.$inferSelect; items: (typeof orderItems.$inferSelect)[] } | null = null;
  let wa = "6281295661659";
  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) notFound();
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    data = { order, items };
    wa = (await settingsMap()).whatsapp_number ?? wa;
  } catch {
    notFound();
  }

  const { order, items } = data!;
  const snap = order.paymentSnapshot;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Card className="p-2 sm:p-4">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block mb-0.5">
                Invoice Resmi vintaagemeew
              </span>
              <CardTitle className="text-xl sm:text-2xl font-extrabold font-mono text-foreground">
                {order.orderNumber}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{formatDate(order.createdAt)}</p>
            </div>
            <Badge
              variant={statusBadgeVariant(order.status)}
              className="text-xs px-3 py-1 font-bold uppercase tracking-wider"
            >
              {order.status.replace("_", " ")}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {order.status === "PENDING_PAYMENT" && !order.proofUploadedAt && (
            <Alert variant="warning">
              <Clock className="h-4 w-4" />
              <AlertTitle className="text-xs font-bold">Menunggu Pembayaran</AlertTitle>
              <AlertDescription className="text-xs">
                Selesaikan pembayaran sebelum{" "}
                <span className="font-bold">
                  {order.expiresAt ? formatDate(order.expiresAt) : "batas waktu pembayaran"}
                </span>{" "}
                agar stok kamera tidak otomatis dilepas kembali ke katalog.
              </AlertDescription>
            </Alert>
          )}

          {order.proofUploadedAt && (
            <Alert variant="success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle className="text-xs font-bold">
                {order.status === "PENDING_PAYMENT" ? "Bukti Masuk — Menunggu Verifikasi" : "Pembayaran Terdata"}
              </AlertTitle>
              <AlertDescription className="text-xs">
                Bukti pembayaran telah diterima pada {formatDate(order.proofUploadedAt)}
                {order.status === "PENDING_PAYMENT"
                  ? ". Admin vintaagemeew sedang memverifikasi dan akan memperbarui status pesanan."
                  : "."}
              </AlertDescription>
            </Alert>
          )}

          {order.trackingNumber && (
            <div className="rounded-2xl border border-primary/25 bg-secondary/70 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-primary">
                  Informasi Pengiriman &amp; Resi
                </h2>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {order.courierName && (
                    <Badge variant="outline" className="bg-card font-bold text-xs">
                      {order.courierName}
                    </Badge>
                  )}
                  <code className="rounded-lg border border-border bg-card px-2.5 py-1 font-mono text-xs sm:text-sm font-bold text-foreground">
                    {order.trackingNumber}
                  </code>
                </div>
                <CopyButton
                  value={order.trackingNumber}
                  label="Salin Resi"
                  toastMessage="Nomor resi berhasil disalin"
                />
              </div>
            </div>
          )}

          <div className="grid gap-3 rounded-2xl bg-muted/40 p-4 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground font-semibold">Nama Penerima</dt>
              <dd className="font-bold text-sm text-foreground mt-0.5">{maskName(order.customerName)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-semibold">Tujuan Pengiriman</dt>
              <dd className="font-bold text-sm text-foreground mt-0.5">
                {order.city}, {order.province} {order.postalCode}
              </dd>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-2">
              Item Pesanan
            </h2>
            <ul className="divide-y divide-border/60 border-y border-border/80">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between items-center gap-3 py-3 text-sm">
                  <div>
                    <p className="font-bold text-foreground">{i.productName}</p>
                    <p className="text-xs text-muted-foreground">Jumlah: {i.quantity} unit</p>
                  </div>
                  <span className="font-extrabold font-mono text-foreground">{rupiah(i.subtotal)}</span>
                </li>
              ))}
            </ul>
          </div>

          <dl className="space-y-2 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal Produk</dt>
              <dd className="font-semibold text-foreground font-mono">{rupiah(order.subtotalAmount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Ongkir Flat</dt>
              <dd className="font-semibold text-foreground font-mono">{rupiah(order.shippingFee)}</dd>
            </div>
            <Separator />
            <div className="flex justify-between items-baseline pt-1">
              <dt className="text-sm font-bold text-foreground">Total Tagihan</dt>
              <dd className="text-lg font-extrabold text-primary font-mono">{rupiah(order.totalAmount)}</dd>
            </div>
          </dl>

          {snap && (
            <div className="rounded-2xl border border-primary/20 bg-secondary/50 p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary">
                  Rekening / Tujuan Pembayaran
                </h3>
              </div>
              <p className="text-sm font-extrabold text-foreground">{snap.name}</p>
              {snap.accountNumber && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-mono font-bold text-foreground">
                    {snap.accountNumber}{" "}
                    {snap.accountHolder && (
                      <span className="text-xs text-muted-foreground font-sans">
                        a.n. {snap.accountHolder}
                      </span>
                    )}
                  </p>
                  <CopyButton
                    value={snap.accountNumber}
                    label="Salin Rekening"
                    toastMessage="Nomor rekening berhasil disalin"
                  />
                </div>
              )}
              {snap.qrImageUrl && (
                <div className="space-y-2 pt-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={snap.qrImageUrl}
                    alt="Kode QRIS vintaagemeew"
                    className="h-44 w-44 rounded-xl border border-border bg-card p-2 object-contain shadow-xs"
                  />
                  <a
                    href={snap.qrImageUrl}
                    download={`QRIS-${order.orderNumber}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Unduh Gambar QRIS</span>
                  </a>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                Mohon transfer sesuai nominal total tagihan agar proses verifikasi lebih cepat.
              </p>
            </div>
          )}

          {order.status === "PENDING_PAYMENT" && (
            <div>
              <ProofUpload
                orderId={order.id}
                initialUploadedAt={order.proofUploadedAt ? formatDate(order.proofUploadedAt) : null}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2.5 pt-2">
            <Button asChild size="default" className="rounded-full shadow-xs">
              <a
                href={waLink(wa, `Halo vintaagemeew, saya ingin menanyakan status pesanan nomor ${order.orderNumber}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Konfirmasi via WhatsApp</span>
              </a>
            </Button>
            <Button variant="outline" asChild size="default" className="rounded-full">
              <Link href="/track-order" className="flex items-center gap-2">
                <PackageSearch className="h-4 w-4" />
                <span>Lacak Pesanan</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Simpan tautan invoice ini untuk memantau status pesanan dan nomor resi pengiriman Anda.
      </p>
    </div>
  );
}
