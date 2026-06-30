export type StandardRemunerationGrade = {
  grade: number; // 健康保険等級
  pensionGrade: number; // 厚生年金等級 (範囲外は 0)
  min: number;
  max: number | null;
  standardMonthly: number;
};

export type TaxBand = { upTo: number | null; rate: number; deduction: number };

export type RateMaster = {
  year: number;
  socialInsurance: {
    healthRate: number;
    childCareRate: number;
    careRate: number;
    pensionRate: number;
    bonusPensionCapPerMonth: number;
    bonusHealthCapAnnual: number;
    bonusCountThreshold: number; // この回数以上で報酬扱い
    grades: StandardRemunerationGrade[];
  };
  incomeTax: {
    brackets: TaxBand[];
    reconstructionRate: number;
  };
  residentTax: {
    rate: number;
    perCapita: number;
    basicDeduction: number;
  };
  deductions: {
    salaryDeduction: (salaryIncome: number) => number; // 給与所得控除
    basicDeduction: (totalIncome: number) => number; // 所得税 基礎控除(令和8年分)
    spouseDeduction: number;
    dependentDeduction: number; // 1人あたり(一般38万)
  };
};
