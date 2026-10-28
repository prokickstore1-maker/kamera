"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/lib/use-hydrated";
import { cartActions, useCart, cartSubtotal, getSnapshotOnce } from "@/lib/cart";
import { cartStock, createOrder } from "@/lib/actions";
import { PROVINCES } from "@/lib/geo";
import { rupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, CreditCard, ShieldCheck, AlertCircle, ShoppingBag } from "lucide-react";

type Props = {
  feeUtama: number;
  feeLuar: number;
  utama: string[];
  blocked: string[];
  paymentMethods: { id: string; code: string; name: string; accountNumber?: string | null }[];
};

function feeFor(province: string, utama: string[], feeUtama: number, feeLuar: number): number {
  return utama.some((p) => p.toLowerCase() === province.trim().toLowerCase()) ? feeUtama : feeLuar;
}

export function CheckoutForm({ feeUtama, feeLuar, utama, blocked, paymentMethods }: Props) {
  const router = useRouter();
  const items = useCart();
  const mounted = useHydrated();

  const [key] = useState(() => crypto.randomUUID());
  const [payId, setPayId] = useState(paymentMethods[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    addressLine: "",
    city: "",
    province: "",
    postalCode: "",
  });

  const blockedSet = useMemo(() => new Set(blocked.map((b) => b.toLowerCase())), [blocked]);
  const subtotal = cartSubtotal(items);
  const fee = form.province ? feeFor(form.province, utama, feeUtama, feeLuar) : feeLuar;
  const provOk = Boolean(form.province && !blockedSet.has(form.province.toLowerCase()));

  // sinkron stok/harga dari server sebelum order dibuat (M-2)
  useEffect(() => {
    if (!mounted) return;
    const ids = getSnapshotOnce().map((i) => i.productId);
    if (!ids.length) return;
    void cartStock(ids).then((rows) => {
      if (rows.length) cartActions.sync(rows);
    });
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary animate-pulse">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">Menyiapkan halaman checkout…</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="py-20 text-center max-w-sm mx-auto space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary border border-border text-primary">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-foreground">Belum Ada Item untuk Checkout</h2>
          <p className="mt-1 text-xs text-muted-foreground">Pilih kamera di katalog terlebih dahulu sebelum melanjutkan pembayaran.</p>
        </div>
        <Button asChild size="lg" className="rounded-full shadow-sm">
          <Link href="/products">Ke Katalog Kamera</Link>
        </Button>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await createOrder({
        payload: form,
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        paymentMethodId: payId,
        idempotencyKey: key,
      });
      if (res.ok) {
        cartActions.clear();
        toast.success("Pesanan berhasil dibuat. Mengalihkan ke halaman invoice…");
        router.push(`/invoice/${res.orderId}`);
      } else {
        setError(res.error);
        toast.error(res.error ?? "Gagal memproses pesanan.");
      }
    } catch {
      setError("Gagal memproses pesanan. Silakan periksa koneksi internet Anda dan coba kembali.");
      toast.error("Gagal memproses pesanan.");
    } finally {
      setBusy(false);
    }
  }

  const activeShippingFee = form.province && provOk ? fee : 0;

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px]" noValidate>
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Alamat &amp; Data Pengiriman</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="customerName">Nama Penerima</Label>
                <Input
                  id="customerName"
                  required
                  placeholder="Contoh: Nadia Putri"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  maxLength={150}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customerPhone">Nomor WhatsApp</Label>
                <Input
                  id="customerPhone"
                  required
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  placeholder="0812xxxx atau 62812xxxx"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="province">Provinsi Tujuan</Label>
              <Select
                value={form.province || undefined}
                onValueChange={(val) => setForm({ ...form, province: val })}
              >
                <SelectTrigger id="province" className="h-11 w-full rounded-xl">
                  <SelectValue placeholder="Pilih provinsi pengiriman…" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((p) => {
                    const isBlocked = blockedSet.has(p.toLowerCase());
                    return (
                      <SelectItem key={p} value={p} disabled={isBlocked}>
                        {p}
                        {isBlocked ? " (belum dilayani)" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="city">Kota / Kabupaten</Label>
                <Input
                  id="city"
                  required
                  placeholder="Contoh: Kota Kediri"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  autoComplete="address-level2"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="postalCode">Kode Pos (5 digit)</Label>
                <Input
                  id="postalCode"
                  required
                  placeholder="64121"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  minLength={5}
                  maxLength={5}
                  inputMode="numeric"
                  autoComplete="postal-code"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="addressLine">Alamat Lengkap Rumah / Kantor (10–255 karakter)</Label>
              <Textarea
                id="addressLine"
                required
                minLength={10}
                maxLength={255}
                placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, dan patokan lokasi..."
                value={form.addressLine}
                onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                rows={3}
                autoComplete="street-address"
              />
            </div>

            {form.province && provOk && (
              <p className="text-xs font-semibold text-primary">
                ✓ Ongkir untuk {form.province}: {rupiah(fee)}
              </p>
            )}
            {form.province && !provOk && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-semibold">
                  Mohon maaf, pengiriman ke provinsi ini saat ini belum dilayani.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <CreditCard className="h-4 w-4 text-primary" />
              <span>Metode Pembayaran</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethods.length === 0 && (
              <p className="text-xs text-muted-foreground">Metode pembayaran belum dikonfigurasi admin.</p>
            )}
            {paymentMethods.map((pm) => (
              <label
                key={pm.id}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-4 transition-all ${
                  payId === pm.id
                    ? "border-primary bg-secondary/70 shadow-2xs"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="pay"
                    value={pm.id}
                    checked={payId === pm.id}
                    onChange={() => setPayId(pm.id)}
                    className="accent-primary h-4 w-4"
                  />
                  <div>
                    <span className="text-sm font-bold text-foreground block">{pm.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Unggah bukti transfer di halaman invoice setelah pesanan dibuat
                    </span>
                  </div>
                </div>
                {pm.accountNumber && (
                  <Badge variant="outline" className="text-xs font-mono">
                    •••• {pm.accountNumber.slice(-4)}
                  </Badge>
                )}
              </label>
            ))}
          </CardContent>
        </Card>
      </div>

      <aside>
        <Card className="sticky top-20">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Rincian Tagihan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-xs">
              {items.map((i) => (
                <li key={i.productId} className="flex justify-between items-start gap-2">
                  <span className="line-clamp-1 font-medium text-foreground">
                    {i.name} <span className="text-muted-foreground">×{i.qty}</span>
                  </span>
                  <span className="shrink-0 font-bold font-mono">{rupiah(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>

            <Separator />

            <dl className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">Subtotal Produk</dt>
                <dd className="font-semibold text-foreground font-mono">{rupiah(subtotal)}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">Ongkir Flat</dt>
                <dd className="font-semibold text-foreground font-mono">
                  {!form.province
                    ? "Pilih provinsi"
                    : provOk
                    ? rupiah(fee)
                    : "Tidak tersedia"}
                </dd>
              </div>
              <Separator />
              <div className="flex justify-between items-baseline pt-1">
                <dt className="font-bold text-foreground text-sm">Total Pembayaran</dt>
                <dd className="text-lg font-extrabold text-primary font-mono">
                  {rupiah(subtotal + activeShippingFee)}
                </dd>
              </div>
            </dl>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={busy || !provOk || paymentMethods.length === 0}
              className="w-full text-sm font-bold shadow-sm hover:shadow-md transition-all rounded-full"
            >
              {busy ? "Memproses Pesanan…" : "Buat Pesanan & Lanjut Bayar"}
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Stok dikunci otomatis saat pesanan dibuat</span>
            </div>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}
