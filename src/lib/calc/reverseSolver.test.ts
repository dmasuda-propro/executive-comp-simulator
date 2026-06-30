import { describe, it, expect } from "vitest";
import { solveDirectorSalaryForTakeHome, maxTaxSavingConfig } from "./reverseSolver";
import { simulateEmployeeCase } from "./simulator";
import type { SimulationInput } from "@/types/input";

const input: SimulationInput = {
  basic: {
    prefecture: "東京",
    age: 40,
    hasCareInsurance: true,
    dependents: { general: 0, specific: 0, elderly: 0, coresidentElderly: 0 },
    spouseDeduction: false,
    simulationYear: 2026,
  },
  employee: {
    annualSalary: 6_000_000,
    monthlySalary: 400_000,
    annualBonus: 1_200_000,
    bonusCount: 2,
    rentSubsidyAnnual: 0,
    employeeIdecoMonthly: 0,
    companyDcMonthly: 0,
  },
  corporate: {
    preSalaryProfit: 30_000_000,
    monthlyDirectorSalary: 500_000,
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

describe("maxTaxSavingConfig", () => {
  it("iDeCo+合計23,000・小規模70,000を上限投入し、社宅等は踏襲", () => {
    const c = maxTaxSavingConfig({ ...input.taxSaving, companyHousingEnabled: true, monthlyRent: 150_000 });
    expect(c.idecoPlusEnabled).toBe(true);
    expect(c.idecoPlusCompanyMonthly + c.idecoPlusPersonalMonthly).toBe(23_000);
    expect(c.smallBusinessMutualMonthly).toBe(70_000);
    expect(c.companyHousingEnabled).toBe(true); // タブ値を踏襲
    expect(c.monthlyRent).toBe(150_000);
  });
});

describe("solveDirectorSalaryForTakeHome", () => {
  const r = solveDirectorSalaryForTakeHome(input);
  it("目標は会社員の実質手取り", () => {
    expect(r.targetEffectiveNet).toBe(simulateEmployeeCase(input).effectiveNet);
  });
  it("達成手取りは目標以上で、ごく僅差", () => {
    expect(r.achievedEffectiveNet).toBeGreaterThanOrEqual(r.targetEffectiveNet);
    expect(r.achievedEffectiveNet - r.targetEffectiveNet).toBeLessThan(30_000);
  });
  it("役員報酬は正で1,000円単位", () => {
    expect(r.monthlyDirectorSalary).toBeGreaterThan(0);
    expect(r.monthlyDirectorSalary % 1000).toBe(0);
    expect(r.annualDirectorSalary).toBe(r.monthlyDirectorSalary * 12);
  });
  it("同じ実質手取りでも将来資産(小規模+iDeCo)が大きく積み上がる", () => {
    // 実質手取りは目標に一致する一方、futureAssetNetは小規模840k+iDeCo個人12kぶん大きい
    expect(r.result.futureAssetNet).toBeGreaterThan(r.targetEffectiveNet + 800_000);
  });
});
