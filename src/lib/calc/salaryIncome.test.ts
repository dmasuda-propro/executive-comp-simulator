import { describe, it, expect } from "vitest";
import { calcEmploymentIncome } from "./salaryIncome";

describe("calcEmploymentIncome", () => {
  it("年収600万: 控除=600万*0.2+44万=164万, 給与所得=436万", () => {
    const r = calcEmploymentIncome(6_000_000, 2026);
    expect(r.salaryDeduction).toBe(1_640_000);
    expect(r.employmentIncome).toBe(4_360_000);
  });
  it("低収入は最低保障65万・所得は0未満にならない", () => {
    const r = calcEmploymentIncome(500_000, 2026);
    expect(r.salaryDeduction).toBe(500_000);
    expect(r.employmentIncome).toBe(0);
  });
});
