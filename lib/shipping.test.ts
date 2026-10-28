import { describe, it, expect } from "vitest";
import { shippingFee, isBlocked, type ShippingZoneConfig } from "./shipping";

const cfg: ShippingZoneConfig = {
  feeUtama: 12000,
  feeLuar: 25000,
  provinsiUtama: ["DKI Jakarta", "Banten", "Jawa Barat"],
  provinsiDiblokir: ["Papua"],
};

describe("shippingFee", () => {
  it("provinsi zona utama kena tarif utama", () => {
    expect(shippingFee("DKI Jakarta", cfg)).toBe(12000);
  });
  it("provinsi di luar daftar = tarif luar", () => {
    expect(shippingFee("Sumatera Utara", cfg)).toBe(25000);
    expect(shippingFee("  dki jakarta ", cfg)).toBe(12000); // case+whitespace
  });
  it("banding case-insensitive", () => {
    expect(shippingFee("jawa barat", cfg)).toBe(12000);
  });
});

describe("isBlocked", () => {
  it("provinsi diblokir = true", () => {
    expect(isBlocked("Papua", cfg)).toBe(true);
    expect(isBlocked("papua", cfg)).toBe(true);
  });
  it("provinsi lain = false", () => {
    expect(isBlocked("Bali", cfg)).toBe(false);
  });
});
