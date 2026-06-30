import { describe, it, expect } from "vitest";
import {
  calcBonusSocialInsurance,
  calcAnnualBonusSocialInsurance,
} from "./bonusSocialInsurance";

describe("calcBonusSocialInsurance", () => {
  it("標準賞与額は1000円未満切り捨て・40歳未満は介護0", () => {
    const r = calcBonusSocialInsurance({
      bonusAmount: 1_234_567,
      age: 35,
      year: 2026,
      remainingHealthBonusCap: 5_730_000,
    });
    expect(r.standardBonus).toBe(1_234_000);
    expect(r.care).toBe(0);
    // 健保本人 = 1234000*(0.1008)/2 = 62193.6 → 62194(50銭超切上)
    expect(r.health).toBe(62_194);
    // 厚年本人 = 1234000*0.183/2 = 112911 → 112911
    expect(r.pension).toBe(112_911);
  });
  it("厚年は月150万上限", () => {
    const r = calcBonusSocialInsurance({
      bonusAmount: 3_000_000,
      age: 35,
      year: 2026,
      remainingHealthBonusCap: 5_730_000,
    });
    // 厚年本人 = 1500000*0.183/2 = 137250
    expect(r.pension).toBe(137_250);
  });
});

describe("calcAnnualBonusSocialInsurance", () => {
  it("健保は年度累計573万上限を複数賞与で消費", () => {
    const r = calcAnnualBonusSocialInsurance({
      bonuses: [4_000_000, 4_000_000],
      age: 35,
      year: 2026,
    });
    expect(r.employee).toBeGreaterThan(0);
    expect(r.company).toBe(r.employee);
  });
});
