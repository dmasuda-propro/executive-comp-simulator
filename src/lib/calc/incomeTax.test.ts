import { describe, it, expect } from "vitest";
import { progressiveIncomeTax, calcIncomeTax } from "./incomeTax";

describe("progressiveIncomeTax", () => {
  it("課税所得300万: 300万*10%-97,500 = 202,500", () => {
    const r = progressiveIncomeTax(3_000_000, 2026);
    expect(r.base).toBe(202_500);
    expect(r.marginalRate).toBe(0.1);
  });
  it("0なら0", () => expect(progressiveIncomeTax(0, 2026).base).toBe(0));
});

describe("calcIncomeTax", () => {
  it("復興税2.1%を加算しtotalを返す", () => {
    const r = calcIncomeTax({
      employmentIncome: 4_360_000,
      socialInsurance: 900_000,
      idecoPersonalAnnual: 0,
      smallBusinessMutualAnnual: 0,
      spouseDeduction: false,
      dependents: 0,
      year: 2026,
    });
    expect(r.taxable).toBeGreaterThan(0);
    expect(r.total).toBe(Math.floor(r.base * 1.021));
    expect(r.reconstruction).toBe(r.total - r.base);
  });
});
