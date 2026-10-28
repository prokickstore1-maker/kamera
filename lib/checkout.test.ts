import { describe, it, expect } from "vitest";
import {
  buildShippingConfig,
  validatePayload,
  calculateTotals,
  buildSnapshot,
} from "./checkout";

const settings = {
  shipping_fee_utama: "25000",
  shipping_fee_luar: "45000",
  provinces_zona_utama: JSON.stringify(["DKI Jakarta", "Jawa Barat"]),
  provinces_diblokir: JSON.stringify(["Papua"]),
};

const cfg = buildShippingConfig(settings);

const validPayload = {
  customerName: "Budi Santoso",
  customerPhone: "081234567890",
  addressLine: "Jl. Merdeka No. 1, RT 01 RW 02",
  city: "Jakarta Selatan",
  province: "DKI Jakarta",
  postalCode: "12110",
};

describe("buildShippingConfig", () => {
  it("baca fee dan daftar provinsi dari settings", () => {
    expect(cfg.feeUtama).toBe(25000);
    expect(cfg.feeLuar).toBe(45000);
    expect(cfg.provinsiUtama).toContain("DKI Jakarta");
    expect(cfg.provinsiDiblokir).toContain("Papua");
  });
  it("settings rusak = default aman", () => {
    const c = buildShippingConfig({});
    expect(c.feeUtama).toBe(0);
    expect(c.provinsiUtama).toEqual([]);
  });
});

describe("validatePayload", () => {
  it("payload valid = tanpa error", () => {
    expect(validatePayload(validPayload)).toEqual([]);
  });
  it("properti hilang = beberapa error", () => {
    const errs = validatePayload({});
    expect(errs.length).toBeGreaterThanOrEqual(5);
  });
  it("kode pos 4 digit ditolak", () => {
    const errs = validatePayload({ ...validPayload, postalCode: "1234" });
    expect(errs.join(" ")).toMatch(/kode pos/i);
  });
});

describe("calculateTotals", () => {
  const items = [
    { productId: "p1", price: 3600000, qty: 1, name: "Nikon S3600" },
    { productId: "p2", price: 1500000, qty: 1, name: "Canon A4000" },
  ];

  it("subtotal + fee zona utama", () => {
    const t = calculateTotals(items, "DKI Jakarta", cfg);
    expect(t).toMatchObject({ ok: true, subtotal: 5100000, shippingFee: 25000, total: 5125000 });
  });

  it("provinsi tak terpetakan = fee luar", () => {
    const t = calculateTotals(items, "Aceh", cfg);
    expect(t.shippingFee).toBe(45000);
    expect(t.total).toBe(5145000);
  });

  it("provinsi diblokir ditolak", () => {
    const t = calculateTotals(items, "Papua", cfg);
    expect(t.ok).toBe(false);
    expect(t.error).toMatch(/provinsi/i);
  });

  it("keranjang kosong ditolak", () => {
    expect(calculateTotals([], "Banten", cfg).ok).toBe(false);
  });
});

describe("buildSnapshot", () => {
  it("snapshot hanya bawa field terisi", () => {
    const s = buildSnapshot({ code: "qris", name: "QRIS Toko", accountNumber: null, accountHolder: null, qrImageUrl: null });
    expect(s).toEqual({ code: "qris", name: "QRIS Toko" });
  });
});