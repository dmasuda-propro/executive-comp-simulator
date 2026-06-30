import { D } from "@/lib/utils/money";

export function calcCorporateTax(params: {
  preSalaryProfit: number;
  directorSalaryAnnual: number;
  fixedBonusAnnual: number;
  companySocialInsurance: number;
  idecoPlusCompanyAnnual: number;
  companyDeductibleExpenses: number;
  corporateTaxRate: number;
  perCapitaTax?: number; // 法人住民税 均等割(赤字でも発生)
}) {
  const profitBeforeTax = D(params.preSalaryProfit)
    .minus(params.directorSalaryAnnual)
    .minus(params.fixedBonusAnnual)
    .minus(params.companySocialInsurance)
    .minus(params.idecoPlusCompanyAnnual)
    .minus(params.companyDeductibleExpenses)
    .toNumber();
  const rateTax = Math.floor(
    D(Math.max(0, profitBeforeTax)).times(params.corporateTaxRate).toNumber(),
  );
  const perCapita = params.perCapitaTax ?? 0;
  // 均等割は赤字でも必ず発生する固定額。法人税等に含める。
  const corporateTax = rateTax + perCapita;
  return {
    profitBeforeTax,
    corporateTax,
    remainingCash: profitBeforeTax - corporateTax,
  };
}
