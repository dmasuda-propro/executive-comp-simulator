import { D } from "@/lib/utils/money";
import type { TaxSavingInput } from "@/types/input";
import type { TaxSavingResult } from "@/types/result";

export function calcTaxSaving(input: TaxSavingInput): TaxSavingResult {
  const companyPaidRentAnnual = input.companyHousingEnabled
    ? D(input.monthlyRent).times(input.companyRentShareRate).times(12).toNumber()
    : 0;
  const travelAllowanceAnnual = input.travelAllowanceEnabled
    ? D(input.travelDaysPerMonth)
        .times(input.travelAllowancePerDay)
        .times(12)
        .toNumber()
    : 0;
  const smallBusinessMutualAnnual = D(input.smallBusinessMutualMonthly)
    .times(12)
    .toNumber();
  const businessSafetyMutualAnnual = input.businessSafetyMutualAnnual;

  return {
    companyPaidRentAnnual,
    housingBenefit: companyPaidRentAnnual,
    travelAllowanceAnnual,
    smallBusinessMutualAnnual,
    businessSafetyMutualAnnual,
    companyDeductibleExpenses:
      companyPaidRentAnnual + travelAllowanceAnnual + businessSafetyMutualAnnual,
  };
}
