"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveSettings,
  savePaymentMethodAction,
  togglePaymentMethodActiveAction,
  deletePaymentMethodAction,
  uploadQrisImageAction,
} from "@/lib/admin-settings-actions";
import { PROVINCES } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Sliders,
  Store,
  CheckCircle2,
  CreditCard,
  Plus,
  Trash2,
  Upload,
  Save,
  QrCode,
  Power,
} from "lucide-react";

export interface PaymentMethodItem {
  id: string;
  code: string;
  name: string;
  accountNumber: string | null;
  accountHolder: string | null;
  qrImageUrl: string | null;
  instructions: string | null;
  isActive: boolean;
  sortOrder: number;
}

function PaymentMethodEditorCard({
  item,
  onSaved,
}: {
  item: PaymentMethodItem;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [code, setCode] = useState(item.code);
  const [accountNumber, setAccountNumber] = useState(item.accountNumber ?? "");
  const [accountHolder, setAccountHolder] = useState(item.accountHolder ?? "");
  const [qrImageUrl, setQrImageUrl] = useState(item.qrImageUrl ?? "");
  const [instructions, setInstructions] = useState(item.instructions ?? "");
  const [sortOrder, setSortOrder] = useState(String(item.sortOrder ?? 1));
  const [isActive, setIsActive] = useState(item.isActive);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [pending, start] = useTransition();

  async function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQr(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadQrisImageAction(fd);
      if (res.ok && res.url) {
        setQrImageUrl(res.url);
        toast.success("Gambar QRIS berhasil diunggah ke S3!");
      } else {
        toast.error(res.error ?? "Gagal mengunggah QRIS.");
      }
    } finally {
      setUploadingQr(false);
      e.target.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-background/60 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Badge variant={isActive ? "default" : "secondary"} className="text-[10px]">
            {isActive ? "Aktif" : "Nonaktif"}
          </Badge>
          <span className="font-bold text-sm text-foreground">{item.name}</span>
          <span className="text-[11px] font-mono text-muted-foreground">({item.code})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => {
              const nextState = !isActive;
              setIsActive(nextState);
              start(async () => {
                const r = await togglePaymentMethodActiveAction(item.id, nextState);
                if (r.ok) {
                  toast.success(nextState ? "Rekening diaktifkan." : "Rekening dinonaktifkan.");
                  onSaved();
                } else {
                  setIsActive(!nextState);
                  toast.error(r.error ?? "Gagal mengubah status.");
                }
              });
            }}
            className="h-7 rounded-full text-xs px-2.5"
          >
            <Power className="h-3 w-3 mr-1" />
            {isActive ? "Nonaktifkan" : "Aktifkan"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={() => {
              if (!confirm(`Hapus rekening "${item.name}"?`)) return;
              start(async () => {
                const r = await deletePaymentMethodAction(item.id);
                if (r.ok) {
                  toast.success("Rekening berhasil dihapus.");
                  onSaved();
                } else {
                  toast.error(r.error ?? "Gagal menghapus rekening.");
                }
              });
            }}
            className="h-7 rounded-full text-xs px-2.5"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Hapus
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Nama Bank / Metode Pembayaran</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="cth: Transfer Bank BCA / QRIS Instan"
            className="h-9 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Kode Unik</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="cth: BCA_TRANSFER"
            className="h-9 text-xs font-mono"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Nomor Rekening (Kosongkan jika QRIS)</Label>
          <Input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="cth: 8730291823"
            className="h-9 text-xs font-mono"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Atas Nama Pemilik Rekening (A/N)</Label>
          <Input
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            placeholder="cth: VINTAGEMEEW KEDIRI"
            className="h-9 text-xs"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <QrCode className="h-3 w-3 text-primary" />
            <span>Gambar QRIS (Opsional, khusus metode QRIS)</span>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              value={qrImageUrl}
              onChange={(e) => setQrImageUrl(e.target.value)}
              placeholder="https://is3.cloudhost.id/kamera/qris/..."
              className="h-9 text-xs flex-1"
            />
            <label className="inline-flex items-center justify-center gap-1.5 rounded-full bg-secondary px-3 h-9 text-xs font-bold text-foreground hover:bg-secondary/80 cursor-pointer shrink-0 border border-border">
              <Upload className="h-3.5 w-3.5 text-primary" />
              <span>{uploadingQr ? "Mengunggah…" : "Upload QRIS"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={uploadingQr}
                onChange={handleQrUpload}
              />
            </label>
          </div>
          {qrImageUrl && (
            <div className="mt-1.5 flex items-center gap-2">
              <img
                src={qrImageUrl}
                alt="Preview QRIS"
                className="h-14 w-14 rounded-lg border border-border object-contain bg-white p-1"
              />
              <button
                type="button"
                onClick={() => setQrImageUrl("")}
                className="text-[11px] text-destructive hover:underline font-medium"
              >
                Hapus gambar QRIS
              </button>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Urutan Tampil</Label>
          <Input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="h-9 text-xs"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Instruksi Pembayaran di Invoice</Label>
        <Textarea
          rows={2}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Instruksi singkat cara transfer untuk pembeli..."
          className="text-xs"
        />
      </div>

      <div className="flex justify-end pt-1">
        <Button
          type="button"
          size="sm"
          disabled={pending || uploadingQr}
          onClick={() => {
            start(async () => {
              const r = await savePaymentMethodAction({
                id: item.id,
                code,
                name,
                accountNumber: accountNumber || null,
                accountHolder: accountHolder || null,
                qrImageUrl: qrImageUrl || null,
                instructions: instructions || null,
                isActive,
                sortOrder: Number(sortOrder) || 0,
              });
              if (r.ok) {
                toast.success(`Rekening "${name}" berhasil disimpan!`);
                onSaved();
              } else {
                toast.error(r.error ?? "Gagal menyimpan rekening.");
              }
            });
          }}
          className="rounded-full text-xs px-4"
        >
          <Save className="h-3.5 w-3.5 mr-1.5" />
          {pending ? "Menyimpan…" : "Simpan Perubahan Rekening"}
        </Button>
      </div>
    </div>
  );
}

export function SettingsForm({
  initial,
  paymentMethods = [],
}: {
  initial: Record<string, string>;
  paymentMethods?: PaymentMethodItem[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  // State untuk form tambah rekening baru
  const [showAddBank, setShowAddBank] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newAccNum, setNewAccNum] = useState("");
  const [newAccHolder, setNewAccHolder] = useState("");
  const [newQrUrl, setNewQrUrl] = useState("");
  const [newInstructions, setNewInstructions] = useState("");
  const [uploadingNewQr, setUploadingNewQr] = useState(false);

  const [utamaList, setUtamaList] = useState<string[]>(() => {
    try {
      const v = initial.provinces_zona_utama;
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  });
  const [blokirList, setBlokirList] = useState<string[]>(() => {
    try {
      const v = initial.provinces_diblokir;
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  });

  async function handleNewQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingNewQr(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadQrisImageAction(fd);
      if (res.ok && res.url) {
        setNewQrUrl(res.url);
        toast.success("Gambar QRIS berhasil diunggah ke S3!");
      } else {
        toast.error(res.error ?? "Gagal mengunggah QRIS.");
      }
    } finally {
      setUploadingNewQr(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      {/* BAGIAN 1: KELOLA REKENING BANK & QRIS */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-extrabold flex items-center gap-2 text-foreground">
              <CreditCard className="h-4 w-4 text-primary" />
              <span>Rekening Bank &amp; Metode Pembayaran (QRIS / Transfer)</span>
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Ubah nomor rekening BCA, Mandiri, BRI, atau unggah barcode QRIS toko yang tampil saat checkout.
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setShowAddBank((v) => !v)}
            className="rounded-full text-xs shrink-0"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {showAddBank ? "Tutup Form" : "Tambah Rekening Baru"}
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {showAddBank && (
            <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 space-y-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-primary">
                + Tambah Rekening / Metode Pembayaran Baru
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nama Bank / Metode *</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="cth: Transfer Bank BRI / SeaBank / QRIS"
                    className="h-9 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Kode Metode (Opsional)</Label>
                  <Input
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="cth: BRI_TRANSFER"
                    className="h-9 text-xs font-mono bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nomor Rekening</Label>
                  <Input
                    value={newAccNum}
                    onChange={(e) => setNewAccNum(e.target.value)}
                    placeholder="cth: 00123456789"
                    className="h-9 text-xs font-mono bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Atas Nama (A/N)</Label>
                  <Input
                    value={newAccHolder}
                    onChange={(e) => setNewAccHolder(e.target.value)}
                    placeholder="cth: VINTAGEMEEW KEDIRI"
                    className="h-9 text-xs bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Gambar QRIS (Jika Metode QRIS)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={newQrUrl}
                    onChange={(e) => setNewQrUrl(e.target.value)}
                    placeholder="URL gambar QRIS atau klik Upload QRIS..."
                    className="h-9 text-xs bg-background flex-1"
                  />
                  <label className="inline-flex items-center justify-center gap-1.5 rounded-full bg-secondary px-3 h-9 text-xs font-bold text-foreground hover:bg-secondary/80 cursor-pointer shrink-0 border border-border">
                    <Upload className="h-3.5 w-3.5 text-primary" />
                    <span>{uploadingNewQr ? "Mengunggah…" : "Upload QRIS"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      disabled={uploadingNewQr}
                      onChange={handleNewQrUpload}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Instruksi Pembayaran</Label>
                <Textarea
                  rows={2}
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="cth: Transfer sesuai nominal hingga 3 digit terakhir, lalu unggah bukti bayar."
                  className="text-xs bg-background"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddBank(false)}
                  className="rounded-full text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={pending || uploadingNewQr}
                  onClick={() => {
                    if (!newName.trim()) {
                      toast.error("Nama bank / metode pembayaran wajib diisi.");
                      return;
                    }
                    start(async () => {
                      const r = await savePaymentMethodAction({
                        code: newCode || newName,
                        name: newName,
                        accountNumber: newAccNum || null,
                        accountHolder: newAccHolder || null,
                        qrImageUrl: newQrUrl || null,
                        instructions: newInstructions || null,
                        isActive: true,
                        sortOrder: paymentMethods.length + 1,
                      });
                      if (r.ok) {
                        toast.success("Rekening baru berhasil ditambahkan!");
                        setNewName("");
                        setNewCode("");
                        setNewAccNum("");
                        setNewAccHolder("");
                        setNewQrUrl("");
                        setNewInstructions("");
                        setShowAddBank(false);
                        router.refresh();
                      } else {
                        toast.error(r.error ?? "Gagal menambahkan rekening.");
                      }
                    });
                  }}
                  className="rounded-full text-xs px-4"
                >
                  Simpan Rekening Baru
                </Button>
              </div>
            </div>
          )}

          {paymentMethods.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Belum ada metode pembayaran terdaftar. Klik tombol <strong>+ Tambah Rekening Baru</strong> di atas.
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <PaymentMethodEditorCard
                  key={pm.id}
                  item={pm}
                  onSaved={() => router.refresh()}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* BAGIAN 2: ONGKIR & OPERASIONAL TOKO */}
      <form
        className="grid gap-6 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          start(async () => {
            const r = await saveSettings({
              shipping_fee_utama: String(fd.get("shipping_fee_utama") ?? ""),
              shipping_fee_luar: String(fd.get("shipping_fee_luar") ?? ""),
              provinces_zona_utama: JSON.stringify(utamaList),
              provinces_diblokir: JSON.stringify(blokirList),
              auto_cancel_hours: String(fd.get("auto_cancel_hours") ?? "2"),
              whatsapp_number: String(fd.get("whatsapp_number") ?? ""),
              store_address: String(fd.get("store_address") ?? ""),
              running_banner_text: String(fd.get("running_banner_text") ?? ""),
            });
            if (r.ok) {
              setMsg("Pengaturan toko berhasil disimpan.");
              toast.success("Pengaturan toko berhasil diperbarui!");
            } else {
              setMsg(r.error ?? "Gagal menyimpan pengaturan.");
              toast.error(r.error ?? "Gagal menyimpan pengaturan.");
            }
            router.refresh();
          });
        }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Sliders className="h-4 w-4 text-primary" />
              <span>Ongkir &amp; Zona Pengiriman</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="shipping_fee_utama">Tarif Zona Utama (IDR)</Label>
              <Input
                id="shipping_fee_utama"
                name="shipping_fee_utama"
                type="number"
                defaultValue={initial.shipping_fee_utama ?? "25000"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shipping_fee_luar">Tarif Zona Luar (IDR)</Label>
              <Input
                id="shipping_fee_luar"
                name="shipping_fee_luar"
                type="number"
                defaultValue={initial.shipping_fee_luar ?? "45000"}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Provinsi Zona Utama ({utamaList.length})</Label>
              <div className="max-h-40 overflow-auto rounded-xl border border-border/80 bg-background/50 p-2 text-xs space-y-1">
                {PROVINCES.map((p) => (
                  <label key={p} className="flex items-center gap-2 py-0.5 cursor-pointer hover:text-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={utamaList.includes(p)}
                      onChange={(e) => setUtamaList((cur) => (e.target.checked ? [...cur, p] : cur.filter((x) => x !== p)))}
                      className="rounded border-border accent-primary"
                    />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Provinsi Diblokir ({blokirList.length})</Label>
              <div className="max-h-28 overflow-auto rounded-xl border border-border/80 bg-background/50 p-2 text-xs space-y-1">
                {PROVINCES.map((p) => (
                  <label key={p} className="flex items-center gap-2 py-0.5 cursor-pointer hover:text-destructive transition-colors">
                    <input
                      type="checkbox"
                      checked={blokirList.includes(p)}
                      onChange={(e) => setBlokirList((cur) => (e.target.checked ? [...cur, p] : cur.filter((x) => x !== p)))}
                      className="rounded border-border accent-destructive"
                    />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Store className="h-4 w-4 text-primary" />
              <span>Operasional &amp; Tampilan Toko</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="auto_cancel_hours">Batas Auto-Cancel (Jam)</Label>
              <Input
                id="auto_cancel_hours"
                name="auto_cancel_hours"
                type="number"
                min={1}
                max={72}
                defaultValue={initial.auto_cancel_hours ?? "2"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp_number">Nomor WhatsApp Admin</Label>
              <Input
                id="whatsapp_number"
                name="whatsapp_number"
                defaultValue={initial.whatsapp_number ?? ""}
                placeholder="6281234567890"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="store_address">Lokasi / Alamat Toko (Footer)</Label>
              <Input
                id="store_address"
                name="store_address"
                defaultValue={initial.store_address ?? "Pare, Kediri, Jawa Timur"}
                placeholder="Pare, Kediri, Jawa Timur"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="running_banner_text">Teks Running Banner</Label>
              <Textarea
                id="running_banner_text"
                name="running_banner_text"
                rows={3}
                defaultValue={initial.running_banner_text ?? ""}
                placeholder="✦ VINTAGE & PRELOVED DIGICAMS..."
              />
            </div>
            <Button
              type="submit"
              disabled={pending}
              className="w-full rounded-full"
            >
              {pending ? "Menyimpan…" : "Simpan Pengaturan Operasional"}
            </Button>
            {msg && (
              <p className="text-center text-xs font-semibold text-emerald-600 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{msg}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
