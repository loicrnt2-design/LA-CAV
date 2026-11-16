import { describe, expect, it } from "vitest";
import { breakdown, parseEuroToCents, serviceFee } from "./pricing";

describe("pricing", () => {
  it("calcule les frais avec minimum et plafond", () => {
    expect(serviceFee(1000)).toBe(120);
    expect(serviceFee(10)).toBe(100);
    expect(serviceFee(10_000_000)).toBe(3000);
  });
  it("laisse le total indéfini sans port", () => {
    expect(breakdown(5000, null).totalCents).toBeNull();
    expect(breakdown(5000, 500).totalCents).toBe(5000 + 320 + 500);
  });
  it("analyse les montants saisis", () => {
    expect(parseEuroToCents("12,5")).toBe(1250);
    expect(parseEuroToCents("0")).toBeNull();
    expect(parseEuroToCents("abc")).toBeNull();
  });
  it("rejette les montants non entiers", () => {
    expect(() => serviceFee(10.5)).toThrow();
  });
});
