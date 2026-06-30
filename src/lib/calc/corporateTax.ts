import { D } from "@/lib/utils/money";

export function calcCorporateTax(params: {
  preSalaryProfit: number;
  directorSalaryAnnual: number;
  fixedBonusAnnual: number;
  companySocialInsurance: number;
  idecoPlusCompanyAnnual: number;
  companyDeductibleExpenses: number;
  corporateTaxRate: number;
}) {
  const profitBeforeTax = D(params.preSalaryProfit)
    .minus(params.directorSalaryAnnual)
    .minus(params.fixedBonusAnnual)
    .minus(params.companySocialInsurance)
    .minus(params.idecoPlusCompanyAnnual)
    .minus(params.companyDeductibleExpenses)
    .toNumber();
  const corporateTax = Math.floor(
    D(Math.max(0, profitBeforeTax)).times(params.corporateTaxRate).toNumber(),
  );
  return {
    profitBeforeTax,
    corporateTax,
    remainingCash: profitBeforeTax - corporateTax,
  };
}
