import { describe, it, expect } from "vitest";
import {
  progressiveIncomeTax,
  calcIncomeTax,
  dependentDeductionTotal,
} from "./incomeTax";

describe("dependentDeductionTotal", () => {
  it("区分別に所得税・住民税の控除を合算", () => {
    const dep = { general: 1, specific: 1, elderly: 1, coresidentElderly: 1 };
    // 所得税: 38+63+48+58 = 207万
    expect(dependentDeductionTotal(dep, 2026, "income")).toBe(2_070_000);
    // 住民税: 33+45+38+45 = 161万
    expect(dependentDeductionTotal(dep, 2026, "resident")).toBe(1_610_000);
  });
});

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
      dependents: { general: 0, specific: 0, elderly: 0, coresidentElderly: 0 },
      year: 2026,
    });
    expect(r.taxable).toBeGreaterThan(0);
    expect(r.total).toBe(Math.floor(r.base * 1.021));
    expect(r.reconstruction).toBe(r.total - r.base);
  });
});
