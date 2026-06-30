import { z } from "zod";
import type { SimulationInput } from "@/types/input";

const basic = z.object({
  prefecture: z.string().min(1),
  age: z.number().int().min(0).max(120),
  hasCareInsurance: z.boolean(),
  dependents: z.number().int().min(0).max(20),
  spouseDeduction: z.boolean(),
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
    const total = v.idecoPlusCompanyMonthly + v.idecoPlusPersonalMonthly;
    if (total > 23000)
      ctx.addIssue({ code: "custom", message: "iDeCo+合計は月額23,000円以下" });
    if (total > 0 && total < 5000)
      ctx.addIssue({ code: "custom", message: "iDeCo+合計は月額5,000円以上" });
    if (v.idecoPlusCompanyMonthly % 1000 !== 0 || v.idecoPlusPersonalMonthly % 1000 !== 0)
      ctx.addIssue({ code: "custom", message: "iDeCo+は1,000円単位" });
  });

export const simulationSchema = z.object({
  basic,
  employee,
  corporate,
  taxSaving,
});

export const defaultInput: SimulationInput = {
  basic: {
    prefecture: "東京",
    age: 40,
    hasCareInsurance: true,
    dependents: 0,
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
    monthlyRent: 200_000,
    companyRentShareRate: 0.5,
    personalRentShareRate: 0.5,
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
