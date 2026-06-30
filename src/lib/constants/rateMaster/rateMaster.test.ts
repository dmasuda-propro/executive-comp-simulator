import { describe, it, expect } from "vitest";
import { getRateMaster } from "./index";

describe("getRateMaster", () => {
  const m = getRateMaster(2026);
  it("has 2026 social insurance rates", () => {
    expect(m.socialInsurance.healthRate).toBe(0.0985);
    expect(m.socialInsurance.childCareRate).toBe(0.0023);
    expect(m.socialInsurance.careRate).toBe(0.0162);
    expect(m.socialInsurance.pensionRate).toBe(0.183);
  });
  it("grades are sorted and cover wide range", () => {
    const g = m.socialInsurance.grades;
    expect(g.length).toBeGreaterThanOrEqual(50);
    expect(g[0].min).toBe(0);
    expect(g[g.length - 1].max).toBeNull();
    for (let i = 1; i < g.length; i++)
      expect(g[i].standardMonthly).toBeGreaterThan(g[i - 1].standardMonthly);
  });
  it("bonus caps", () => {
    expect(m.socialInsurance.bonusPensionCapPerMonth).toBe(1_500_000);
    expect(m.socialInsurance.bonusHealthCapAnnual).toBe(5_730_000);
  });
  it("throws for unknown year", () => expect(() => getRateMaster(1999)).toThrow());

  // 令和8年度改正の確定値(国税庁 令和8年4月 源泉所得税の改正のあらまし)
  it("給与所得控除の最低保障は74万(収入220万以下)", () => {
    expect(m.deductions.salaryDeduction(1_000_000)).toBe(740_000);
    expect(m.deductions.salaryDeduction(2_200_000)).toBe(740_000);
    // 220万超は従来式(30%+8万)、600万は20%+44万=164万(改正なし区分)
    expect(m.deductions.salaryDeduction(6_000_000)).toBe(1_640_000);
  });
  it("基礎控除は令和8年分の104/104/104/67/62万", () => {
    expect(m.deductions.basicDeduction(1_320_000)).toBe(1_040_000);
    expect(m.deductions.basicDeduction(3_360_000)).toBe(1_040_000);
    expect(m.deductions.basicDeduction(4_890_000)).toBe(1_040_000);
    expect(m.deductions.basicDeduction(6_550_000)).toBe(670_000);
    expect(m.deductions.basicDeduction(23_500_000)).toBe(620_000);
    expect(m.deductions.basicDeduction(24_000_000)).toBe(480_000);
    expect(m.deductions.basicDeduction(30_000_000)).toBe(0);
  });
});
