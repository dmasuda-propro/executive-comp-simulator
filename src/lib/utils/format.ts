export const fmtYen = (v: number): string =>
  `${Math.round(v).toLocaleString("ja-JP")}円`;
