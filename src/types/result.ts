export type SocialInsuranceResult = {
  standardMonthly: number;
  monthlyEmployee: number;
  monthlyCompany: number;
  bonusEmployee: number;
  bonusCompany: number;
  annualEmployee: number; // monthly*12 + bonus (本人)
  annualCompany: number; // monthly*12 + bonus (会社)
  breakdown: { health: number; care: number; pension: number }; // 月額本人内訳
  treatedAsMonthly: boolean; // 賞与年4回以上で報酬扱いにしたか
};

export type IncomeTaxResult = {
  taxable: number;
  base: number; // 所得税(復興税前)
  reconstruction: number; // 復興特別所得税
  total: number;
  marginalRate: number; // 限界税率(復興税前)
};

export type ResidentTaxResult = {
  taxable: number;
  incomeLevy: number; // 所得割
  perCapita: number; // 均等割
  total: number;
};

export type IdecoPlusResult = {
  companyAnnual: number;
  personalAnnual: number;
  corporateTaxSaving: number;
  personalIncomeTaxSaving: number;
  personalResidentTaxSaving: number;
  socialInsuranceSaving: number; // 常に 0
};

export type TaxSavingResult = {
  companyPaidRentAnnual: number;
  housingBenefit: number;
  travelAllowanceAnnual: number;
  smallBusinessMutualAnnual: number;
  businessSafetyMutualAnnual: number;
  companyDeductibleExpenses: number; // 法人損金合計(社宅会社負担+旅費+セーフティ共済)
};

export type CaseResult = {
  label: string;
  salaryIncome: number; // 額面合計(月給年額 + 賞与)
  baseSalaryAnnual: number; // 月給・役員報酬の年額(家賃補助含む)
  bonusAnnual: number; // 賞与・事前確定届出給与
  employmentIncome: number; // 給与所得(給与所得控除後)
  social: SocialInsuranceResult;
  incomeTax: IncomeTaxResult;
  residentTax: ResidentTaxResult;
  ideco: IdecoPlusResult;
  taxSaving: TaxSavingResult;
  cashNet: number;
  effectiveNet: number;
  futureAssetNet: number;
  corporate?: {
    profitBeforeTax: number;
    corporateTax: number;
    remainingCash: number;
  };
  totalOwnerCash: number; // 会社員=effectiveNet, 法人=effectiveNet+remainingCash
};

export type DifferenceResult = {
  salaryIncome: number;
  socialEmployee: number;
  socialCompany: number;
  incomeTax: number;
  residentTax: number;
  corporateTax: number;
  cashNet: number;
  effectiveNet: number;
  totalOwnerCash: number; // corporate - employee
};

export type OptimizationResult = {
  monthlyDirectorSalary: number;
  fixedBonusAnnual: number;
  effectiveNet: number;
  corporateRemainingCash: number;
  totalOwnerCash: number;
  score: number;
};

export type SimulationResult = {
  employee: CaseResult;
  corporate: CaseResult;
  difference: DifferenceResult;
  optimization?: OptimizationResult[];
};
