/**
 * Checkout plan logic (murni, tanpa DB) — Server Action memakai fungsi ini
 * setelah memuat settings & stok dari DB.
 */
import { shippingFee, isBlocked, type ShippingZoneConfig } from "./shipping";
import { validWa, validPostal, validAddress, validName } from "./validation";

export type CheckoutItem = { productId: string; price: number; qty: number; name: string };

export type CheckoutPayload = {
  customerName: string;
  customerPhone: string;
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
};

/** Map settings key-value → config zona. */
export function buildShippingConfig(s: Record<string, string>): ShippingZoneConfig {
  let utama: string[] = [];
  try {
    const raw = s.provinces_zona_utama;
    if (raw) utama = JSON.parse(raw);
  } catch {
    utama = [];
  }
  let blokir: string[] = [];
  try {
    const raw = s.provinces_diblokir;
    if (raw) blokir = JSON.parse(raw);
  } catch {
    blokir = [];
  }
  return {
    feeUtama: Number(s.shipping_fee_utama ?? 0),
    feeLuar: Number(s.shipping_fee_luar ?? 0),
    provinsiUtama: utama,
    provinsiDiblokir: blokir,
  };
}

/** Pesan error kosong = valid. */
export function validatePayload(p: Partial<CheckoutPayload>): string[] {
  const errs: string[] = [];
  if (!validName(p.customerName ?? "")) errs.push("Nama penerima minimal 2 karakter.");
  if (!validWa(p.customerPhone ?? "")) errs.push("Nomor WhatsApp format Indonesia (08xx/+628xx).");
  if (p.province === undefined || p.province.trim() === "") errs.push("Provinsi wajib dipilih.");
  if (p.city === undefined || p.city.trim() === "") errs.push("Kota/kabupaten wajib diisi.");
  if (!validPostal(p.postalCode ?? "")) errs.push("Kode pos 5 digit angka.");
  if (!validAddress(p.addressLine ?? "")) errs.push(`Alamat 10–255 karakter.`);
  return errs;
}

export type Totals = {
  ok: boolean;
  subtotal: number;
  shippingFee: number;
  total: number;
  error?: string;
};

/** Subtotal dari harga server, bukan payload client. Onkig per order. */
export function calculateTotals(items: CheckoutItem[], province: string, cfg: ShippingZoneConfig): Totals {
  if (!items.length) return { ok: false, subtotal: 0, shippingFee: 0, total: 0, error: "Keranjang kosong." };
  if (isBlocked(province, cfg)) {
    return { ok: false, subtotal: 0, shippingFee: 0, total: 0, error: "Belum melayani pengiriman ke provinsi ini." };
  }
  if (!province || !province.trim()) {
    return { ok: false, subtotal: 0, shippingFee: 0, total: 0, error: "Provinsi wajib dipilih." };
  }
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
  const fee = shippingFee(province, cfg);
  return { ok: true, subtotal, shippingFee: fee, total: subtotal + fee };
}

/** Payment snapshot — disimpan permanen di order. */
export type PaymentSnapshot = {
  code: string;
  name: string;
  accountNumber?: string;
  accountHolder?: string;
  qrImageUrl?: string;
};

export function buildSnapshot(pm: {
  code: string;
  name: string;
  accountNumber?: string | null;
  accountHolder?: string | null;
  qrImageUrl?: string | null;
}): PaymentSnapshot {
  return {
    code: pm.code,
    name: pm.name,
    accountNumber: pm.accountNumber ?? undefined,
    accountHolder: pm.accountHolder ?? undefined,
    qrImageUrl: pm.qrImageUrl ?? undefined,
  };
}