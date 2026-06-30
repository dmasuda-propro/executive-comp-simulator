import { describe, it, expect } from "vitest";
import { floorTo, roundHalfDownAtHalf, roundHalfUp } from "./rounding";

describe("floorTo", () => {
  it("floors to 1000", () => expect(floorTo(1_234_999, 1000)).toBe(1_234_000));
  it("exact stays", () => expect(floorTo(5000, 1000)).toBe(5000));
});

describe("roundHalfDownAtHalf (協会けんぽ被保険者折半)", () => {
  it("0.50 ちょうどは切り捨て", () => expect(roundHalfDownAtHalf(100.5)).toBe(100));
  it("0.50 超は切り上げ", () => expect(roundHalfDownAtHalf(100.51)).toBe(101));
  it("0.49 は切り捨て", () => expect(roundHalfDownAtHalf(100.49)).toBe(100));
});

describe("roundHalfUp", () => {
  it("0.5 は切り上げ", () => expect(roundHalfUp(100.5)).toBe(101));
});
