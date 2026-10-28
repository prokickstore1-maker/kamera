import { describe, it, expect } from "vitest";
import { validWa, validPostal, validAddress, validName, clampQty, ADDRESS_MAX } from "./validation";

describe("validWa", () => {
  it("format Indonesia valid", () => {
    expect(validWa("081234567890")).toBe(true);
    expect(validWa("+6281234567890")).toBe(true);
    expect(validWa("6281234567890")).toBe(true);
    expect(validWa("0812-3456-7890")).toBe(true);
  });
  it("nomor asing/salah format ditolak", () => {
    expect(validWa("12345")).toBe(false);
    expect(validWa("0812")).toBe(false);
    expect(validWa("+1 555 0100")).toBe(false);
    expect(validWa("")).toBe(false);
  });
});

describe("validPostal", () => {
  it("tepat 5 digit", () => {
    expect(validPostal("12345")).toBe(true);
    expect(validPostal("1234")).toBe(false);
    expect(validPostal("123456")).toBe(false);
    expect(validPostal("12a45")).toBe(false);
  });
});

describe("validAddress", () => {
  it("min 10, max ADDRESS_MAX", () => {
    expect(validAddress("Jl. Merdeka 1")).toBe(true);
    expect(validAddress("Jl.")).toBe(false);
    expect(validAddress("x".repeat(ADDRESS_MAX + 1))).toBe(false);
  });
});

describe("validName", () => {
  it("min 2 karakter", () => {
    expect(validName("Budi")).toBe(true);
    expect(validName("A")).toBe(false);
  });
});

describe("clampQty", () => {
  it("stok 0 = 0 (tidak bisa beli)", () => {
    expect(clampQty(1, 0)).toBe(0);
  });
  it("clamp ke stok", () => {
    expect(clampQty(5, 1)).toBe(1);
    expect(clampQty(3, 10)).toBe(3);
  });
  it("input tak valid = 1", () => {
    expect(clampQty(0, 5)).toBe(1);
    expect(clampQty(-2, 5)).toBe(1);
    expect(clampQty(NaN, 5)).toBe(1);
  });
});
