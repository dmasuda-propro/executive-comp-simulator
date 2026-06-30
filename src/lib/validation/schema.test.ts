import { describe, it, expect } from "vitest";
import { simulationSchema, defaultInput } from "./schema";

describe("simulationSchema", () => {
  it("defaultInput is valid", () =>
    expect(simulationSchema.safeParse(defaultInput).success).toBe(true));
  it("fixedBonusCount>3 fails", () => {
    const bad = {
      ...defaultInput,
      corporate: { ...defaultInput.corporate, fixedBonusCount: 4 },
    };
    expect(simulationSchema.safeParse(bad).success).toBe(false);
  });
  it("iDeCo+ 合計>23000 fails", () => {
    const bad = {
      ...defaultInput,
      taxSaving: {
        ...defaultInput.taxSaving,
        idecoPlusEnabled: true,
        idecoPlusCompanyMonthly: 20000,
        idecoPlusPersonalMonthly: 5000,
      },
    };
    expect(simulationSchema.safeParse(bad).success).toBe(false);
  });
  it("smallBusinessMutualMonthly>70000 fails", () => {
    const bad = {
      ...defaultInput,
      taxSaving: { ...defaultInput.taxSaving, smallBusinessMutualMonthly: 80000 },
    };
    expect(simulationSchema.safeParse(bad).success).toBe(false);
  });
});
