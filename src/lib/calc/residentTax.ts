import { getRateMaster } from "@/lib/constants/rateMaster";
import { D } from "@/lib/utils/money";
import type { Dependents } from "@/types/input";
import type { ResidentTaxResult } from "@/types/result";
import { dependentDeductionTotal } from "./incomeTax";

export function calcResidentTax(params: {
  employmentIncome: number;
  socialInsurance: number;
  idecoPersonalAnnual: number;
  smallBusinessMutualAnnual: number;
  spouseDeduction: boolean;
  dependents: Dependents;
  year: number;
}): ResidentTaxResult {
  const m = getRateMaster(params.year);
  const rt = m.residentTax;
  const d = m.deductions;
  const deductions =
    rt.basicDeduction +
    params.socialInsurance +
    params.idecoPersonalAnnual +
    params.smallBusinessMutualAnnual +
    (params.spouseDeduction ? d.spouse.resident : 0) +
    dependentDeductionTotal(params.dependents, params.year, "resident");
  const taxable = Math.max(
    0,
    Math.floor((params.employmentIncome - deductions) / 1000) * 1000,
  );
  const incomeLevy = Math.floor(D(taxable).times(rt.rate).toNumber());
  // 均等割は所得が一定以下なら非課税となる自治体差があるが MVP では一律課税の概算
  const perCapita = rt.perCapita;
  return { taxable, incomeLevy, perCapita, total: incomeLevy + perCapita };
}
