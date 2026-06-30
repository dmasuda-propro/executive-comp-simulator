import { describe, it, expect } from "vitest";
import {
  solveDirectorSalaryForTakeHome,
  maxTaxSavingConfig,
  simulateCorporateFullTaxSaving,
} from "./reverseSolver";
import { simulateEmployeeCase } from "./simulator";
import type { CaseResult } from "@/types/result";
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
  microScheme: {
    contractRevenueAnnual: 8_060_000,
    contractExpensesAnnual: 0,
    microMonthlySalary: 55_000,
  },
};

describe("maxTaxSavingConfig", () => {
  it("iDeCo+合計を上限(62,000)・小規模70,000を上限投入し、社宅等は踏襲", () => {
    const c = maxTaxSavingConfig(
      { ...input.taxSaving, companyHousingEnabled: true, monthlyRent: 150_000 },
      62_000,
    );
    expect(c.idecoPlusEnabled).toBe(true);
    expect(c.idecoPlusCompanyMonthly + c.idecoPlusPersonalMonthly).toBe(62_000);
    expect(c.idecoPlusPersonalMonthly).toBe(1_000); // 加入者は最低1,000円
    expect(c.smallBusinessMutualMonthly).toBe(70_000);
    expect(c.companyHousingEnabled).toBe(true); // タブ値を踏襲
    expect(c.monthlyRent).toBe(150_000);
  });
});

describe("solveDirectorSalaryForTakeHome (既定: 将来資産込み総資産で一致)", () => {
  const r = solveDirectorSalaryForTakeHome(input);
  it("目標は会社員の将来資産込み総資産", () => {
    expect(r.metric).toBe("futureAssetNet");
    expect(r.targetValue).toBe(simulateEmployeeCase(input).futureAssetNet);
  });
  it("現職の額面年収を返す", () => {
    expect(r.employeeGrossSalary).toBe(simulateEmployeeCase(input).salaryIncome);
  });
  it("達成値は目標以上で、ごく僅差", () => {
    expect(r.achievedValue).toBeGreaterThanOrEqual(r.targetValue);
    expect(r.achievedValue - r.targetValue).toBeLessThan(30_000);
  });
  it("役員報酬は正で1,000円単位", () => {
    expect(r.monthlyDirectorSalary).toBeGreaterThan(0);
    expect(r.monthlyDirectorSalary % 1000).toBe(0);
    expect(r.annualDirectorSalary).toBe(r.monthlyDirectorSalary * 12);
  });
  it("将来資産込み基準では節税フル活用が役員報酬を額面より抑える", () => {
    // 節税の税減効果と非現金便益で、現職額面より低い役員報酬で同等の総資産に届く
    expect(r.annualDirectorSalary).toBeLessThan(r.employeeGrossSalary);
  });
  it("会社の年間負担を返す", () => {
    expect(r.companyAnnualCost).toBeGreaterThan(r.annualDirectorSalary);
  });
});

describe("手取り明細のブリッジが厳密に一致する", () => {
  const check = (c: CaseResult) => {
    // 額面 −(社保+所得税+住民税+小規模掛金+iDeCo個人掛金) = 現金手取り
    expect(
      c.salaryIncome -
        c.social.annualEmployee -
        c.incomeTax.total -
        c.residentTax.total -
        c.taxSaving.smallBusinessMutualAnnual -
        c.ideco.personalAnnual,
    ).toBe(c.cashNet);
    // 現金手取り +(社宅+出張旅費+iDeCo+会社掛金) = 実質手取り
    expect(
      c.cashNet +
        c.taxSaving.housingBenefit +
        c.taxSaving.travelAllowanceAnnual +
        c.ideco.companyAnnual,
    ).toBe(c.effectiveNet);
    // 実質手取り +(小規模+iDeCo個人の積立) = 将来資産込み
    expect(
      c.effectiveNet + c.taxSaving.smallBusinessMutualAnnual + c.ideco.personalAnnual,
    ).toBe(c.futureAssetNet);
    // 明細表示: 現金手取り +(社宅+旅費+小規模+iDeCo会社+iDeCo個人) = 将来資産込み総資産
    expect(
      c.cashNet +
        c.taxSaving.housingBenefit +
        c.taxSaving.travelAllowanceAnnual +
        c.taxSaving.smallBusinessMutualAnnual +
        c.ideco.companyAnnual +
        c.ideco.personalAnnual,
    ).toBe(c.futureAssetNet);
  };
  it("法人役員(節税フル活用)で各段がつながる", () => {
    check(simulateCorporateFullTaxSaving(input));
  });
  it("会社員でも各段がつながる(iDeCo個人掛金を含む)", () => {
    const withIdeco = {
      ...input,
      employee: { ...input.employee, employeeIdecoMonthly: 20_000 },
    };
    const emp = simulateEmployeeCase(withIdeco);
    expect(emp.ideco.personalAnnual).toBe(240_000);
    check(emp);
  });
});
