export type BasicInput = {
  prefecture: string; // MVP: "東京"
  age: number;
  hasCareInsurance: boolean; // 自動判定 (40<=age<65) を保持
  dependents: number; // 一般扶養親族数(16歳以上想定の概算)
  spouseDeduction: boolean; // 配偶者控除(38万)を適用するか
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

export type SimulationInput = {
  basic: BasicInput;
  employee: EmployeeInput;
  corporate: CorporateInput;
  taxSaving: TaxSavingInput;
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
