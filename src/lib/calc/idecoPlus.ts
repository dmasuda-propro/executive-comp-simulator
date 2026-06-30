import { getRateMaster } from "@/lib/constants/rateMaster";
import { D } from "@/lib/utils/money";
import type { IdecoPlusResult } from "@/types/result";

export function validateIdecoPlus(
  companyMonthly: number,
  personalMonthly: number,
  year: number,
): void {
  const lim = getRateMaster(year).idecoPlus;
  const total = companyMonthly + personalMonthly;
  if (total === 0) return;
  if (total > lim.monthlyMax)
    throw new Error(
      `iDeCo+の合計掛金は月額${lim.monthlyMax.toLocaleString()}円以下にしてください`,
    );
  if (total < lim.monthlyMin)
    throw new Error(
      `iDeCo+の合計掛金は月額${lim.monthlyMin.toLocaleString()}円以上にしてください`,
    );
  if (companyMonthly % lim.unit !== 0 || personalMonthly % lim.unit !== 0)
    throw new Error(`iDeCo+の掛金は${lim.unit.toLocaleString()}円単位にしてください`);
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
