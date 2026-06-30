import { z } from "zod";
import type { SimulationInput } from "@/types/input";

const dependents = z.object({
  general: z.number().int().min(0).max(20),
  specific: z.number().int().min(0).max(20),
  elderly: z.number().int().min(0).max(20),
  coresidentElderly: z.number().int().min(0).max(20),
});

const basic = z.object({
  prefecture: z.string().min(1),
  age: z.number().int().min(0).max(120),
  hasCareInsurance: z.boolean(),
  dependents,
  spouseDeduction: z.boolean(),
  disabilityGeneral: z.number().int().min(0).max(20),
  disabilitySpecial: z.number().int().min(0).max(20),
  medicalExpenseAnnual: z.number().min(0),
  simulationYear: z.number().int(),
});

const employee = z.object({
  annualSalary: z.number().min(0),
  monthlySalary: z.number().min(0),
  annualBonus: z.number().min(0),
  bonusCount: z.number().int().min(0).max(12),
  rentSubsidyAnnual: z.number().min(0),
  employeeIdecoMonthly: z.number().min(0),
  companyDcMonthly: z.number().min(0),
});

const corporate = z.object({
  preSalaryProfit: z.number(),
  monthlyDirectorSalary: z.number().min(0),
  fixedBonusAnnual: z.number().min(0),
  fixedBonusCount: z.number().int().min(0).max(3),
  fixedBonusMonths: z.array(z.number().int().min(1).max(12)),
  corporateTaxRate: z.number().min(0).max(1),
});

const taxSaving = z
  .object({
    companyHousingEnabled: z.boolean(),
    monthlyRent: z.number().min(0),
    companyRentShareRate: z.number().min(0).max(1),
    personalRentShareRate: z.number().min(0).max(1),
    idecoPlusEnabled: z.boolean(),
    idecoPlusCompanyMonthly: z.number().min(0),
    idecoPlusPersonalMonthly: z.number().min(0),
    smallBusinessMutualMonthly: z.number().min(0).max(70000),
    businessSafetyMutualAnnual: z.number().min(0).max(2400000),
    travelAllowanceEnabled: z.boolean(),
    travelDaysPerMonth: z.number().min(0).max(31),
    travelAllowancePerDay: z.number().min(0),
    lifeInsuranceAnnual: z.number().min(0),
  })
  .superRefine((v, ctx) => {
    if (!v.idecoPlusEnabled) return;
    // 令和7改正後の上限62,000円(2026年12月施行)。
    const total = v.idecoPlusCompanyMonthly + v.idecoPlusPersonalMonthly;
    if (total > 62000)
      ctx.addIssue({ code: "custom", message: "iDeCo+合計は月額62,000円以下" });
    if (total > 0 && total < 5000)
      ctx.addIssue({ code: "custom", message: "iDeCo+合計は月額5,000円以上" });
    if (v.idecoPlusCompanyMonthly % 1000 !== 0 || v.idecoPlusPersonalMonthly % 1000 !== 0)
      ctx.addIssue({ code: "custom", message: "iDeCo+は1,000円単位" });
  });

const microScheme = z.object({
  contractRevenueAnnual: z.number().min(0),
  contractExpensesAnnual: z.number().min(0),
  microMonthlySalary: z.number().min(0),
});

export const simulationSchema = z.object({
  basic,
  employee,
  corporate,
  taxSaving,
  microScheme,
});

export const defaultInput: SimulationInput = {
  basic: {
    prefecture: "東京",
    age: 28,
    hasCareInsurance: false,
    dependents: { general: 0, specific: 0, elderly: 0, coresidentElderly: 0 },
    spouseDeduction: false,
    disabilityGeneral: 0,
    disabilitySpecial: 0,
    medicalExpenseAnnual: 0,
    simulationYear: 2026,
  },
  employee: {
    annualSalary: 11_400_000,
    monthlySalary: 700_000,
    annualBonus: 3_000_000,
    bonusCount: 2,
    rentSubsidyAnnual: 0,
    employeeIdecoMonthly: 0,
    companyDcMonthly: 0,
  },
  corporate: {
    preSalaryProfit: 12_000_000,
    monthlyDirectorSalary: 154_999,
    fixedBonusAnnual: 6_200_000,
    fixedBonusCount: 1,
    fixedBonusMonths: [],
    corporateTaxRate: 0.3,
  },
  taxSaving: {
    companyHousingEnabled: true,
    monthlyRent: 65_000,
    companyRentShareRate: 0.5,
    personalRentShareRate: 0.5,
    idecoPlusEnabled: true,
    idecoPlusCompanyMonthly: 61_000,
    idecoPlusPersonalMonthly: 1_000,
    smallBusinessMutualMonthly: 70_000,
    businessSafetyMutualAnnual: 0,
    travelAllowanceEnabled: true,
    travelDaysPerMonth: 1,
    travelAllowancePerDay: 20_000,
    lifeInsuranceAnnual: 0,
  },
  microScheme: {
    contractRevenueAnnual: 8_060_000,
    contractExpensesAnnual: 0,
    microMonthlySalary: 55_000,
  },
};
