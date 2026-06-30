import { describe, it, expect } from "vitest";
import { deriveCareInsurance } from "./store";

describe("deriveCareInsurance", () => {
  it("39歳false / 40歳true / 65歳false", () => {
    expect(deriveCareInsurance(39)).toBe(false);
    expect(deriveCareInsurance(40)).toBe(true);
    expect(deriveCareInsurance(65)).toBe(false);
  });
});
