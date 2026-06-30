import { describe, it, expect } from "vitest";
import { calcIdecoPlus, validateIdecoPlus } from "./idecoPlus";

describe("validateIdecoPlus", () => {
  it("合計23,000超で例外", () =>
    expect(() => validateIdecoPlus(20_000, 5_000)).toThrow());
  it("0〜5,000未満で例外", () =>
    expect(() => validateIdecoPlus(0, 3_000)).toThrow());
  it("1,000円単位でない場合例外", () =>
    expect(() => validateIdecoPlus(5_500, 0)).toThrow());
  it("0+0は許容", () => expect(() => validateIdecoPlus(0, 0)).not.toThrow());
});

describe("calcIdecoPlus", () => {
  it("会社分は法人税率, 個人分は限界税率+住民税10%, 社保削減は0", () => {
    const r = calcIdecoPlus({
      companyMonthly: 10_000,
      personalMonthly: 10_000,
      corporateTaxRate: 0.3,
      marginalIncomeTaxRate: 0.2,
    });
    expect(r.companyAnnual).toBe(120_000);
    expect(r.personalAnnual).toBe(120_000);
    expect(r.corporateTaxSaving).toBe(36_000);
    expect(r.personalIncomeTaxSaving).toBe(24_000);
    expect(r.personalResidentTaxSaving).toBe(12_000);
    expect(r.socialInsuranceSaving).toBe(0);
  });
});
