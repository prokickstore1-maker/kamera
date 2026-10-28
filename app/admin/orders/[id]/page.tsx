import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-session";
import { proofUrl } from "@/lib/actions";
import { rupiah, formatDate } from "@/lib/format";
import { SetNote } from "@/components/set-note";
import { OrderActions } from "@/components/order-actions";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Detail Pesanan | Admin", robots: { index: false } };

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;

  let order: typeof orders.$inferSelect | null = null;
  let items: (typeof orderItems.$inferSelect)[] = [];
  let proof: string | null = null;
  try {
    const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!row) notFound();
    order = row;
    items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    if (row.proofImageUrl) proof = await proofUrl(id);
  } catch {
    notFound();
  }

  const o = order!;
  const snap = o.paymentSnapshot;

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Daftar Pesanan</span>
        </Link>
      </div>

      <div className="y2k-card p-4 sm:p-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-extrabold font-mono">{o.orderNumber}</h1>
            <span className="y2k-pill-badge">{o.status.replace("_", " ")}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Dibuat pada {formatDate(o.createdAt)}</p>
          {o.trackingNumber && (
            <p className="mt-2 text-xs font-semibold text-foreground">
              Resi Pengiriman: <span className="text-primary">{o.courierName}</span> •{" "}
              <code className="rounded bg-secondary px-2 py-0.5 font-mono font-bold">
                {o.trackingNumber}
              </code>
            </p>
          )}
        </div>

        <OrderActions order={{ id: o.id, status: o.status }} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="y2k-card p-4 sm:p-5 text-sm">
          <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Pembeli &amp; Tujuan Pengiriman
          </h2>
          <p className="font-bold text-foreground">{o.customerName}</p>
          <p className="font-mono text-xs text-muted-foreground mt-0.5">{o.customerPhone}</p>
          <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {o.addressLine}
            <br />
            {o.city}, {o.province} {o.postalCode}
          </p>
          <dl className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs sm:text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal Produk</dt>
              <dd className="font-mono font-semibold">{rupiah(o.subtotalAmount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Ongkir Flat</dt>
              <dd className="font-mono font-semibold">{rupiah(o.shippingFee)}</dd>
            </div>
            <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border/60">
              <dt>Total Tagihan</dt>
              <dd className="font-mono text-primary">{rupiah(o.totalAmount)}</dd>
            </div>
          </dl>
          {snap && (
            <p className="mt-3 text-xs text-muted-foreground">
              Metode Bayar: <strong className="text-foreground">{snap.name}</strong>{" "}
              {snap.accountNumber ? `• ${snap.accountNumber}` : ""}
            </p>
          )}
        </section>

        <section className="y2k-card p-4 sm:p-5 text-sm">
          <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Bukti Pembayaran
          </h2>
          {o.proofUploadedAt ? (
            proof ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={proof}
                alt="Bukti pembayaran"
                className="max-h-72 w-full rounded-xl border border-border bg-secondary/30 object-contain"
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                Gagal memuat pratinjau bukti pembayaran. Silakan muat ulang halaman.
              </p>
            )
          ) : (
            <p className="text-xs text-muted-foreground">Belum ada bukti pembayaran yang diunggah.</p>
          )}
          <p className="mt-2.5 text-xs text-muted-foreground">
            Waktu unggah: {o.proofUploadedAt ? formatDate(o.proofUploadedAt) : "Belum diunggah"}
          </p>
        </section>
      </div>

      <section className="y2k-card p-4 sm:p-5 text-sm">
        <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Daftar Unit Kamera
        </h2>
        <ul className="divide-y divide-border">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between py-2 text-xs sm:text-sm">
              <span className="font-medium text-foreground">
                {i.productName} <span className="text-muted-foreground">×{i.quantity}</span>
              </span>
              <span className="font-mono font-bold">{rupiah(i.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-border pt-4">
          <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Catatan Internal Admin (Tidak Terlihat Pembeli)
          </h2>
          <SetNote orderId={o.id} initial={o.internalNotes ?? ""} />
        </div>
      </section>
    </div>
  );
}
