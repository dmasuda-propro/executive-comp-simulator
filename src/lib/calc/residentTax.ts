import { getRateMaster } from "@/lib/constants/rateMaster";
import { D } from "@/lib/utils/money";
import type { ResidentTaxResult } from "@/types/result";

export function calcResidentTax(params: {
  employmentIncome: number;
  socialInsurance: number;
  idecoPersonalAnnual: number;
  smallBusinessMutualAnnual: number;
  spouseDeduction: boolean;
  dependents: number;
  year: number;
}): ResidentTaxResult {
  const m = getRateMaster(params.year);
  const rt = m.residentTax;
  // 住民税の配偶者・扶養控除は 33 万(所得税 38 万より低い)として概算
  const deductions =
    rt.basicDeduction +
    params.socialInsurance +
    params.idecoPersonalAnnual +
    params.smallBusinessMutualAnnual +
    (params.spouseDeduction ? 330_000 : 0) +
    params.dependents * 330_000;
  const taxable = Math.max(
    0,
    Math.floor((params.employmentIncome - deductions) / 1000) * 1000,
  );
  const incomeLevy = Math.floor(D(taxable).times(rt.rate).toNumber());
  // 均等割は所得が一定以下なら非課税となる自治体差があるが MVP では一律課税の概算
  const perCapita = rt.perCapita;
  return { taxable, incomeLevy, perCapita, total: incomeLevy + perCapita };
}
