import type { SimulationInput, TaxSavingInput } from "@/types/input";
import type { CaseResult } from "@/types/result";
import { simulateCorporateCase, simulateEmployeeCase } from "./simulator";

// 「節税フル活用」: iDeCo+合計23,000円/月(会社22,000+個人1,000)・小規模70,000円/月を上限投入。
// 社宅・出張旅費・経営セーフティ共済・生命保険は現在のタブ値を踏襲。
export function maxTaxSavingConfig(base: TaxSavingInput): TaxSavingInput {
  return {
    ...base,
    idecoPlusEnabled: true,
    idecoPlusCompanyMonthly: 22_000,
    idecoPlusPersonalMonthly: 1_000,
    smallBusinessMutualMonthly: 70_000,
  };
}

export type ReverseSolveResult = {
  targetEffectiveNet: number; // 会社員の実質手取り
  monthlyDirectorSalary: number; // 逆算で必要な役員報酬(月額)
  annualDirectorSalary: number;
  achievedEffectiveNet: number; // その役員報酬での実質手取り(達成値)
  reachedCap: boolean; // 上限でも目標に届かない
  insufficientProfit: boolean; // 役員報酬支給前利益が足りず法人残がマイナス
  result: CaseResult; // その役員報酬での法人ケース全体
  taxSaving: TaxSavingInput; // 使用した節税設定
};

// 会社員の実質手取りに一致する役員報酬(月額)を二分探索で逆算。
// 実質手取りは役員報酬に対して単調増加なので確実に収束する。
export function solveDirectorSalaryForTakeHome(
  input: SimulationInput,
  opts?: { maxMonthly?: number; unit?: number },
): ReverseSolveResult {
  const maxMonthly = opts?.maxMonthly ?? 10_000_000;
  const unit = opts?.unit ?? 1_000;
  const taxSaving = maxTaxSavingConfig(input.taxSaving);
  const targetEffectiveNet = simulateEmployeeCase(input).effectiveNet;

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

  const atMax = trialAt(maxMonthly);
  if (atMax.effectiveNet < targetEffectiveNet) {
    return {
      targetEffectiveNet,
      monthlyDirectorSalary: maxMonthly,
      annualDirectorSalary: maxMonthly * 12,
      achievedEffectiveNet: atMax.effectiveNet,
      reachedCap: true,
      insufficientProfit: (atMax.corporate?.remainingCash ?? 0) < 0,
      result: atMax,
      taxSaving,
    };
  }

  let lo = 0;
  let hi = maxMonthly;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (trialAt(mid).effectiveNet < targetEffectiveNet) lo = mid;
    else hi = mid;
  }
  // 役員報酬は実務上の単位に切り上げ(達成手取り >= 目標 になるように)
  const monthlyDirectorSalary = Math.ceil(hi / unit) * unit;
  const result = trialAt(monthlyDirectorSalary);

  return {
    targetEffectiveNet,
    monthlyDirectorSalary,
    annualDirectorSalary: monthlyDirectorSalary * 12,
    achievedEffectiveNet: result.effectiveNet,
    reachedCap: false,
    insufficientProfit: (result.corporate?.remainingCash ?? 0) < 0,
    result,
    taxSaving,
  };
}
