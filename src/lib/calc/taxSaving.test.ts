import { describe, it, expect } from "vitest";
import { calcTaxSaving } from "./taxSaving";
import type { TaxSavingInput } from "@/types/input";

const base: TaxSavingInput = {
  companyHousingEnabled: true,
  monthlyRent: 200_000,
  companyRentShareRate: 0.5,
  personalRentShareRate: 0.5,
  idecoPlusEnabled: false,
  idecoPlusCompanyMonthly: 0,
  idecoPlusPersonalMonthly: 0,
  smallBusinessMutualMonthly: 30_000,
  businessSafetyMutualAnnual: 600_000,
  travelAllowanceEnabled: true,
  travelDaysPerMonth: 5,
  travelAllowancePerDay: 5_000,
  lifeInsuranceAnnual: 0,
};

describe("calcTaxSaving", () => {
  it("社宅会社負担=200000*0.5*12=1,200,000, 旅費=5*5000*12=300,000", () => {
    const r = calcTaxSaving(base);
    expect(r.companyPaidRentAnnual).toBe(1_200_000);
    expect(r.housingBenefit).toBe(1_200_000);
    expect(r.travelAllowanceAnnual).toBe(300_000);
    expect(r.smallBusinessMutualAnnual).toBe(360_000);
    expect(r.businessSafetyMutualAnnual).toBe(600_000);
    // 法人損金 = 社宅会社負担 + 旅費 + セーフティ共済 = 2,100,000
    expect(r.companyDeductibleExpenses).toBe(2_100_000);
  });
  it("無効化されたら0", () => {
    const r = calcTaxSaving({
      ...base,
      companyHousingEnabled: false,
      travelAllowanceEnabled: false,
    });
    expect(r.companyPaidRentAnnual).toBe(0);
    expect(r.travelAllowanceAnnual).toBe(0);
  });
});
