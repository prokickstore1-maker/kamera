"use client";

import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { cartActions, useCart } from "@/lib/cart";
import { useHydrated } from "@/lib/use-hydrated";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  product: {
    productId: string;
    slug: string;
    name: string;
    price: number;
    imageUrl: string | null;
    stock: number;
  };
};

export function AddToCartButton({ product }: Props) {
  const [state, setState] = useState<"idle" | "added">("idle");
  const items = useCart();
  const mounted = useHydrated();
  const soldOut = product.stock <= 0;

  const inCartQty = mounted
    ? (items.find((i) => i.productId === product.productId)?.qty ?? 0)
    : 0;
  const reachedMax = inCartQty >= product.stock;

  if (soldOut) {
    return (
      <Button
        disabled
        variant="secondary"
        size="lg"
        className="w-full opacity-60 cursor-not-allowed"
      >
        Kamera Telah Terjual (Habis)
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="lg"
      onClick={() => {
        if (reachedMax) {
          toast.info(`Seluruh stok ${product.name} (${product.stock} unit) sudah ada di keranjang.`, {
            description: "Buka halaman keranjang untuk melanjutkan pembayaran.",
          });
          return;
        }
        cartActions.add(product, 1);
        setState("added");
        toast.success(`${product.name} ditambahkan ke keranjang.`, {
          description: "Buka halaman keranjang untuk melanjutkan ke pengiriman.",
        });
        setTimeout(() => setState("idle"), 1600);
      }}
      className="w-full text-base font-bold shadow-sm hover:shadow-md transition-all"
    >
      {state === "added" ? (
        <>
          <Check className="h-4 w-4" /> Masuk Keranjang
        </>
      ) : reachedMax ? (
        <>
          <Check className="h-4 w-4" /> Sudah di Keranjang ({inCartQty}/{product.stock})
        </>
      ) : (
        <>
          <ShoppingBag className="h-4 w-4" /> Tambah ke Keranjang
        </>
      )}
    </Button>
  );
}
