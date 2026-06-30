// 扶養親族の区分別人数
export type Dependents = {
  general: number; // 一般扶養(16-18,23-69)
  specific: number; // 特定扶養(19-22)
  elderly: number; // 老人扶養(70+,非同居)
  coresidentElderly: number; // 同居老親等(70+,同居)
};

export type BasicInput = {
  prefecture: string; // MVP: "東京"
  age: number;
  hasCareInsurance: boolean; // 自動判定 (40<=age<65) を保持
  dependents: Dependents; // 扶養親族(区分別人数)
  spouseDeduction: boolean; // 配偶者控除(一般38万)を適用するか
  disabilityGeneral: number; // 一般障害者の人数(本人・配偶者・扶養親族)
  disabilitySpecial: number; // 特別障害者の人数
  medicalExpenseAnnual: number; // 年間の医療費(自己負担額)
  simulationYear: number; // 2026
};

export type EmployeeInput = {
  annualSalary: number; // 表示用(monthly*12+bonus と一致させる)
  monthlySalary: number;
  annualBonus: number;
  bonusCount: number;
  rentSubsidyAnnual: number;
  employeeIdecoMonthly: number;
  companyDcMonthly: number;
};

export type CorporateInput = {
  preSalaryProfit: number; // 役員報酬支給前利益
  monthlyDirectorSalary: number;
  fixedBonusAnnual: number; // 事前確定届出給与 年額
  fixedBonusCount: number; // 0..3
  fixedBonusMonths: number[];
  corporateTaxRate: number; // 0..1 (既定 0.30)
};

export type TaxSavingInput = {
  companyHousingEnabled: boolean;
  monthlyRent: number;
  companyRentShareRate: number; // 0..1
  personalRentShareRate: number; // 0..1
  idecoPlusEnabled: boolean;
  idecoPlusCompanyMonthly: number;
  idecoPlusPersonalMonthly: number;
  smallBusinessMutualMonthly: number;
  businessSafetyMutualAnnual: number;
  travelAllowanceEnabled: boolean;
  travelDaysPerMonth: number;
  travelAllowancePerDay: number;
  lifeInsuranceAnnual: number;
};

// マイクロ法人＋業務委託スキーム
export type MicroSchemeInput = {
  contractRevenueAnnual: number; // 業務委託の年間報酬(本業)
  contractExpensesAnnual: number; // 業務委託の経費
  microMonthlySalary: number; // マイクロ法人の役員報酬(月)。社保最低化のため既定55,000
  smallBusinessMutualMonthly: number; // 小規模企業共済(月)。全額所得控除
  idecoMonthly: number; // iDeCo個人掛金(月)。全額所得控除(第2号・企業年金なし上限62,000)
  consumptionTaxEnabled: boolean; // 消費税(簡易課税)を課すか
  consumptionTaxRate: number; // 対売上の実効率。簡易課税サービス業(第5種)=5%
  businessTaxEnabled: boolean; // 個人事業税を課すか
  businessTaxRate: number; // 個人事業税率。標準5%(請負業・コンサル等)
};

export type SimulationInput = {
  basic: BasicInput;
  employee: EmployeeInput;
  corporate: CorporateInput;
  taxSaving: TaxSavingInput;
  microScheme: MicroSchemeInput;
};

export type OptimizationInput = {
  preSalaryProfit: number;
  monthlySalaryMin: number;
  monthlySalaryMax: number;
  monthlySalaryStep: number;
  bonusMin: number;
  bonusMax: number;
  bonusStep: number;
};
