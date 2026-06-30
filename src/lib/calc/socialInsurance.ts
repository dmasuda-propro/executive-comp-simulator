import {
  getRateMaster,
  type RateMaster,
  type StandardRemunerationGrade,
} from "@/lib/constants/rateMaster";
import { D } from "@/lib/utils/money";
import { roundHalfDownAtHalf } from "@/lib/utils/rounding";

export function findGrade(
  monthlySalary: number,
  master: RateMaster,
): StandardRemunerationGrade {
  const g = master.socialInsurance.grades.find(
    (row) =>
      monthlySalary >= row.min && (row.max === null || monthlySalary < row.max),
  );
  if (!g) throw new Error(`等級が見つかりません: ${monthlySalary}`);
  return g;
}

export function calcMonthlySocialInsurance(params: {
  monthlySalary: number;
  age: number;
  year: number;
}) {
  const m = getRateMaster(params.year);
  const si = m.socialInsurance;
  const grade = findGrade(params.monthlySalary, m);
  const sm = grade.standardMonthly;
  const hasCare = params.age >= 40 && params.age < 65;

  const health = roundHalfDownAtHalf(
    D(sm).times(si.healthRate + si.childCareRate).dividedBy(2),
  );
  const care = hasCare
    ? roundHalfDownAtHalf(D(sm).times(si.careRate).dividedBy(2))
    : 0;
  // 厚生年金は標準報酬月額 88,000〜650,000 の範囲(pensionGrade>0)でのみ賦課
  const pension =
    grade.pensionGrade > 0
      ? roundHalfDownAtHalf(D(sm).times(si.pensionRate).dividedBy(2))
      : 0;

  const monthlyEmployee = health + care + pension;
  return {
    standardMonthly: sm,
    monthlyEmployee,
    monthlyCompany: monthlyEmployee,
    breakdown: { health, care, pension },
  };
}
