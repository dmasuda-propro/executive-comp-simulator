import { describe, it, expect } from "vitest";
import { calcCorporateTax } from "./corporateTax";

describe("calcCorporateTax", () => {
  it("利益=前利益-各損金, 税=max(0,利益)*率, 残=利益-税", () => {
    const r = calcCorporateTax({
      preSalaryProfit: 20_000_000,
      directorSalaryAnnual: 6_000_000,
      fixedBonusAnnual: 0,
      companySocialInsurance: 1_000_000,
      idecoPlusCompanyAnnual: 120_000,
      companyDeductibleExpenses: 2_000_000,
      corporateTaxRate: 0.3,
    });
    // 利益 = 20,000,000 - 6,000,000 - 0 - 1,000,000 - 120,000 - 2,000,000 = 10,880,000
    expect(r.profitBeforeTax).toBe(10_880_000);
    expect(r.corporateTax).toBe(3_264_000);
    expect(r.remainingCash).toBe(7_616_000);
  });
  it("赤字なら税率分は0(残は赤字額)", () => {
    const r = calcCorporateTax({
      preSalaryProfit: 1_000_000,
      directorSalaryAnnual: 3_000_000,
      fixedBonusAnnual: 0,
      companySocialInsurance: 0,
      idecoPlusCompanyAnnual: 0,
      companyDeductibleExpenses: 0,
      corporateTaxRate: 0.3,
    });
    expect(r.corporateTax).toBe(0);
    expect(r.remainingCash).toBe(-2_000_000);
  });
  it("均等割は赤字でも課され、法人税等に加算される", () => {
    const profit = calcCorporateTax({
      preSalaryProfit: 20_000_000,
      directorSalaryAnnual: 6_000_000,
      fixedBonusAnnual: 0,
      companySocialInsurance: 1_000_000,
      idecoPlusCompanyAnnual: 120_000,
      companyDeductibleExpenses: 2_000_000,
      corporateTaxRate: 0.3,
      perCapitaTax: 70_000,
    });
    // 税率分3,264,000 + 均等割70,000
    expect(profit.corporateTax).toBe(3_334_000);
    expect(profit.remainingCash).toBe(10_880_000 - 3_334_000);
    const loss = calcCorporateTax({
      preSalaryProfit: 1_000_000,
      directorSalaryAnnual: 3_000_000,
      fixedBonusAnnual: 0,
      companySocialInsurance: 0,
      idecoPlusCompanyAnnual: 0,
      companyDeductibleExpenses: 0,
      corporateTaxRate: 0.3,
      perCapitaTax: 70_000,
    });
    expect(loss.corporateTax).toBe(70_000); // 赤字でも均等割
    expect(loss.remainingCash).toBe(-2_070_000);
  });
});
