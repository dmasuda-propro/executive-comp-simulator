import type { SimulationInput } from "@/types/input";
import type {
  CaseResult,
  DifferenceResult,
  SimulationResult,
  SocialInsuranceResult,
} from "@/types/result";
import { calcMonthlySocialInsurance } from "./socialInsurance";
import { calcAnnualBonusSocialInsurance } from "./bonusSocialInsurance";
import { calcEmploymentIncome } from "./salaryIncome";
import { calcIncomeTax, progressiveIncomeTax } from "./incomeTax";
import { calcResidentTax } from "./residentTax";
import { calcIdecoPlus, validateIdecoPlus } from "./idecoPlus";
import { calcTaxSaving } from "./taxSaving";
import { calcCorporateTax } from "./corporateTax";

export function bonusListFor(annualBonus: number, count: number): number[] {
  if (count <= 0 || annualBonus <= 0) return [];
  const each = Math.floor(annualBonus / count);
  return Array.from({ length: count }, () => each);
}

function buildSocial(params: {
  monthlySalary: number;
  annualBonus: number;
  bonusCount: number;
  age: number;
  year: number;
}): SocialInsuranceResult {
  const { monthlySalary, annualBonus, bonusCount, age, year } = params;
  const threshold = 4; // 年4回以上は報酬扱い
  const treatedAsMonthly = bonusCount >= threshold;
  const effectiveMonthly = treatedAsMonthly
    ? monthlySalary + annualBonus / 12
    : monthlySalary;
  const monthly = calcMonthlySocialInsurance({
    monthlySalary: effectiveMonthly,
    age,
    year,
  });
  const bonus = treatedAsMonthly
    ? { employee: 0, company: 0 }
    : calcAnnualBonusSocialInsurance({
        bonuses: bonusListFor(annualBonus, bonusCount),
        age,
        year,
      });
  const annualEmployee = monthly.monthlyEmployee * 12 + bonus.employee;
  return {
    standardMonthly: monthly.standardMonthly,
    monthlyEmployee: monthly.monthlyEmployee,
    monthlyCompany: monthly.monthlyCompany,
    bonusEmployee: bonus.employee,
    bonusCompany: bonus.company,
    annualEmployee,
    annualCompany: annualEmployee,
    breakdown: monthly.breakdown,
    treatedAsMonthly,
  };
}

const emptyIdeco = {
  companyAnnual: 0,
  personalAnnual: 0,
  corporateTaxSaving: 0,
  personalIncomeTaxSaving: 0,
  personalResidentTaxSaving: 0,
  socialInsuranceSaving: 0,
};
const emptyTaxSaving = {
  companyPaidRentAnnual: 0,
  housingBenefit: 0,
  travelAllowanceAnnual: 0,
  smallBusinessMutualAnnual: 0,
  businessSafetyMutualAnnual: 0,
  companyDeductibleExpenses: 0,
};

export function simulateEmployeeCase(input: SimulationInput): CaseResult {
  const { basic, employee } = input;
  const salaryIncome = employee.monthlySalary * 12 + employee.annualBonus;
  const social = buildSocial({
    monthlySalary: employee.monthlySalary,
    annualBonus: employee.annualBonus,
    bonusCount: employee.bonusCount,
    age: basic.age,
    year: basic.simulationYear,
  });
  const { employmentIncome } = calcEmploymentIncome(
    salaryIncome,
    basic.simulationYear,
  );
  const idecoPersonalAnnual = employee.employeeIdecoMonthly * 12;
  const incomeTax = calcIncomeTax({
    employmentIncome,
    socialInsurance: social.annualEmployee,
    idecoPersonalAnnual,
    smallBusinessMutualAnnual: 0,
    spouseDeduction: basic.spouseDeduction,
    dependents: basic.dependents,
    year: basic.simulationYear,
  });
  const residentTax = calcResidentTax({
    employmentIncome,
    socialInsurance: social.annualEmployee,
    idecoPersonalAnnual,
    smallBusinessMutualAnnual: 0,
    spouseDeduction: basic.spouseDeduction,
    dependents: basic.dependents,
    year: basic.simulationYear,
  });
  const cashNet =
    salaryIncome -
    social.annualEmployee -
    incomeTax.total -
    residentTax.total -
    idecoPersonalAnnual;
  const effectiveNet = cashNet + employee.rentSubsidyAnnual;
  return {
    label: "会社員",
    salaryIncome,
    employmentIncome,
    social,
    incomeTax,
    residentTax,
    ideco: emptyIdeco,
    taxSaving: emptyTaxSaving,
    cashNet,
    effectiveNet,
    futureAssetNet: effectiveNet + idecoPersonalAnnual,
    totalOwnerCash: effectiveNet,
  };
}

