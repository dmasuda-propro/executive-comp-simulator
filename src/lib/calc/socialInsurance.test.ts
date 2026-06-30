import { describe, it, expect } from "vitest";
import { findGrade, calcMonthlySocialInsurance } from "./socialInsurance";
import { getRateMaster } from "@/lib/constants/rateMaster";

const m = getRateMaster(2026);

describe("findGrade", () => {
  it("低額は最下等級", () =>
    expect(findGrade(50_000, m).standardMonthly).toBe(58_000));
  it("300,000 は標準報酬 300,000 等級", () =>
    expect(findGrade(300_000, m).standardMonthly).toBe(300_000));
  it("超高額は最上等級", () =>
    expect(findGrade(5_000_000, m).standardMonthly).toBe(1_390_000));
});

describe("calcMonthlySocialInsurance", () => {
  it("40歳未満は介護なし", () => {
    const r = calcMonthlySocialInsurance({
      monthlySalary: 300_000,
      age: 35,
      year: 2026,
    });
    expect(r.standardMonthly).toBe(300_000);
    expect(r.breakdown.care).toBe(0);
    // 健保本人 = 300000*(0.0985+0.0023)/2 = 15120
    expect(r.breakdown.health).toBe(15_120);
    // 厚年本人 = 300000*0.183/2 = 27450
    expect(r.breakdown.pension).toBe(27_450);
    expect(r.monthlyEmployee).toBe(15_120 + 27_450);
    // 子ども・子育て拠出金(全額事業主) = floor(300000*0.0036) = 1080 → 会社負担=本人+1080
    expect(r.childRearingLevy).toBe(1_080);
    expect(r.monthlyCompany).toBe(r.monthlyEmployee + 1_080);
  });
  it("高額報酬は厚年が標準報酬月額650,000で頭打ち(0にならない)", () => {
    const r = calcMonthlySocialInsurance({
      monthlySalary: 700_000,
      age: 35,
      year: 2026,
    });
    expect(r.standardMonthly).toBe(710_000); // 健保等級(報酬月額700,000→標準報酬710,000)
    // 厚年本人 = 650000(上限)*0.183/2 = 59475
    expect(r.breakdown.pension).toBe(59_475);
    // 拠出金 = floor(650000*0.0036)=2340
    expect(r.childRearingLevy).toBe(2_340);
  });
  it("40〜65歳は介護あり", () => {
    const r = calcMonthlySocialInsurance({
      monthlySalary: 300_000,
      age: 45,
      year: 2026,
    });
    // 介護本人 = 300000*0.0162/2 = 2430
    expect(r.breakdown.care).toBe(2_430);
    expect(r.monthlyEmployee).toBe(15_120 + 2_430 + 27_450);
  });
});
