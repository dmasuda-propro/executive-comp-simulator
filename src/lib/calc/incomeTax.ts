import { getRateMaster } from "@/lib/constants/rateMaster";
import { D } from "@/lib/utils/money";
import type { Dependents } from "@/types/input";
import type { IncomeTaxResult } from "@/types/result";

// 扶養控除合計(所得税 or 住民税)
export function dependentDeductionTotal(
  dependents: Dependents,
  year: number,
  kind: "income" | "resident",
): number {
  const d = getRateMaster(year).deductions.dependent;
  return (
    dependents.general * d.general[kind] +
    dependents.specific * d.specific[kind] +
    dependents.elderly * d.elderly[kind] +
    dependents.coresidentElderly * d.coresidentElderly[kind]
  );
}

// 障害者控除合計(一般・特別)
export function disabilityDeductionTotal(
  general: number,
  special: number,
  year: number,
  kind: "income" | "resident",
): number {
  const d = getRateMaster(year).deductions.disability;
  return general * d.general[kind] + special * d.special[kind];
}

// 医療費控除 = max(0, 医療費 − min(10万, 総所得×5%))、上限あり。所得税・住民税で同額。
export function medicalDeduction(
  medicalExpenseAnnual: number,
  totalIncome: number,
  year: number,
): number {
  const m = getRateMaster(year).deductions.medical;
  if (medicalExpenseAnnual <= 0) return 0;
  const threshold = Math.min(m.threshold, Math.floor(totalIncome * m.incomeRate));
  return Math.min(m.cap, Math.max(0, medicalExpenseAnnual - threshold));
}

export function progressiveIncomeTax(
  taxable: number,
  year: number,
): { base: number; marginalRate: number } {
  const m = getRateMaster(year);
  if (taxable <= 0)
    return { base: 0, marginalRate: m.incomeTax.brackets[0].rate };
  const band = m.incomeTax.brackets.find(
    (b) => b.upTo === null || taxable <= b.upTo,
  )!;
  const base = Math.floor(
    D(taxable).times(band.rate).minus(band.deduction).toNumber(),
  );
  return { base: Math.max(0, base), marginalRate: band.rate };
}

export function calcIncomeTax(params: {
  employmentIncome: number;
  socialInsurance: number;
  idecoPersonalAnnual: number;
  smallBusinessMutualAnnual: number;
  spouseDeduction: boolean;
  dependents: Dependents;
  disabilityGeneral: number;
  disabilitySpecial: number;
  medicalExpenseAnnual: number;
  year: number;
}): IncomeTaxResult {
  const m = getRateMaster(params.year);
  const d = m.deductions;
  const basic = d.basicDeduction(params.employmentIncome);
  const deductions =
    basic +
    params.socialInsurance +
    params.idecoPersonalAnnual +
    params.smallBusinessMutualAnnual +
    (params.spouseDeduction ? d.spouse(params.employmentIncome).income : 0) +
    dependentDeductionTotal(params.dependents, params.year, "income") +
    disabilityDeductionTotal(params.disabilityGeneral, params.disabilitySpecial, params.year, "income") +
    medicalDeduction(params.medicalExpenseAnnual, params.employmentIncome, params.year);
  const taxable = Math.max(
    0,
    Math.floor((params.employmentIncome - deductions) / 1000) * 1000,
  );
  const { base, marginalRate } = progressiveIncomeTax(taxable, params.year);
  const total = Math.floor(
    D(base).times(1 + m.incomeTax.reconstructionRate).toNumber(),
  );
  return { taxable, base, reconstruction: total - base, total, marginalRate };
}
