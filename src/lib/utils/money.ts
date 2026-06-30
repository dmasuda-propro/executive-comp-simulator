import Decimal from "decimal.js";

export type Num = number | string | Decimal;

export const D = (v: Num): Decimal => new Decimal(v);

export const yen = (v: Num): number =>
  new Decimal(v).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();

export const sum = (...vals: Num[]): Decimal =>
  vals.reduce<Decimal>((a, b) => a.plus(b), new Decimal(0));
