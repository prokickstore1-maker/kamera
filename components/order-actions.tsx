"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { transitionOrder, setTracking } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type OrderRow = { id: string; status: string };

const NEXT: Record<string, { to: string; label: string }[]> = {
  PENDING_PAYMENT: [
    { to: "PROCESSING", label: "Konfirmasi Bayar" },
    { to: "CANCELLED", label: "Batalkan" },
  ],
  PROCESSING: [
    { to: "SHIPPED", label: "Sudah Dikirim (via resi)" },
    { to: "CANCELLED", label: "Batalkan" },
  ],
  SHIPPED: [{ to: "COMPLETED", label: "Tandai Selesai" }],
};

export function OrderActions({ order }: { order: OrderRow }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resi, setResi] = useState<{ courier: string; tracking: string } | null>(null);

  const opts = NEXT[order.status] ?? [];

  return (
    <div className="flex flex-col gap-2">
      {order.status === "PROCESSING" && !resi && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => setResi({ courier: "", tracking: "" })}
          className="h-9 rounded-full text-xs font-semibold"
        >
          Input Kurir &amp; Resi…
        </Button>
      )}
      {resi && (
        <form
          className="flex flex-wrap gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await setTracking(order.id, resi.courier, resi.tracking);
              if (!r.ok) {
                setError(r.error ?? "Gagal menyimpan resi.");
                toast.error(r.error ?? "Gagal menyimpan resi.");
              } else {
                setError(null);
                setResi(null);
                toast.success("Nomor resi berhasil disimpan dan status diubah ke SHIPPED.");
                router.refresh();
              }
            });
          }}
        >
          <Input
            required
            placeholder="Kurir (J&T / JNE / SiCepat)"
            value={resi.courier}
            onChange={(e) => setResi({ ...resi, courier: e.target.value })}
            className="h-9 w-36 rounded-full text-xs"
          />
          <Input
            required
            placeholder="Nomor resi"
            value={resi.tracking}
            onChange={(e) => setResi({ ...resi, tracking: e.target.value })}
            className="h-9 w-40 rounded-full text-xs"
          />
          <Button size="sm" disabled={pending} className="h-9 rounded-full px-3.5 text-xs font-bold">
            Simpan Resi
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => setResi(null)}
            className="h-9 rounded-full px-2.5 text-xs"
          >
            Batal
          </Button>
        </form>
      )}

      <div className="flex flex-wrap gap-1.5">
        {opts.map((o) => {
          const danger = o.to === "CANCELLED";
          return (
            <Button
              key={o.to}
              type="button"
              variant={danger ? "destructive" : "default"}
              size="sm"
              disabled={pending || (order.status === "PROCESSING" && o.to === "SHIPPED")}
              onClick={() => {
                if (
                  danger &&
                  !confirm("Batalkan pesanan ini? Stok kamera akan otomatis dikembalikan ke katalog.")
                )
                  return;
                start(async () => {
                  const r = await transitionOrder(order.id, o.to);
                  if (!r.ok) {
                    setError(r.error ?? "Gagal mengubah status.");
                    toast.error(r.error ?? "Gagal mengubah status.");
                  } else {
                    setError(null);
                    setResi(null);
                    toast.success(`Status pesanan diubah ke ${o.to}`);
                    router.refresh();
                  }
                });
              }}
              className="h-9 rounded-full px-3.5 text-xs font-semibold"
            >
              {o.label}
            </Button>
          );
        })}
      </div>
      {error && <p className="text-[11px] font-semibold text-destructive">{error}</p>}
    </div>
  );
}
