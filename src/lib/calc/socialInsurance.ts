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

// 厚生年金の標準報酬月額は 88,000〜650,000 にクランプ(下限・上限あり)
export function pensionStandardMonthly(sm: number, year: number): number {
  const si = getRateMaster(year).socialInsurance;
  return Math.min(Math.max(sm, si.pensionStandardMin), si.pensionStandardMax);
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
  const pensionSm = pensionStandardMonthly(sm, params.year);

  const health = roundHalfDownAtHalf(
    D(sm).times(si.healthRate + si.childCareRate).dividedBy(2),
  );
  const care = hasCare
    ? roundHalfDownAtHalf(D(sm).times(si.careRate).dividedBy(2))
    : 0;
  // 厚生年金は標準報酬月額を 88,000〜650,000 にクランプして賦課(高額報酬は上限650,000で頭打ち)
  const pension = roundHalfDownAtHalf(
    D(pensionSm).times(si.pensionRate).dividedBy(2),
  );
  // 子ども・子育て拠出金は全額事業主負担(厚年標準報酬ベース)。本人負担には含めない。
  const childRearingLevy = Math.floor(
    D(pensionSm).times(si.childRearingLevyRate).toNumber(),
  );

  const monthlyEmployee = health + care + pension;
  return {
    standardMonthly: sm,
    monthlyEmployee,
    monthlyCompany: monthlyEmployee + childRearingLevy,
    childRearingLevy,
    breakdown: { health, care, pension },
  };
}
