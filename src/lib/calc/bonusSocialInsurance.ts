import { getRateMaster } from "@/lib/constants/rateMaster";
import { D } from "@/lib/utils/money";
import { floorTo, roundHalfDownAtHalf } from "@/lib/utils/rounding";

export function calcBonusSocialInsurance(params: {
  bonusAmount: number;
  age: number;
  year: number;
  remainingHealthBonusCap: number;
}) {
  const m = getRateMaster(params.year);
  const si = m.socialInsurance;
  const standardBonus = floorTo(params.bonusAmount, 1000);
  const hasCare = params.age >= 40 && params.age < 65;

  const healthBase = Math.min(
    standardBonus,
    Math.max(0, params.remainingHealthBonusCap),
  );
  const pensionBase = Math.min(standardBonus, si.bonusPensionCapPerMonth);

  const health = roundHalfDownAtHalf(
    D(healthBase).times(si.healthRate + si.childCareRate).dividedBy(2),
  );
  const care = hasCare
    ? roundHalfDownAtHalf(D(healthBase).times(si.careRate).dividedBy(2))
    : 0;
  const pension = roundHalfDownAtHalf(
    D(pensionBase).times(si.pensionRate).dividedBy(2),
  );
  // 子ども・子育て拠出金は全額事業主負担(標準賞与額の厚年ベース)
  const childRearingLevy = Math.floor(
    D(pensionBase).times(si.childRearingLevyRate).toNumber(),
  );

  const employee = health + care + pension;
  return {
    standardBonus,
    employee,
    company: employee + childRearingLevy,
    childRearingLevy,
    health,
    care,
    pension,
    healthCapUsed: healthBase,
  };
}

export function calcAnnualBonusSocialInsurance(params: {
  bonuses: number[];
  age: number;
  year: number;
}) {
  const m = getRateMaster(params.year);
  let remaining = m.socialInsurance.bonusHealthCapAnnual;
  let employee = 0;
  let company = 0;
  for (const bonus of params.bonuses) {
    if (bonus <= 0) continue;
    const r = calcBonusSocialInsurance({
      bonusAmount: bonus,
      age: params.age,
      year: params.year,
      remainingHealthBonusCap: remaining,
    });
    remaining = Math.max(0, remaining - r.healthCapUsed);
    employee += r.employee;
    company += r.company;
  }
  return { employee, company };
}
