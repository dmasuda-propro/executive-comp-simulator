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
    dependentDeductionTotal(params.dependents, params.year, "income");
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
