/** Validasi form checkout (MVP). Pesan error bahasa Indonesia. */

const WA_RE = /^(\+62|62|0)8[1-9][0-9]{6,11}$/;
const POSTAL_RE = /^[0-9]{5}$/;
export const ADDRESS_MAX = 255; // batas label kurir
export const NAME_MAX = 150;

export function validWa(v: string): boolean {
  return WA_RE.test(v.replace(/[\s-]/g, ""));
}

export function validPostal(v: string): boolean {
  return POSTAL_RE.test(v.trim());
}

export function validAddress(v: string): boolean {
  const t = v.trim();
  return t.length >= 10 && t.length <= ADDRESS_MAX;
}

export function validName(v: string): boolean {
  const t = v.trim();
  return t.length >= 2 && t.length <= NAME_MAX;
}

/** Validasi kuantitas cart: stok 0 = tak bisa beli; clamp ke stok. */
export function clampQty(qty: number, stock: number): number {
  if (stock <= 0) return 0;
  if (!Number.isFinite(qty) || qty < 1) return 1;
  return Math.min(Math.floor(qty), stock);
}
