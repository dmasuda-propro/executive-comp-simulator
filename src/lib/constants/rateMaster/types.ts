export type StandardRemunerationGrade = {
  grade: number; // 健康保険等級
  pensionGrade: number; // 厚生年金等級 (範囲外は 0)
  min: number;
  max: number | null;
  standardMonthly: number;
};

export type TaxBand = { upTo: number | null; rate: number; deduction: number };

// 所得税・住民税の控除額の組(income=所得税, resident=住民税)
export type DeductionPair = { income: number; resident: number };

export type RateMaster = {
  year: number;
  socialInsurance: {
    healthRate: number;
    childCareRate: number;
    careRate: number;
    pensionRate: number;
    childRearingLevyRate: number; // 子ども・子育て拠出金率(全額事業主負担・厚年ベース)
    pensionStandardMin: number; // 厚年 標準報酬月額の下限(88,000)
    pensionStandardMax: number; // 厚年 標準報酬月額の上限(650,000)
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
    spouse: DeductionPair; // 一般配偶者控除(70歳未満)
    dependent: {
      general: DeductionPair; // 一般扶養(16-18,23-69)
      specific: DeductionPair; // 特定扶養(19-22)
      elderly: DeductionPair; // 老人扶養(70+,非同居)
      coresidentElderly: DeductionPair; // 同居老親等(70+,同居)
    };
  };
};
