import Decimal from "decimal.js";
import { D, type Num } from "./money";

export const floorTo = (value: Num, unit: number): number =>
  D(value).dividedBy(unit).floor().times(unit).toNumber();

export const roundHalfUp = (value: Num): number =>
  D(value).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();

// 協会けんぽ被保険者折半: 端数50銭以下は切捨、50銭超は切上
export const roundHalfDownAtHalf = (value: Num): number => {
  const v = D(value);
  const frac = v.minus(v.floor());
  return frac.lessThanOrEqualTo(0.5)
    ? v.floor().toNumber()
    : v.floor().plus(1).toNumber();
};
