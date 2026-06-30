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
    disabilityGeneral: 0,
    disabilitySpecial: 0,
    medicalExpenseAnnual: 0,
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

describe("賞与社保のエッジケース(H-1)", () => {
  it("賞与額>0・回数0でも賞与社保が課され、回数1と一致する", () => {
    const c0 = simulate({
      ...input,
      employee: { ...input.employee, bonusCount: 0 },
    });
    const c1 = simulate({
      ...input,
      employee: { ...input.employee, bonusCount: 1 },
    });
    expect(c0.employee.social.bonusEmployee).toBeGreaterThan(0);
    expect(c0.employee.social.annualEmployee).toBe(
      c1.employee.social.annualEmployee,
    );
  });
});

describe("将来資産の対称性(H-2)", () => {
  const base = simulate(input);
  const withMutual = simulate({
    ...input,
    taxSaving: { ...input.taxSaving, smallBusinessMutualMonthly: 30_000 },
  });
  it("小規模共済は現金が出るので実質手取りを減らす", () => {
    expect(withMutual.corporate.effectiveNet).toBeLessThan(
      base.corporate.effectiveNet,
    );
  });
  it("将来資産込みでは積立(年36万)が戻り実質手取りより大きい", () => {
    expect(withMutual.corporate.futureAssetNet).toBe(
      withMutual.corporate.effectiveNet + 360_000,
    );
  });
});

describe("家賃補助は課税給与扱い(M-2)", () => {
  it("家賃補助を増やすと給与収入・所得税が増える", () => {
    const noSub = simulate(input);
    const withSub = simulate({
      ...input,
      employee: { ...input.employee, rentSubsidyAnnual: 600_000 },
    });
    expect(withSub.employee.salaryIncome).toBe(
      noSub.employee.salaryIncome + 600_000,
    );
    expect(withSub.employee.incomeTax.total).toBeGreaterThan(
      noSub.employee.incomeTax.total,
    );
  });
});
