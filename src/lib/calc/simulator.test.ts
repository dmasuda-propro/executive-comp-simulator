import { describe, it, expect } from "vitest";
import { simulate } from "./simulator";
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
    preSalaryProfit: 12_000_000,
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

describe("simulate", () => {
  const r = simulate(input);
  it("会社員の現金手取りは正で給与収入より小さい", () => {
    expect(r.employee.cashNet).toBeGreaterThan(0);
    expect(r.employee.cashNet).toBeLessThan(r.employee.salaryIncome);
  });
  it("法人は法人残キャッシュと合計を返す", () => {
    expect(r.corporate.corporate).toBeDefined();
    expect(r.corporate.totalOwnerCash).toBe(
      r.corporate.effectiveNet + r.corporate.corporate!.remainingCash,
    );
  });
  it("差額(法人合計-会社員)が計算される", () => {
    expect(r.difference.totalOwnerCash).toBe(
      r.corporate.totalOwnerCash - r.employee.totalOwnerCash,
    );
  });
});
