import { describe, it, expect } from "vitest";
import { calcEmploymentIncome } from "./salaryIncome";

describe("calcEmploymentIncome", () => {
  it("年収600万: 控除=600万*0.2+44万=164万, 給与所得=436万", () => {
    const r = calcEmploymentIncome(6_000_000, 2026);
    expect(r.salaryDeduction).toBe(1_640_000);
    expect(r.employmentIncome).toBe(4_360_000);
  });
  it("最低保障74万: 年収100万→控除74万・給与所得26万", () => {
    const r = calcEmploymentIncome(1_000_000, 2026);
    expect(r.salaryDeduction).toBe(740_000);
    expect(r.employmentIncome).toBe(260_000);
  });
  it("低収入は控除が収入額で頭打ち・所得は0未満にならない", () => {
    const r = calcEmploymentIncome(500_000, 2026);
    expect(r.salaryDeduction).toBe(500_000);
    expect(r.employmentIncome).toBe(0);
  });
});
