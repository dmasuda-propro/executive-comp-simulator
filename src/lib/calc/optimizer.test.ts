import { describe, it, expect } from "vitest";
import { optimize } from "./optimizer";
import type { SimulationInput, OptimizationInput } from "@/types/input";

const base: SimulationInput = {
  basic: {
    prefecture: "東京",
    age: 40,
    hasCareInsurance: true,
    dependents: 0,
    spouseDeduction: false,
    simulationYear: 2026,
  },
  employee: {
    annualSalary: 0,
    monthlySalary: 0,
    annualBonus: 0,
    bonusCount: 0,
    rentSubsidyAnnual: 0,
    employeeIdecoMonthly: 0,
    companyDcMonthly: 0,
  },
  corporate: {
    preSalaryProfit: 15_000_000,
    monthlyDirectorSalary: 0,
    fixedBonusAnnual: 0,
    fixedBonusCount: 0,
    fixedBonusMonths: [],
    corporateTaxRate: 0.3,
  },
  taxSaving: {
    companyHousingEnabled: false,
    monthlyRent: 0,
    companyRentShareRate: 0,
    personalRentShareRate: 0,
    idecoPlusEnabled: false,
    idecoPlusCompanyMonthly: 0,
    idecoPlusPersonalMonthly: 0,
    smallBusinessMutualMonthly: 0,
    businessSafetyMutualAnnual: 0,
    travelAllowanceEnabled: false,
    travelDaysPerMonth: 0,
    travelAllowancePerDay: 0,
    lifeInsuranceAnnual: 0,
  },
};
const opt: OptimizationInput = {
  preSalaryProfit: 15_000_000,
  monthlySalaryMin: 200_000,
  monthlySalaryMax: 800_000,
  monthlySalaryStep: 100_000,
  bonusMin: 0,
  bonusMax: 0,
  bonusStep: 100_000,
};

describe("optimize", () => {
  it("上位20件以内・スコア降順", () => {
    const r = optimize(base, opt);
    expect(r.length).toBeGreaterThan(0);
    expect(r.length).toBeLessThanOrEqual(20);
    for (let i = 1; i < r.length; i++)
      expect(r[i - 1].score).toBeGreaterThanOrEqual(r[i].score);
  });
  it("組合せ過大なら例外", () => {
    expect(() =>
      optimize(base, {
        ...opt,
        monthlySalaryStep: 1,
        bonusStep: 1,
        bonusMax: 10_000_000,
      }),
    ).toThrow();
  });
});
