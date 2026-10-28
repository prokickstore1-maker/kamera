"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/lib/admin-settings-actions";
import { PROVINCES } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sliders, Store, CheckCircle2 } from "lucide-react";

export function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

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

  return (
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
            {pending ? "Menyimpan…" : "Simpan Pengaturan"}
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
  );
}
