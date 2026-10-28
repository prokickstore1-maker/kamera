import { describe, it, expect } from "vitest";
import { clampQty } from "./validation";

/**
 * Logika cart murni (tanpa React) — dicerminkan dari lib/cart.ts.
 * Kalau clampQty berubah, test ini menangkap regresi perilaku cart.
 */
describe("cart quantity rules", () => {
  it("item stok 1 tidak bisa ditambah jadi 2", () => {
    expect(clampQty(1 + 1, 1)).toBe(1);
  });
  it("produk sold out tidak masuk cart", () => {
    expect(clampQty(1, 0)).toBe(0);
  });
  it("stok 10 bisa qty sampai 10, tidak lebih", () => {
    expect(clampQty(10, 10)).toBe(10);
    expect(clampQty(11, 10)).toBe(10);
  });
});
