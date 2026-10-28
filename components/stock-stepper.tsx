"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStock } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";

export function StockStepper({ productId, stock: initial }: { productId: string; stock: number }) {
  const router = useRouter();
  const [stock, setStock] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function step(delta: number) {
    setError(null);
    const prev = stock;
    const optimistic = Math.max(0, prev + delta);
    setStock(optimistic);
    start(async () => {
      const r = await updateStock(productId, delta);
      if (r.ok) {
        setStock(r.stock ?? optimistic);
        toast.success(`Stok diperbarui menjadi ${r.stock ?? optimistic}`);
        router.refresh();
      } else {
        setStock(prev);
        setError(r.error ?? "Gagal mengubah stok.");
        toast.error(r.error ?? "Gagal mengubah stok.");
      }
    });
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Kurangi stok"
        disabled={pending || stock <= 0}
        onClick={() => step(-1)}
        className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-xs"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="min-w-7 text-center text-xs font-mono font-bold text-foreground">{stock}</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Tambah stok"
        disabled={pending}
        onClick={() => step(1)}
        className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-xs"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
      {error && <span className="text-[11px] font-semibold text-destructive">{error}</span>}
    </div>
  );
}
