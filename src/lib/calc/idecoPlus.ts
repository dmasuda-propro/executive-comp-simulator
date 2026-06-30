import { D } from "@/lib/utils/money";
import type { IdecoPlusResult } from "@/types/result";

export function validateIdecoPlus(
  companyMonthly: number,
  personalMonthly: number,
): void {
  const total = companyMonthly + personalMonthly;
  if (total === 0) return;
  if (total > 23_000)
    throw new Error("iDeCo+の合計掛金は月額23,000円以下にしてください");
  if (total < 5_000)
    throw new Error("iDeCo+の合計掛金は月額5,000円以上にしてください");
  if (companyMonthly % 1000 !== 0 || personalMonthly % 1000 !== 0)
    throw new Error("iDeCo+の掛金は1,000円単位にしてください");
}

export function calcIdecoPlus(params: {
  companyMonthly: number;
  personalMonthly: number;
  corporateTaxRate: number;
  marginalIncomeTaxRate: number;
}): IdecoPlusResult {
  const companyAnnual = params.companyMonthly * 12;
  const personalAnnual = params.personalMonthly * 12;
  return {
    companyAnnual,
    personalAnnual,
    corporateTaxSaving: Math.floor(
      D(companyAnnual).times(params.corporateTaxRate).toNumber(),
    ),
    personalIncomeTaxSaving: Math.floor(
      D(personalAnnual).times(params.marginalIncomeTaxRate).toNumber(),
    ),
    personalResidentTaxSaving: Math.floor(
      D(personalAnnual).times(0.1).toNumber(),
    ),
    socialInsuranceSaving: 0,
  };
}
