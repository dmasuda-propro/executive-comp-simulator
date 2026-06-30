import { describe, it, expect } from "vitest";
import { calcResidentTax } from "./residentTax";

describe("calcResidentTax", () => {
  it("所得割10%+均等割。課税標準は給与所得-控除", () => {
    const r = calcResidentTax({
      employmentIncome: 4_360_000,
      socialInsurance: 900_000,
      idecoPersonalAnnual: 0,
      smallBusinessMutualAnnual: 0,
      spouseDeduction: false,
      dependents: { general: 0, specific: 0, elderly: 0, coresidentElderly: 0 },
      year: 2026,
    });
    // taxable = 4,360,000 - 430,000(基礎) - 900,000 = 3,030,000
    expect(r.taxable).toBe(3_030_000);
    expect(r.incomeLevy).toBe(303_000);
    expect(r.perCapita).toBe(5_000);
    expect(r.total).toBe(308_000);
  });
  it("課税標準は0未満にならない", () => {
    const r = calcResidentTax({
      employmentIncome: 300_000,
      socialInsurance: 0,
      idecoPersonalAnnual: 0,
      smallBusinessMutualAnnual: 0,
      spouseDeduction: false,
      dependents: { general: 0, specific: 0, elderly: 0, coresidentElderly: 0 },
      year: 2026,
    });
    expect(r.incomeLevy).toBe(0);
    expect(r.total).toBe(5_000);
  });
});
