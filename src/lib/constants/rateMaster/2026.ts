import type { RateMaster, StandardRemunerationGrade } from "./types";

// 出典前提(概算・令和8年分想定):
//   協会けんぽ東京 2026 = 健保 9.85% / 子育て支援金 0.23% / 介護 1.62% / 厚年 18.3%
//   給与所得控除は令和7年改正後(最低保障 65 万)。
//   基礎控除は令和7年改正の令和7・8年分上乗せ特例を反映。
//   所得税率は超過累進(現行)。住民税 所得割 10%・基礎控除 43 万・均等割 5,000 円(森林環境税含む)。
// 正式値確定後はこのファイルを差し替える。

// 健康保険 標準報酬月額(区分の代表値・固定値)。
const STANDARD_MONTHLY: number[] = [
  58000, 68000, 78000, 88000, 98000, 104000, 110000, 118000, 126000, 134000,
  142000, 150000, 160000, 170000, 180000, 190000, 200000, 220000, 240000, 260000,
  280000, 300000, 320000, 340000, 360000, 380000, 410000, 440000, 470000, 500000,
  530000, 560000, 590000, 620000, 650000, 680000, 710000, 750000, 790000, 830000,
  880000, 930000, 980000, 1030000, 1090000, 1150000, 1210000, 1270000, 1330000, 1390000,
];

// 各等級の下限(円)。区分は隣接等級の中間で区切られる協会けんぽ表に準拠。
const MINS: number[] = [
  0, 63000, 73000, 83000, 93000, 101000, 107000, 114000, 122000, 130000,
  138000, 146000, 155000, 165000, 175000, 185000, 195000, 210000, 230000, 250000,
  270000, 290000, 310000, 330000, 350000, 370000, 395000, 425000, 455000, 485000,
  515000, 545000, 575000, 605000, 635000, 665000, 695000, 730000, 770000, 810000,
  855000, 905000, 955000, 1005000, 1055000, 1115000, 1175000, 1235000, 1295000, 1355000,
];

const grades: StandardRemunerationGrade[] = STANDARD_MONTHLY.map((sm, i) => ({
  grade: i + 1,
  // 厚年は健保等級4(88,000)から賦課・上限は標準報酬月額650,000(健保等級35)。範囲外は0。
  pensionGrade: i >= 3 && i <= 34 ? i - 2 : 0,
  min: MINS[i],
  max: i === STANDARD_MONTHLY.length - 1 ? null : MINS[i + 1],
  standardMonthly: sm,
}));

// 給与所得控除(令和7年改正後・最低保障65万)
const salaryDeduction = (income: number): number => {
  if (income <= 1_900_000) return Math.min(income, 650_000);
  if (income <= 3_600_000) return income * 0.3 + 80_000;
  if (income <= 6_600_000) return income * 0.2 + 440_000;
  if (income <= 8_500_000) return income * 0.1 + 1_100_000;
  return 1_950_000;
};

// 所得税 基礎控除(令和7改正・令和7,8年分の上乗せ特例を反映, 合計所得金額ベース)
const basicDeduction = (totalIncome: number): number => {
  if (totalIncome <= 1_320_000) return 950_000;
  if (totalIncome <= 3_360_000) return 880_000;
  if (totalIncome <= 4_890_000) return 680_000;
  if (totalIncome <= 6_550_000) return 630_000;
  if (totalIncome <= 23_500_000) return 580_000;
  if (totalIncome <= 24_000_000) return 480_000;
  if (totalIncome <= 24_500_000) return 320_000;
  if (totalIncome <= 25_000_000) return 160_000;
  return 0;
};

export const rateMaster2026: RateMaster = {
  year: 2026,
  socialInsurance: {
    healthRate: 0.0985,
    childCareRate: 0.0023,
    careRate: 0.0162,
    pensionRate: 0.183,
    bonusPensionCapPerMonth: 1_500_000,
    bonusHealthCapAnnual: 5_730_000,
    bonusCountThreshold: 4,
    grades,
  },
  incomeTax: {
    brackets: [
      { upTo: 1_950_000, rate: 0.05, deduction: 0 },
      { upTo: 3_300_000, rate: 0.1, deduction: 97_500 },
      { upTo: 6_950_000, rate: 0.2, deduction: 427_500 },
      { upTo: 9_000_000, rate: 0.23, deduction: 636_000 },
      { upTo: 18_000_000, rate: 0.33, deduction: 1_536_000 },
      { upTo: 40_000_000, rate: 0.4, deduction: 2_796_000 },
      { upTo: null, rate: 0.45, deduction: 4_796_000 },
    ],
    reconstructionRate: 0.021,
  },
  residentTax: { rate: 0.1, perCapita: 5_000, basicDeduction: 430_000 },
  deductions: {
    salaryDeduction,
    basicDeduction,
    spouseDeduction: 380_000,
    dependentDeduction: 380_000,
  },
};
