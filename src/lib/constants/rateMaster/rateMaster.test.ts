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
});
