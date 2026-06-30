export const fmtYen = (v: number): string =>
  `${Math.round(v).toLocaleString("ja-JP")}円`;

// 万円表示(整数なら小数なし、端数あれば小数1桁)
export const fmtMan = (v: number): string => {
  const man = v / 10000;
  const digits = Number.isInteger(man) ? 0 : 1;
  return `${man.toLocaleString("ja-JP", { maximumFractionDigits: digits })}万円`;
};

// 符号付き(差額表示用)
export const fmtYenSigned = (v: number): string =>
  `${v > 0 ? "+" : v < 0 ? "−" : "±"}${Math.abs(Math.round(v)).toLocaleString("ja-JP")}円`;