export function simulateCorporateCase(input: SimulationInput): CaseResult {
  const { basic, corporate, taxSaving } = input;
  const directorSalaryAnnual = corporate.monthlyDirectorSalary * 12;
  const fixedBonusAnnual = corporate.fixedBonusAnnual;
  const salaryIncome = directorSalaryAnnual + fixedBonusAnnual;

  const social = buildSocial({
    monthlySalary: corporate.monthlyDirectorSalary,
    annualBonus: fixedBonusAnnual,
    bonusCount: corporate.fixedBonusCount,
    age: basic.age,
    year: basic.simulationYear,
  });
  const { employmentIncome } = calcEmploymentIncome(
    salaryIncome,
    basic.simulationYear,
  );

  if (taxSaving.idecoPlusEnabled)
    validateIdecoPlus(
      taxSaving.idecoPlusCompanyMonthly,
      taxSaving.idecoPlusPersonalMonthly,
    );

  // 限界税率の概算: 控除前の課税所得から
  const provisionalTaxable = Math.max(
    0,
    employmentIncome - social.annualEmployee - 580_000,
  );
  const marginalRate = progressiveIncomeTax(
    provisionalTaxable,
    basic.simulationYear,
  ).marginalRate;
  const ideco = taxSaving.idecoPlusEnabled
    ? calcIdecoPlus({
        companyMonthly: taxSaving.idecoPlusCompanyMonthly,
        personalMonthly: taxSaving.idecoPlusPersonalMonthly,
        corporateTaxRate: corporate.corporateTaxRate,
        marginalIncomeTaxRate: marginalRate,
      })
    : emptyIdeco;
  const ts = calcTaxSaving(taxSaving);

  const incomeTax = calcIncomeTax({
    employmentIncome,
    socialInsurance: social.annualEmployee,
    idecoPersonalAnnual: ideco.personalAnnual,
    smallBusinessMutualAnnual: ts.smallBusinessMutualAnnual,
    spouseDeduction: basic.spouseDeduction,
    dependents: basic.dependents,
    year: basic.simulationYear,
  });
  const residentTax = calcResidentTax({
    employmentIncome,
    socialInsurance: social.annualEmployee,
    idecoPersonalAnnual: ideco.personalAnnual,
    smallBusinessMutualAnnual: ts.smallBusinessMutualAnnual,
    spouseDeduction: basic.spouseDeduction,
    dependents: basic.dependents,
    year: basic.simulationYear,
  });

  const cashNet =
    salaryIncome -
    social.annualEmployee -
    incomeTax.total -
    residentTax.total -
    ideco.personalAnnual -
    ts.smallBusinessMutualAnnual;
  const effectiveNet =
    cashNet +
    ts.housingBenefit +
    ts.travelAllowanceAnnual +
    ideco.companyAnnual +
    ts.smallBusinessMutualAnnual;

  const corp = calcCorporateTax({
    preSalaryProfit: corporate.preSalaryProfit,
    directorSalaryAnnual,
    fixedBonusAnnual,
    companySocialInsurance: social.annualCompany,
    idecoPlusCompanyAnnual: ideco.companyAnnual,
    companyDeductibleExpenses: ts.companyDeductibleExpenses,
    corporateTaxRate: corporate.corporateTaxRate,
  });

  return {
    label: "法人役員",
    salaryIncome,
    employmentIncome,
    social,
    incomeTax,
    residentTax,
    ideco,
    taxSaving: ts,
    cashNet,
    effectiveNet,
    futureAssetNet: effectiveNet + ideco.personalAnnual,
    corporate: {
      profitBeforeTax: corp.profitBeforeTax,
      corporateTax: corp.corporateTax,
      remainingCash: corp.remainingCash,
    },
    totalOwnerCash: effectiveNet + corp.remainingCash,
  };
}

export function simulate(input: SimulationInput): SimulationResult {
  const employee = simulateEmployeeCase(input);
  const corporate = simulateCorporateCase(input);
  const difference: DifferenceResult = {
    salaryIncome: corporate.salaryIncome - employee.salaryIncome,
    socialEmployee: corporate.social.annualEmployee - employee.social.annualEmployee,
    socialCompany: corporate.social.annualCompany - employee.social.annualCompany,
    incomeTax: corporate.incomeTax.total - employee.incomeTax.total,
    residentTax: corporate.residentTax.total - employee.residentTax.total,
    corporateTax: (corporate.corporate?.corporateTax ?? 0) - 0,
    cashNet: corporate.cashNet - employee.cashNet,
    effectiveNet: corporate.effectiveNet - employee.effectiveNet,
    totalOwnerCash: corporate.totalOwnerCash - employee.totalOwnerCash,
  };
  return { employee, corporate, difference };
}
