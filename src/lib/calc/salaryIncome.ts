import { getRateMaster } from "@/lib/constants/rateMaster";

export function calcEmploymentIncome(salaryIncome: number, year: number) {
  const m = getRateMaster(year);
  const salaryDeduction = Math.floor(m.deductions.salaryDeduction(salaryIncome));
  const employmentIncome = Math.max(0, salaryIncome - salaryDeduction);
  return { salaryDeduction, employmentIncome };
}
