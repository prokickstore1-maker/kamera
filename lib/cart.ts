"use client";

/**
 * Cart client-side: external store native (tanpa dependency), persist localStorage.
 * Subscriber list + useSyncExternalStore — cocok untuk MVP, ganti Zustand kalau perlu.
 */
import { useSyncExternalStore } from "react";
import { clampQty } from "./validation";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  qty: number;
};

const KEY = "vintaagemeew-cart";
let cache: CartItem[] = load();
const subs = new Set<() => void>();

function load(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    // sanitasi: buang entri rusak/basi, paksa tipe angka
    return parsed.flatMap((x): CartItem[] => {
      if (!x || typeof x !== "object") return [];
      const i = x as Record<string, unknown>;
      const stock = Number(i.stock);
      const price = Number(i.price);
      const qty = Number(i.qty);
      if (typeof i.productId !== "string" || !Number.isFinite(stock) || !Number.isFinite(price)) return [];
      // item ber-stok 0 tidak sah di keranjang (add() menolaknya) — sisa data basi
      if (stock <= 0) return [];
      if (!Number.isFinite(qty) || qty < 1) return [];
      return [
        {
          productId: i.productId,
          slug: String(i.slug ?? ""),
          name: String(i.name ?? ""),
          price,
          imageUrl: typeof i.imageUrl === "string" ? i.imageUrl : null,
          stock,
          qty: Math.min(Math.floor(qty), stock),
        },
      ];
    });
  } catch {
    return [];
  }
}

function save(next: CartItem[]) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode: state hilang saat reload, tidak fatal */
  }
  for (const fn of subs) fn();
}

function subscribe(fn: () => void) {
  subs.add(fn);
  return () => subs.delete(fn);
}

export const cartActions = {
  add(item: Omit<CartItem, "qty">, qty = 1) {
    const max = clampQty(qty, item.stock);
    if (max === 0) return;
    const existing = cache.find((i) => i.productId === item.productId);
    if (existing) {
      // item (harga/stok/nama/foto) selalu menang atas data lama di localStorage
      save(
        cache.map((i) =>
          i.productId === item.productId
            ? { ...i, ...item, qty: clampQty(i.qty + max, item.stock) }
            : i,
        ),
      );
    } else {
      save([...cache, { ...item, qty: max }]);
    }
  },
  remove(productId: string) {
    save(cache.filter((i) => i.productId !== productId));
  },
  setQty(productId: string, qty: number) {
    save(
      cache
        .map((i) => (i.productId === productId ? { ...i, qty: clampQty(qty, i.stock) } : i))
        .filter((i) => i.qty > 0),
    );
  },
  clear() {
    save([]);
  },
  /** Sinkron stok/harga dari server (redirect checkout); item stock 0 hilang. */
  sync(server: { productId: string; stock: number; price: number }[]) {
    const map = new Map(server.map((p) => [p.productId, p]));
    save(
      cache
        .map((i) => {
          const p = map.get(i.productId);
          if (!p || p.stock <= 0) return null;
          return { ...i, stock: p.stock, price: p.price, qty: clampQty(i.qty, p.stock) };
        })
        .filter((i): i is CartItem => i !== null && i.qty > 0),
    );
  },
};

/** Snapshot stabil untuk React (strict mode & SSR aman). */
const empty: CartItem[] = [];
export function useCart(): CartItem[] {
  return useSyncExternalStore(
    subscribe,
    () => cache,
    () => empty,
  );
}

export function getSnapshotOnce(): CartItem[] {
  return cache;
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.qty, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.price * i.qty, 0);
}