import type { SimulationInput, TaxSavingInput } from "@/types/input";
import type { CaseResult } from "@/types/result";
import { getRateMaster } from "@/lib/constants/rateMaster";
import { simulateCorporateCase, simulateEmployeeCase } from "./simulator";

// 一致させる手取り/資産の指標
export type SolveMetric = "futureAssetNet" | "effectiveNet" | "cashNet";

const pick = (c: CaseResult, metric: SolveMetric): number => c[metric];

// 「節税フル活用」: iDeCo+を合計上限まで(加入者1,000円+残りを事業主掛金)・小規模70,000円/月を上限投入。
// 社宅・出張旅費・経営セーフティ共済・生命保険は現在のタブ値を踏襲。
export function maxTaxSavingConfig(
  base: TaxSavingInput,
  idecoPlusMax: number,
): TaxSavingInput {
  return {
    ...base,
    idecoPlusEnabled: true,
    idecoPlusPersonalMonthly: 1_000, // 加入者掛金は最低1,000円
    idecoPlusCompanyMonthly: Math.max(0, idecoPlusMax - 1_000), // 残りを全額損金の事業主掛金に
    smallBusinessMutualMonthly: 70_000,
  };
}

export type ReverseSolveResult = {
  metric: SolveMetric;
  targetValue: number; // 現職(会社員)の指標値
  employeeGrossSalary: number; // 現職の額面年収
  monthlyDirectorSalary: number; // 提案する役員報酬(月額・額面)
  annualDirectorSalary: number; // 提案する役員報酬(年額・額面)
  achievedValue: number; // 提案報酬での指標値(達成値)
  companyAnnualCost: number; // 会社の年間人件費負担(概算)
  reachedCap: boolean; // 上限でも目標に届かない
  insufficientProfit: boolean; // 支給前利益が足りず法人残がマイナス
  result: CaseResult; // 提案報酬での法人ケース全体
  taxSaving: TaxSavingInput; // 使用した節税設定
};

// 会社員の指標値(既定: 将来資産込み総資産)に一致する役員報酬(月額)を二分探索で逆算。
// 指標は役員報酬に対して単調増加なので確実に収束する。
export function solveDirectorSalaryForTakeHome(
  input: SimulationInput,
  opts?: { metric?: SolveMetric; maxMonthly?: number; unit?: number },
): ReverseSolveResult {
  const metric = opts?.metric ?? "futureAssetNet";
  const maxMonthly = opts?.maxMonthly ?? 10_000_000;
  const unit = opts?.unit ?? 1_000;
  const idecoPlusMax = getRateMaster(input.basic.simulationYear).idecoPlus.monthlyMax;
  const taxSaving = maxTaxSavingConfig(input.taxSaving, idecoPlusMax);

  const employee = simulateEmployeeCase(input);
  const targetValue = pick(employee, metric);
  const employeeGrossSalary = employee.salaryIncome;

  const trialAt = (s: number): CaseResult =>
    simulateCorporateCase({
      ...input,
      corporate: {
        ...input.corporate,
        monthlyDirectorSalary: s,
        fixedBonusAnnual: 0,
        fixedBonusCount: 0,
      },
      taxSaving,
    });

  const companyCost = (c: CaseResult): number =>
    c.salaryIncome +
    c.social.annualCompany +
    c.ideco.companyAnnual +
    c.taxSaving.companyDeductibleExpenses;

  const build = (
    monthlyDirectorSalary: number,
    result: CaseResult,
    reachedCap: boolean,
  ): ReverseSolveResult => ({
    metric,
    targetValue,
    employeeGrossSalary,
    monthlyDirectorSalary,
    annualDirectorSalary: monthlyDirectorSalary * 12,
    achievedValue: pick(result, metric),
    companyAnnualCost: companyCost(result),
    reachedCap,
    insufficientProfit: (result.corporate?.remainingCash ?? 0) < 0,
    result,
    taxSaving,
  });

  const atMax = trialAt(maxMonthly);
  if (pick(atMax, metric) < targetValue) {
    return build(maxMonthly, atMax, true);
  }

  let lo = 0;
  let hi = maxMonthly;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (pick(trialAt(mid), metric) < targetValue) lo = mid;
    else hi = mid;
  }
  // 役員報酬は実務上の単位に切り上げ(達成値 >= 目標 になるように)
  const monthlyDirectorSalary = Math.ceil(hi / unit) * unit;
  return build(monthlyDirectorSalary, trialAt(monthlyDirectorSalary), false);
}
