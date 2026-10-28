import { describe, it, expect } from "vitest";
import { conditionLabel } from "./condition";

describe("conditionLabel", () => {
  it("9.5 dan 10 = Like New", () => {
    expect(conditionLabel(9.5)).toBe("Like New");
    expect(conditionLabel("10")).toBe("Like New");
  });
  it("9.0-9.4 = Excellent, bukan Like New", () => {
    expect(conditionLabel(9)).toBe("Excellent");
    expect(conditionLabel("9.2")).toBe("Excellent");
  });
  it("8.0-8.9 = Very Good", () => {
    expect(conditionLabel(8.5)).toBe("Very Good");
    expect(conditionLabel(8)).toBe("Very Good");
  });
  it("6.0-7.9 = Good", () => {
    expect(conditionLabel(7.9)).toBe("Good");
    expect(conditionLabel(6)).toBe("Good");
  });
  it("<6 = Used", () => {
    expect(conditionLabel(5.9)).toBe("Used");
    expect(conditionLabel(2)).toBe("Used");
  });
  it("null/NaN = null (draft)", () => {
    expect(conditionLabel(null)).toBeNull();
    expect(conditionLabel(undefined)).toBeNull();
    expect(conditionLabel("")).toBeNull();
    expect(conditionLabel("bukan-angka")).toBeNull();
  });
  it("tak pernah menghasilkan Brand New", () => {
    expect(conditionLabel(10)).not.toBe("Brand New");
  });
});
