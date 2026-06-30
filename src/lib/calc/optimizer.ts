import type { SimulationInput, OptimizationInput } from "@/types/input";
import type { OptimizationResult } from "@/types/result";
import { simulateCorporateCase } from "./simulator";

const MAX_COMBOS = 20_000;

export function optimize(
  input: SimulationInput,
  opt: OptimizationInput,
): OptimizationResult[] {
  const salarySteps =
    Math.floor((opt.monthlySalaryMax - opt.monthlySalaryMin) / opt.monthlySalaryStep) + 1;
  const bonusSteps =
    Math.floor((opt.bonusMax - opt.bonusMin) / opt.bonusStep) + 1;
  if (salarySteps * bonusSteps > MAX_COMBOS)
    throw new Error(
      `組合せが多すぎます(${salarySteps * bonusSteps})。刻みを大きくしてください`,
    );

  const results: OptimizationResult[] = [];
  for (let s = opt.monthlySalaryMin; s <= opt.monthlySalaryMax; s += opt.monthlySalaryStep) {
    for (let b = opt.bonusMin; b <= opt.bonusMax; b += opt.bonusStep) {
      const trial: SimulationInput = {
        ...input,
        corporate: {
          ...input.corporate,
          preSalaryProfit: opt.preSalaryProfit,
          monthlyDirectorSalary: s,
          fixedBonusAnnual: b,
          fixedBonusCount: b > 0 ? Math.max(1, input.corporate.fixedBonusCount) : 0,
        },
      };
      const c = simulateCorporateCase(trial);
      const remainingCash = c.corporate!.remainingCash;
      results.push({
        monthlyDirectorSalary: s,
        fixedBonusAnnual: b,
        effectiveNet: c.effectiveNet,
        corporateRemainingCash: remainingCash,
        totalOwnerCash: c.totalOwnerCash,
        score: c.effectiveNet + remainingCash,
      });
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 20);
}
