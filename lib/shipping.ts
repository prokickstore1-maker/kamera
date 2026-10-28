/**
 * Ongkir dua zona tetap (MVP): utama / luar, tarif flat IDR per order.
 * Provinsi tak terpetakan = luar. Provinsi diblokir = tidak bisa checkout.
 */
export type ShippingZoneConfig = {
  feeUtama: number;
  feeLuar: number;
  /** provinsi yang masuk zona utama (case-insensitive) */
  provinsiUtama: string[];
  /** provinsi yang diblokir pengiriman */
  provinsiDiblokir: string[];
};

export function isBlocked(province: string, cfg: ShippingZoneConfig): boolean {
  const p = province.trim().toLowerCase();
  return cfg.provinsiDiblokir.some((x) => x.trim().toLowerCase() === p);
}

export function shippingFee(province: string, cfg: ShippingZoneConfig): number {
  const p = province.trim().toLowerCase();
  return cfg.provinsiUtama.some((x) => x.trim().toLowerCase() === p) ? cfg.feeUtama : cfg.feeLuar;
}
