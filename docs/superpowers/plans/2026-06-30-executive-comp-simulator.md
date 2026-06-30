# 役員報酬・会社員比較シミュレーター Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web 上で「会社員」「法人役員」「法人役員＋節税施策」を比較し、手取り・実質手取り・法人残・合計・各税負担・節税効果・最適報酬を表示するシミュレーターを作る。

**Architecture:** `src/lib/calc/*` を decimal.js ベースの純粋関数として実装し Vitest でテスト。年度料率は `src/lib/constants/rateMaster/*` の単一マスタに集約し差し替え可能にする。標準報酬月額表は等級区分（固定）× 料率で実行時生成。UI は Next.js App Router + RHF + Zod + Recharts で `/simulator` にフォームと結果をリアルタイム表示。

**Tech Stack:** Next.js (App Router) / TypeScript / Tailwind CSS / React Hook Form / Zod / Recharts / decimal.js / Vitest

## Global Constraints

- 金額計算は全て `decimal.js`（`Decimal`）で行い、`number` での直接四則演算を避ける。表示・テスト比較時のみ `toNumber()`。
- 年度依存の料率・控除は必ず `RateMaster` 経由で参照する。関数内にマジックナンバーの料率を直書きしない。
- 協会けんぽの折半端数: 被保険者負担は 50 銭以下切捨・50 銭超切上（`roundHalfDownAtHalf`）。
- 厚年 標準賞与額 月上限 1,500,000 円 / 健保・介護 標準賞与額 年度累計上限 5,730,000 円。
- iDeCo+ 合計（会社＋個人）月額 5,000〜23,000 円・1,000 円単位。小規模企業共済 月額 0〜70,000 円。
- 賞与年 4 回以上は社会保険上「報酬」扱い。事前確定届出給与の `fixedBonusCount` は 0〜3。
- テストフレームワークは Vitest。テストは対象ファイルと同階層 `*.test.ts`。
- 各タスク末尾でコミット。コミット文末尾に `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。

---

## File Structure

```
src/
  app/
    layout.tsx, globals.css, page.tsx          # landing
    simulator/page.tsx                         # main: form + result
    simulator/result/page.tsx                  # detail (reads shared store)
  components/
    forms/{BasicInfoForm,EmployeeForm,CorporateForm,TaxSavingForm,OptimizationForm}.tsx
    results/{SummaryCards,ComparisonTable,TaxBreakdown,OptimizationRanking,CashflowChart}.tsx
    Disclaimer.tsx
  lib/
    utils/{money.ts,rounding.ts}
    constants/rateMaster/{types.ts,2026.ts,index.ts}
    calc/{salaryIncome,socialInsurance,bonusSocialInsurance,incomeTax,residentTax,
          idecoPlus,taxSaving,corporateTax,simulator,optimizer}.ts
    validation/schema.ts
    state/store.ts                             # zustand: shared input across pages
  types/{input.ts,result.ts}
```

---

## Task 1: Project scaffold

**Files:**
- Create: project root files via `create-next-app`, then `vitest.config.ts`, `package.json` (scripts)

- [ ] **Step 1: Scaffold Next.js app in current empty dir**

Run:
```bash
npx --yes create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```
If it refuses on a non-empty dir (git/docs present), scaffold in a temp dir and move files:
```bash
npx --yes create-next-app@latest .nextapp --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack \
  && cp -R .nextapp/. . && rm -rf .nextapp
```

- [ ] **Step 2: Install runtime + dev deps**

Run:
```bash
npm install decimal.js zod react-hook-form @hookform/resolvers recharts zustand
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Add vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", globals: true },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

- [ ] **Step 4: Add test script**

In `package.json` `"scripts"`, add: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 5: Smoke test config**

Create `src/lib/utils/_smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";
describe("smoke", () => { it("runs", () => { expect(1 + 1).toBe(2); }); });
```
Run: `npm test`
Expected: PASS (1 test). Then delete `_smoke.test.ts`.

- [ ] **Step 6: Commit**
```bash
git add -A && git commit -m "chore: scaffold Next.js app with vitest"
```

---

## Task 2: Money & rounding utilities

**Files:**
- Create: `src/lib/utils/money.ts`, `src/lib/utils/rounding.ts`
- Test: `src/lib/utils/rounding.test.ts`

**Interfaces:**
- Produces:
  - `money.ts`: `D(v: number | string | Decimal): Decimal`, `yen(v: Decimal | number): number` (rounds to int, half-up), `sum(...vals: (Decimal|number)[]): Decimal`.
  - `rounding.ts`: `floorTo(value: Decimal|number, unit: number): number` (e.g. 1000 で切り捨て), `roundHalfDownAtHalf(value: Decimal|number): number` (協会けんぽ被保険者折半: 50銭以下切捨/50銭超切上), `roundHalfUp(value: Decimal|number): number`.

- [ ] **Step 1: Write failing tests**

Create `src/lib/utils/rounding.test.ts`:
```ts
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
```

- [ ] **Step 2: Run, expect FAIL** — `npm test rounding` → FAIL (module not found).

- [ ] **Step 3: Implement**

Create `src/lib/utils/money.ts`:
```ts
import Decimal from "decimal.js";
export type Num = number | string | Decimal;
export const D = (v: Num): Decimal => new Decimal(v);
export const yen = (v: Num): number => new Decimal(v).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
export const sum = (...vals: Num[]): Decimal => vals.reduce<Decimal>((a, b) => a.plus(b), new Decimal(0));
```

Create `src/lib/utils/rounding.ts`:
```ts
import Decimal from "decimal.js";
import { D, Num } from "./money";

export const floorTo = (value: Num, unit: number): number =>
  D(value).dividedBy(unit).floor().times(unit).toNumber();

export const roundHalfUp = (value: Num): number =>
  D(value).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();

// 協会けんぽ被保険者折半: 端数50銭以下は切捨、50銭超は切上
export const roundHalfDownAtHalf = (value: Num): number => {
  const v = D(value);
  const frac = v.minus(v.floor());
  return frac.lessThanOrEqualTo(0.5) ? v.floor().toNumber() : v.floor().plus(1).toNumber();
};
```

- [ ] **Step 4: Run, expect PASS** — `npm test rounding`

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: money and rounding utils"`

---

## Task 3: Input & result types

**Files:**
- Create: `src/types/input.ts`, `src/types/result.ts`

**Interfaces:**
- Produces all types consumed by calc + UI tasks (exact shapes below).

- [ ] **Step 1: Create `src/types/input.ts`**
```ts
export type BasicInput = {
  prefecture: string;        // MVP: "東京"
  age: number;
  hasCareInsurance: boolean; // 自動判定 (40<=age<65) を保持
  dependents: number;        // 一般扶養親族数(16歳以上想定の概算)
  spouseDeduction: boolean;  // 配偶者控除(38万)を適用するか
  simulationYear: number;    // 2026
};

export type EmployeeInput = {
  annualSalary: number;        // 表示用(monthly*12+bonus と一致させる)
  monthlySalary: number;
  annualBonus: number;
  bonusCount: number;
  rentSubsidyAnnual: number;
  employeeIdecoMonthly: number;
  companyDcMonthly: number;
};

export type CorporateInput = {
  preSalaryProfit: number;        // 役員報酬支給前利益
  monthlyDirectorSalary: number;
  fixedBonusAnnual: number;       // 事前確定届出給与 年額
  fixedBonusCount: number;        // 0..3
  fixedBonusMonths: number[];
  corporateTaxRate: number;       // 0..1 (既定 0.30)
};

export type TaxSavingInput = {
  companyHousingEnabled: boolean;
  monthlyRent: number;
  companyRentShareRate: number;   // 0..1
  personalRentShareRate: number;  // 0..1
  idecoPlusEnabled: boolean;
  idecoPlusCompanyMonthly: number;
  idecoPlusPersonalMonthly: number;
  smallBusinessMutualMonthly: number;
  businessSafetyMutualAnnual: number;
  travelAllowanceEnabled: boolean;
  travelDaysPerMonth: number;
  travelAllowancePerDay: number;
  lifeInsuranceAnnual: number;
};

export type SimulationInput = {
  basic: BasicInput;
  employee: EmployeeInput;
  corporate: CorporateInput;
  taxSaving: TaxSavingInput;
};

export type OptimizationInput = {
  preSalaryProfit: number;
  monthlySalaryMin: number;
  monthlySalaryMax: number;
  monthlySalaryStep: number;
  bonusMin: number;
  bonusMax: number;
  bonusStep: number;
};
```

- [ ] **Step 2: Create `src/types/result.ts`**
```ts
export type SocialInsuranceResult = {
  standardMonthly: number;
  monthlyEmployee: number;
  monthlyCompany: number;
  bonusEmployee: number;
  bonusCompany: number;
  annualEmployee: number;       // monthly*12 + bonus (本人)
  annualCompany: number;        // monthly*12 + bonus (会社)
  breakdown: { health: number; care: number; pension: number }; // 月額本人内訳
  treatedAsMonthly: boolean;    // 賞与年4回以上で報酬扱いにしたか
};

export type IncomeTaxResult = {
  taxable: number;
  base: number;            // 所得税(復興税前)
  reconstruction: number;  // 復興特別所得税
  total: number;
  marginalRate: number;    // 限界税率(復興税前)
};

export type ResidentTaxResult = {
  taxable: number;
  incomeLevy: number;  // 所得割
  perCapita: number;   // 均等割
  total: number;
};

export type IdecoPlusResult = {
  companyAnnual: number;
  personalAnnual: number;
  corporateTaxSaving: number;
  personalIncomeTaxSaving: number;
  personalResidentTaxSaving: number;
  socialInsuranceSaving: number; // 常に 0
};

export type TaxSavingResult = {
  companyPaidRentAnnual: number;
  housingBenefit: number;
  travelAllowanceAnnual: number;
  smallBusinessMutualAnnual: number;
  businessSafetyMutualAnnual: number;
  companyDeductibleExpenses: number; // 法人損金合計(社宅会社負担+旅費+セーフティ共済)
};

export type CaseResult = {
  label: string;
  salaryIncome: number;
  employmentIncome: number;   // 給与所得(給与所得控除後)
  social: SocialInsuranceResult;
  incomeTax: IncomeTaxResult;
  residentTax: ResidentTaxResult;
  ideco: IdecoPlusResult;
  taxSaving: TaxSavingResult;
  cashNet: number;
  effectiveNet: number;
  futureAssetNet: number;
  corporate?: {
    profitBeforeTax: number;
    corporateTax: number;
    remainingCash: number;
  };
  totalOwnerCash: number; // 会社員=effectiveNet, 法人=effectiveNet+remainingCash
};

export type DifferenceResult = {
  salaryIncome: number;
  socialEmployee: number;
  socialCompany: number;
  incomeTax: number;
  residentTax: number;
  corporateTax: number;
  cashNet: number;
  effectiveNet: number;
  totalOwnerCash: number; // corporate - employee
};

export type OptimizationResult = {
  monthlyDirectorSalary: number;
  fixedBonusAnnual: number;
  effectiveNet: number;
  corporateRemainingCash: number;
  totalOwnerCash: number;
  score: number;
};

export type SimulationResult = {
  employee: CaseResult;
  corporate: CaseResult;
  difference: DifferenceResult;
  optimization?: OptimizationResult[];
};
```

- [ ] **Step 3: Typecheck** — Run `npx tsc --noEmit` → no errors from these files.

- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: input and result types"`

---

## Task 4: Rate master (2026) + resolver + standard remuneration grades

**Files:**
- Create: `src/lib/constants/rateMaster/types.ts`, `src/lib/constants/rateMaster/2026.ts`, `src/lib/constants/rateMaster/index.ts`
- Test: `src/lib/constants/rateMaster/rateMaster.test.ts`

**Interfaces:**
- Produces:
  - `RateMaster` type.
  - `getRateMaster(year: number): RateMaster`.
  - `StandardRemunerationGrade = { grade: number; pensionGrade: number; min: number; max: number | null; standardMonthly: number }`.
  - On `socialInsurance`: `healthRate, childCareRate, careRate, pensionRate, bonusPensionCapPerMonth, bonusHealthCapAnnual, bonusCountThreshold, grades`.
  - `incomeTax`: `brackets: { upTo: number|null; rate: number; deduction: number }[]`, `reconstructionRate`, plus deduction helper params.
  - `residentTax`: `rate, perCapita, basicDeduction`.
  - `deductions`: `salaryDeductionBands`, `basicDeductionBands`, `residentBasicDeduction`, `spouseDeduction`, `dependentDeduction`.

- [ ] **Step 1: Write failing test**

Create `src/lib/constants/rateMaster/rateMaster.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getRateMaster } from "./index";

describe("getRateMaster", () => {
  const m = getRateMaster(2026);
  it("has 2026 social insurance rates", () => {
    expect(m.socialInsurance.healthRate).toBe(0.0985);
    expect(m.socialInsurance.childCareRate).toBe(0.0023);
    expect(m.socialInsurance.careRate).toBe(0.0162);
    expect(m.socialInsurance.pensionRate).toBe(0.183);
  });
  it("grades are sorted and cover wide range", () => {
    const g = m.socialInsurance.grades;
    expect(g.length).toBeGreaterThanOrEqual(50);
    expect(g[0].min).toBe(0);
    expect(g[g.length - 1].max).toBeNull();
    for (let i = 1; i < g.length; i++) expect(g[i].standardMonthly).toBeGreaterThan(g[i - 1].standardMonthly);
  });
  it("bonus caps", () => {
    expect(m.socialInsurance.bonusPensionCapPerMonth).toBe(1_500_000);
    expect(m.socialInsurance.bonusHealthCapAnnual).toBe(5_730_000);
  });
  it("throws for unknown year", () => expect(() => getRateMaster(1999)).toThrow());
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Create `src/lib/constants/rateMaster/types.ts`**
```ts
export type StandardRemunerationGrade = {
  grade: number;        // 健康保険等級
  pensionGrade: number; // 厚生年金等級 (範囲外は 0)
  min: number;
  max: number | null;
  standardMonthly: number;
};

export type TaxBand = { upTo: number | null; rate: number; deduction: number };
export type DeductionBand = { upTo: number | null; compute: (income: number) => number };

export type RateMaster = {
  year: number;
  socialInsurance: {
    healthRate: number;
    childCareRate: number;
    careRate: number;
    pensionRate: number;
    bonusPensionCapPerMonth: number;
    bonusHealthCapAnnual: number;
    bonusCountThreshold: number; // この回数以上で報酬扱い
    grades: StandardRemunerationGrade[];
  };
  incomeTax: {
    brackets: TaxBand[];
    reconstructionRate: number;
  };
  residentTax: {
    rate: number;
    perCapita: number;
    basicDeduction: number;
  };
  deductions: {
    salaryDeduction: (salaryIncome: number) => number;     // 給与所得控除
    basicDeduction: (totalIncome: number) => number;       // 所得税 基礎控除(令和8年分)
    spouseDeduction: number;
    dependentDeduction: number; // 1人あたり(一般38万)
  };
};
```

- [ ] **Step 4: Create `src/lib/constants/rateMaster/2026.ts`**

> 出典前提（概算・令和8年分想定）: 協会けんぽ東京 2026 = 健保 9.85% / 子育て支援金 0.23% / 介護 1.62% / 厚年 18.3%。給与所得控除は令和7年改正後（最低保障 65 万）。基礎控除は令和7年改正の令和7・8年分上乗せ特例を反映。所得税率は超過累進(現行)。住民税 所得割 10%・基礎控除 43 万・均等割 5,000 円(森林環境税含む)。正式値確定後はこのファイルを差し替える。

```ts
import type { RateMaster, StandardRemunerationGrade } from "./types";

// 健康保険 標準報酬月額 等級表(区分のみ・固定値)。厚生年金は等級1=健保等級4(88,000)〜上限。
// standardMonthly と境界(min,max)は協会けんぽの区分定義に基づく。
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
  pensionGrade: i >= 3 && i <= 34 ? i - 2 : 0, // 厚年は健保等級4(88,000)から等級1、上限 第32級(650,000)
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
```

- [ ] **Step 5: Create `src/lib/constants/rateMaster/index.ts`**
```ts
import type { RateMaster } from "./types";
import { rateMaster2026 } from "./2026";

const REGISTRY: Record<number, RateMaster> = { 2026: rateMaster2026 };

export function getRateMaster(year: number): RateMaster {
  const m = REGISTRY[year];
  if (!m) throw new Error(`料率マスタが未登録の年度です: ${year}`);
  return m;
}
export type { RateMaster, StandardRemunerationGrade } from "./types";
```

- [ ] **Step 6: Run, expect PASS** — `npm test rateMaster`

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: 2026 rate master with generated remuneration grades"`

---

## Task 5: Monthly social insurance

**Files:**
- Create: `src/lib/calc/socialInsurance.ts`
- Test: `src/lib/calc/socialInsurance.test.ts`

**Interfaces:**
- Consumes: `getRateMaster`, `roundHalfDownAtHalf`, `D`.
- Produces:
  - `findGrade(monthlySalary: number, master: RateMaster): StandardRemunerationGrade`.
  - `calcMonthlySocialInsurance(params: { monthlySalary: number; age: number; year: number }): { standardMonthly: number; monthlyEmployee: number; monthlyCompany: number; breakdown: { health: number; care: number; pension: number } }`.

- [ ] **Step 1: Write failing test**
```ts
import { describe, it, expect } from "vitest";
import { findGrade, calcMonthlySocialInsurance } from "./socialInsurance";
import { getRateMaster } from "@/lib/constants/rateMaster";

const m = getRateMaster(2026);

describe("findGrade", () => {
  it("低額は最下等級", () => expect(findGrade(50_000, m).standardMonthly).toBe(58_000));
  it("300,000 は標準報酬 300,000 等級", () => expect(findGrade(300_000, m).standardMonthly).toBe(300_000));
  it("超高額は最上等級", () => expect(findGrade(5_000_000, m).standardMonthly).toBe(1_390_000));
});

describe("calcMonthlySocialInsurance", () => {
  it("40歳未満は介護なし", () => {
    const r = calcMonthlySocialInsurance({ monthlySalary: 300_000, age: 35, year: 2026 });
    expect(r.standardMonthly).toBe(300_000);
    expect(r.breakdown.care).toBe(0);
    // 健保本人 = 300000*(0.0985+0.0023)/2 = 15120
    expect(r.breakdown.health).toBe(15_120);
    // 厚年本人 = 300000*0.183/2 = 27450
    expect(r.breakdown.pension).toBe(27_450);
    expect(r.monthlyEmployee).toBe(15_120 + 27_450);
    expect(r.monthlyCompany).toBe(r.monthlyEmployee);
  });
  it("40〜65歳は介護あり", () => {
    const r = calcMonthlySocialInsurance({ monthlySalary: 300_000, age: 45, year: 2026 });
    // 介護本人 = 300000*0.0162/2 = 2430
    expect(r.breakdown.care).toBe(2_430);
    expect(r.monthlyEmployee).toBe(15_120 + 2_430 + 27_450);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `src/lib/calc/socialInsurance.ts`**
```ts
import { getRateMaster, type RateMaster, type StandardRemunerationGrade } from "@/lib/constants/rateMaster";
import { D } from "@/lib/utils/money";
import { roundHalfDownAtHalf } from "@/lib/utils/rounding";

export function findGrade(monthlySalary: number, master: RateMaster): StandardRemunerationGrade {
  const g = master.socialInsurance.grades.find(
    (row) => monthlySalary >= row.min && (row.max === null || monthlySalary < row.max),
  );
  if (!g) throw new Error(`等級が見つかりません: ${monthlySalary}`);
  return g;
}

export function calcMonthlySocialInsurance(params: { monthlySalary: number; age: number; year: number }) {
  const m = getRateMaster(params.year);
  const si = m.socialInsurance;
  const grade = findGrade(params.monthlySalary, m);
  const sm = grade.standardMonthly;
  const hasCare = params.age >= 40 && params.age < 65;

  const health = roundHalfDownAtHalf(D(sm).times(si.healthRate + si.childCareRate).dividedBy(2));
  const care = hasCare ? roundHalfDownAtHalf(D(sm).times(si.careRate).dividedBy(2)) : 0;
  const pension = grade.pensionGrade > 0 ? roundHalfDownAtHalf(D(sm).times(si.pensionRate).dividedBy(2)) : 0;

  const monthlyEmployee = health + care + pension;
  return {
    standardMonthly: sm,
    monthlyEmployee,
    monthlyCompany: monthlyEmployee,
    breakdown: { health, care, pension },
  };
}
```

> 注: 厚生年金は標準報酬月額 88,000〜650,000 の範囲（pensionGrade>0）でのみ賦課。範囲外（最下位・最上位の健保専用等級）では pension=0 とする概算。

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: monthly social insurance calc"`

---

## Task 6: Bonus social insurance

**Files:**
- Create: `src/lib/calc/bonusSocialInsurance.ts`
- Test: `src/lib/calc/bonusSocialInsurance.test.ts`

**Interfaces:**
- Consumes: `getRateMaster`, `floorTo`, `roundHalfDownAtHalf`, `D`.
- Produces:
  - `calcBonusSocialInsurance(params: { bonusAmount: number; age: number; year: number; remainingHealthBonusCap: number; pensionMonthlyCapRemaining?: number }): { standardBonus: number; employee: number; company: number; health: number; care: number; pension: number; healthCapUsed: number }`.
  - `calcAnnualBonusSocialInsurance(params: { bonuses: number[]; age: number; year: number }): { employee: number; company: number }` — 複数賞与を順次処理し健保年度累計上限を消費。

- [ ] **Step 1: Write failing test**
```ts
import { describe, it, expect } from "vitest";
import { calcBonusSocialInsurance, calcAnnualBonusSocialInsurance } from "./bonusSocialInsurance";

describe("calcBonusSocialInsurance", () => {
  it("標準賞与額は1000円未満切り捨て・40歳未満は介護0", () => {
    const r = calcBonusSocialInsurance({ bonusAmount: 1_234_567, age: 35, year: 2026, remainingHealthBonusCap: 5_730_000 });
    expect(r.standardBonus).toBe(1_234_000);
    expect(r.care).toBe(0);
    // 健保本人 = 1234000*(0.1008)/2 = 62193.6 → 62194(50銭超切上)
    expect(r.health).toBe(62_194);
    // 厚年本人 = 1234000*0.183/2 = 112911 → 112911
    expect(r.pension).toBe(112_911);
  });
  it("厚年は月150万上限", () => {
    const r = calcBonusSocialInsurance({ bonusAmount: 3_000_000, age: 35, year: 2026, remainingHealthBonusCap: 5_730_000 });
    // 厚年本人 = 1500000*0.183/2 = 137250
    expect(r.pension).toBe(137_250);
  });
});

describe("calcAnnualBonusSocialInsurance", () => {
  it("健保は年度累計573万上限を複数賞与で消費", () => {
    const r = calcAnnualBonusSocialInsurance({ bonuses: [4_000_000, 4_000_000], age: 35, year: 2026 });
    // 2回目の健保対象は 5,730,000-4,000,000 = 1,730,000 まで
    // 健保本人 = (4,000,000 + 1,730,000)*0.1008/2 = 288,792
    expect(r.employee).toBeGreaterThan(0);
    expect(r.company).toBe(r.employee);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `src/lib/calc/bonusSocialInsurance.ts`**
```ts
import { getRateMaster } from "@/lib/constants/rateMaster";
import { D } from "@/lib/utils/money";
import { floorTo, roundHalfDownAtHalf } from "@/lib/utils/rounding";

export function calcBonusSocialInsurance(params: {
  bonusAmount: number; age: number; year: number; remainingHealthBonusCap: number;
}) {
  const m = getRateMaster(params.year);
  const si = m.socialInsurance;
  const standardBonus = floorTo(params.bonusAmount, 1000);
  const hasCare = params.age >= 40 && params.age < 65;

  const healthBase = Math.min(standardBonus, Math.max(0, params.remainingHealthBonusCap));
  const pensionBase = Math.min(standardBonus, si.bonusPensionCapPerMonth);

  const health = roundHalfDownAtHalf(D(healthBase).times(si.healthRate + si.childCareRate).dividedBy(2));
  const care = hasCare ? roundHalfDownAtHalf(D(healthBase).times(si.careRate).dividedBy(2)) : 0;
  const pension = roundHalfDownAtHalf(D(pensionBase).times(si.pensionRate).dividedBy(2));

  const employee = health + care + pension;
  return { standardBonus, employee, company: employee, health, care, pension, healthCapUsed: healthBase };
}

export function calcAnnualBonusSocialInsurance(params: { bonuses: number[]; age: number; year: number }) {
  const m = getRateMaster(params.year);
  let remaining = m.socialInsurance.bonusHealthCapAnnual;
  let employee = 0;
  for (const bonus of params.bonuses) {
    if (bonus <= 0) continue;
    const r = calcBonusSocialInsurance({ bonusAmount: bonus, age: params.age, year: params.year, remainingHealthBonusCap: remaining });
    remaining = Math.max(0, remaining - r.healthCapUsed);
    employee += r.employee;
  }
  return { employee, company: employee };
}
```

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: bonus social insurance with annual health cap"`

---

## Task 7: Salary income (給与所得控除)

**Files:**
- Create: `src/lib/calc/salaryIncome.ts`
- Test: `src/lib/calc/salaryIncome.test.ts`

**Interfaces:**
- Consumes: `getRateMaster`.
- Produces: `calcEmploymentIncome(salaryIncome: number, year: number): { salaryDeduction: number; employmentIncome: number }`.

- [ ] **Step 1: Write failing test**
```ts
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
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `src/lib/calc/salaryIncome.ts`**
```ts
import { getRateMaster } from "@/lib/constants/rateMaster";

export function calcEmploymentIncome(salaryIncome: number, year: number) {
  const m = getRateMaster(year);
  const salaryDeduction = Math.floor(m.deductions.salaryDeduction(salaryIncome));
  const employmentIncome = Math.max(0, salaryIncome - salaryDeduction);
  return { salaryDeduction, employmentIncome };
}
```

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: employment income (salary deduction)"`

---

## Task 8: Income tax

**Files:**
- Create: `src/lib/calc/incomeTax.ts`
- Test: `src/lib/calc/incomeTax.test.ts`

**Interfaces:**
- Consumes: `getRateMaster`, `D`.
- Produces:
  - `progressiveIncomeTax(taxable: number, year: number): { base: number; marginalRate: number }`.
  - `calcIncomeTax(params: { employmentIncome: number; socialInsurance: number; idecoPersonalAnnual: number; smallBusinessMutualAnnual: number; spouseDeduction: boolean; dependents: number; year: number }): IncomeTaxResult`.

- [ ] **Step 1: Write failing test**
```ts
import { describe, it, expect } from "vitest";
import { progressiveIncomeTax, calcIncomeTax } from "./incomeTax";

describe("progressiveIncomeTax", () => {
  it("課税所得300万: 300万*10%-97,500 = 202,500", () => {
    const r = progressiveIncomeTax(3_000_000, 2026);
    expect(r.base).toBe(202_500);
    expect(r.marginalRate).toBe(0.1);
  });
  it("0なら0", () => expect(progressiveIncomeTax(0, 2026).base).toBe(0));
});

describe("calcIncomeTax", () => {
  it("復興税2.1%を加算しtotalを返す", () => {
    const r = calcIncomeTax({
      employmentIncome: 4_360_000, socialInsurance: 900_000, idecoPersonalAnnual: 0,
      smallBusinessMutualAnnual: 0, spouseDeduction: false, dependents: 0, year: 2026,
    });
    expect(r.taxable).toBeGreaterThan(0);
    expect(r.total).toBe(Math.floor(r.base * 1.021));
    expect(r.reconstruction).toBe(r.total - r.base);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `src/lib/calc/incomeTax.ts`**
```ts
import { getRateMaster } from "@/lib/constants/rateMaster";
import { D } from "@/lib/utils/money";
import type { IncomeTaxResult } from "@/types/result";

export function progressiveIncomeTax(taxable: number, year: number): { base: number; marginalRate: number } {
  const m = getRateMaster(year);
  if (taxable <= 0) return { base: 0, marginalRate: m.incomeTax.brackets[0].rate };
  const band = m.incomeTax.brackets.find((b) => b.upTo === null || taxable <= b.upTo)!;
  const base = Math.floor(D(taxable).times(band.rate).minus(band.deduction).toNumber());
  return { base: Math.max(0, base), marginalRate: band.rate };
}

export function calcIncomeTax(params: {
  employmentIncome: number; socialInsurance: number; idecoPersonalAnnual: number;
  smallBusinessMutualAnnual: number; spouseDeduction: boolean; dependents: number; year: number;
}): IncomeTaxResult {
  const m = getRateMaster(params.year);
  const d = m.deductions;
  const basic = d.basicDeduction(params.employmentIncome);
  const deductions =
    basic + params.socialInsurance + params.idecoPersonalAnnual + params.smallBusinessMutualAnnual +
    (params.spouseDeduction ? d.spouseDeduction : 0) + params.dependents * d.dependentDeduction;
  const taxable = Math.max(0, Math.floor((params.employmentIncome - deductions) / 1000) * 1000);
  const { base, marginalRate } = progressiveIncomeTax(taxable, params.year);
  const total = Math.floor(D(base).times(1 + m.incomeTax.reconstructionRate).toNumber());
  return { taxable, base, reconstruction: total - base, total, marginalRate };
}
```

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: income tax with reconstruction surtax"`

---

## Task 9: Resident tax

**Files:**
- Create: `src/lib/calc/residentTax.ts`
- Test: `src/lib/calc/residentTax.test.ts`

**Interfaces:**
- Consumes: `getRateMaster`, `D`.
- Produces: `calcResidentTax(params: { employmentIncome: number; socialInsurance: number; idecoPersonalAnnual: number; smallBusinessMutualAnnual: number; spouseDeduction: boolean; dependents: number; year: number }): ResidentTaxResult`.

- [ ] **Step 1: Write failing test**
```ts
import { describe, it, expect } from "vitest";
import { calcResidentTax } from "./residentTax";

describe("calcResidentTax", () => {
  it("所得割10%+均等割。課税標準は給与所得-控除", () => {
    const r = calcResidentTax({
      employmentIncome: 4_360_000, socialInsurance: 900_000, idecoPersonalAnnual: 0,
      smallBusinessMutualAnnual: 0, spouseDeduction: false, dependents: 0, year: 2026,
    });
    // taxable = 4,360,000 - 430,000(基礎) - 900,000 = 3,030,000
    expect(r.taxable).toBe(3_030_000);
    expect(r.incomeLevy).toBe(303_000);
    expect(r.perCapita).toBe(5_000);
    expect(r.total).toBe(308_000);
  });
  it("課税標準は0未満にならない", () => {
    const r = calcResidentTax({
      employmentIncome: 300_000, socialInsurance: 0, idecoPersonalAnnual: 0,
      smallBusinessMutualAnnual: 0, spouseDeduction: false, dependents: 0, year: 2026,
    });
    expect(r.incomeLevy).toBe(0);
    expect(r.total).toBe(5_000);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `src/lib/calc/residentTax.ts`**
```ts
import { getRateMaster } from "@/lib/constants/rateMaster";
import { D } from "@/lib/utils/money";
import type { ResidentTaxResult } from "@/types/result";

export function calcResidentTax(params: {
  employmentIncome: number; socialInsurance: number; idecoPersonalAnnual: number;
  smallBusinessMutualAnnual: number; spouseDeduction: boolean; dependents: number; year: number;
}): ResidentTaxResult {
  const m = getRateMaster(params.year);
  const rt = m.residentTax;
  const deductions =
    rt.basicDeduction + params.socialInsurance + params.idecoPersonalAnnual +
    params.smallBusinessMutualAnnual +
    (params.spouseDeduction ? 330_000 : 0) + params.dependents * 330_000; // 住民税控除は33万
  const taxable = Math.max(0, Math.floor((params.employmentIncome - deductions) / 1000) * 1000);
  const incomeLevy = Math.floor(D(taxable).times(rt.rate).toNumber());
  const perCapita = incomeLevy > 0 || taxable > 0 ? rt.perCapita : rt.perCapita;
  return { taxable, incomeLevy, perCapita, total: incomeLevy + perCapita };
}
```

> 注: 住民税の配偶者・扶養控除は 33 万（所得税 38 万より低い）として概算。均等割は所得が一定以下なら非課税となる自治体差があるが MVP では一律課税の概算。

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: resident tax calc"`

---

## Task 10: iDeCo+

**Files:**
- Create: `src/lib/calc/idecoPlus.ts`
- Test: `src/lib/calc/idecoPlus.test.ts`

**Interfaces:**
- Consumes: none (pure).
- Produces:
  - `validateIdecoPlus(companyMonthly: number, personalMonthly: number): void` — 合計 5,000〜23,000・1,000 円単位。0+0 は許容。
  - `calcIdecoPlus(params: { companyMonthly: number; personalMonthly: number; corporateTaxRate: number; marginalIncomeTaxRate: number }): IdecoPlusResult`.

- [ ] **Step 1: Write failing test**
```ts
import { describe, it, expect } from "vitest";
import { calcIdecoPlus, validateIdecoPlus } from "./idecoPlus";

describe("validateIdecoPlus", () => {
  it("合計23,000超で例外", () => expect(() => validateIdecoPlus(20_000, 5_000)).toThrow());
  it("0〜5,000未満で例外", () => expect(() => validateIdecoPlus(0, 3_000)).toThrow());
  it("1,000円単位でない場合例外", () => expect(() => validateIdecoPlus(5_500, 0)).toThrow());
  it("0+0は許容", () => expect(() => validateIdecoPlus(0, 0)).not.toThrow());
});

describe("calcIdecoPlus", () => {
  it("会社分は法人税率, 個人分は限界税率+住民税10%, 社保削減は0", () => {
    const r = calcIdecoPlus({ companyMonthly: 10_000, personalMonthly: 10_000, corporateTaxRate: 0.3, marginalIncomeTaxRate: 0.2 });
    expect(r.companyAnnual).toBe(120_000);
    expect(r.personalAnnual).toBe(120_000);
    expect(r.corporateTaxSaving).toBe(36_000);
    expect(r.personalIncomeTaxSaving).toBe(24_000);
    expect(r.personalResidentTaxSaving).toBe(12_000);
    expect(r.socialInsuranceSaving).toBe(0);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `src/lib/calc/idecoPlus.ts`**
```ts
import { D } from "@/lib/utils/money";
import type { IdecoPlusResult } from "@/types/result";

export function validateIdecoPlus(companyMonthly: number, personalMonthly: number): void {
  const total = companyMonthly + personalMonthly;
  if (total === 0) return;
  if (total > 23_000) throw new Error("iDeCo+の合計掛金は月額23,000円以下にしてください");
  if (total < 5_000) throw new Error("iDeCo+の合計掛金は月額5,000円以上にしてください");
  if (companyMonthly % 1000 !== 0 || personalMonthly % 1000 !== 0)
    throw new Error("iDeCo+の掛金は1,000円単位にしてください");
}

export function calcIdecoPlus(params: {
  companyMonthly: number; personalMonthly: number; corporateTaxRate: number; marginalIncomeTaxRate: number;
}): IdecoPlusResult {
  const companyAnnual = params.companyMonthly * 12;
  const personalAnnual = params.personalMonthly * 12;
  return {
    companyAnnual,
    personalAnnual,
    corporateTaxSaving: D(companyAnnual).times(params.corporateTaxRate).toNumber(),
    personalIncomeTaxSaving: D(personalAnnual).times(params.marginalIncomeTaxRate).toNumber(),
    personalResidentTaxSaving: D(personalAnnual).times(0.1).toNumber(),
    socialInsuranceSaving: 0,
  };
}
```

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: iDeCo+ calc and validation"`

---

## Task 11: Tax-saving measures (housing / travel / mutuals)

**Files:**
- Create: `src/lib/calc/taxSaving.ts`
- Test: `src/lib/calc/taxSaving.test.ts`

**Interfaces:**
- Consumes: `TaxSavingInput`, `D`.
- Produces: `calcTaxSaving(input: TaxSavingInput): TaxSavingResult`.

- [ ] **Step 1: Write failing test**
```ts
import { describe, it, expect } from "vitest";
import { calcTaxSaving } from "./taxSaving";
import type { TaxSavingInput } from "@/types/input";

const base: TaxSavingInput = {
  companyHousingEnabled: true, monthlyRent: 200_000, companyRentShareRate: 0.5, personalRentShareRate: 0.5,
  idecoPlusEnabled: false, idecoPlusCompanyMonthly: 0, idecoPlusPersonalMonthly: 0,
  smallBusinessMutualMonthly: 30_000, businessSafetyMutualAnnual: 600_000,
  travelAllowanceEnabled: true, travelDaysPerMonth: 5, travelAllowancePerDay: 5_000, lifeInsuranceAnnual: 0,
};

describe("calcTaxSaving", () => {
  it("社宅会社負担=200000*0.5*12=1,200,000, 旅費=5*5000*12=300,000", () => {
    const r = calcTaxSaving(base);
    expect(r.companyPaidRentAnnual).toBe(1_200_000);
    expect(r.housingBenefit).toBe(1_200_000);
    expect(r.travelAllowanceAnnual).toBe(300_000);
    expect(r.smallBusinessMutualAnnual).toBe(360_000);
    expect(r.businessSafetyMutualAnnual).toBe(600_000);
    // 法人損金 = 社宅会社負担 + 旅費 + セーフティ共済 = 2,100,000
    expect(r.companyDeductibleExpenses).toBe(2_100_000);
  });
  it("無効化されたら0", () => {
    const r = calcTaxSaving({ ...base, companyHousingEnabled: false, travelAllowanceEnabled: false });
    expect(r.companyPaidRentAnnual).toBe(0);
    expect(r.travelAllowanceAnnual).toBe(0);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `src/lib/calc/taxSaving.ts`**
```ts
import { D } from "@/lib/utils/money";
import type { TaxSavingInput } from "@/types/input";
import type { TaxSavingResult } from "@/types/result";

export function calcTaxSaving(input: TaxSavingInput): TaxSavingResult {
  const companyPaidRentAnnual = input.companyHousingEnabled
    ? D(input.monthlyRent).times(input.companyRentShareRate).times(12).toNumber()
    : 0;
  const travelAllowanceAnnual = input.travelAllowanceEnabled
    ? D(input.travelDaysPerMonth).times(input.travelAllowancePerDay).times(12).toNumber()
    : 0;
  const smallBusinessMutualAnnual = D(input.smallBusinessMutualMonthly).times(12).toNumber();
  const businessSafetyMutualAnnual = input.businessSafetyMutualAnnual;

  return {
    companyPaidRentAnnual,
    housingBenefit: companyPaidRentAnnual,
    travelAllowanceAnnual,
    smallBusinessMutualAnnual,
    businessSafetyMutualAnnual,
    companyDeductibleExpenses: companyPaidRentAnnual + travelAllowanceAnnual + businessSafetyMutualAnnual,
  };
}
```

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: tax-saving measures calc"`

---

## Task 12: Corporate tax

**Files:**
- Create: `src/lib/calc/corporateTax.ts`
- Test: `src/lib/calc/corporateTax.test.ts`

**Interfaces:**
- Consumes: `D`.
- Produces: `calcCorporateTax(params: { preSalaryProfit: number; directorSalaryAnnual: number; fixedBonusAnnual: number; companySocialInsurance: number; idecoPlusCompanyAnnual: number; companyDeductibleExpenses: number; corporateTaxRate: number }): { profitBeforeTax: number; corporateTax: number; remainingCash: number }`.

- [ ] **Step 1: Write failing test**
```ts
import { describe, it, expect } from "vitest";
import { calcCorporateTax } from "./corporateTax";

describe("calcCorporateTax", () => {
  it("利益=前利益-各損金, 税=max(0,利益)*率, 残=利益-税", () => {
    const r = calcCorporateTax({
      preSalaryProfit: 20_000_000, directorSalaryAnnual: 6_000_000, fixedBonusAnnual: 0,
      companySocialInsurance: 1_000_000, idecoPlusCompanyAnnual: 120_000,
      companyDeductibleExpenses: 2_000_000, corporateTaxRate: 0.3,
    });
    // 利益 = 20,000,000 - 6,000,000 - 0 - 1,000,000 - 120,000 - 2,000,000 = 10,880,000
    expect(r.profitBeforeTax).toBe(10_880_000);
    expect(r.corporateTax).toBe(3_264_000);
    expect(r.remainingCash).toBe(7_616_000);
  });
  it("赤字なら法人税0(残は赤字額)", () => {
    const r = calcCorporateTax({
      preSalaryProfit: 1_000_000, directorSalaryAnnual: 3_000_000, fixedBonusAnnual: 0,
      companySocialInsurance: 0, idecoPlusCompanyAnnual: 0, companyDeductibleExpenses: 0, corporateTaxRate: 0.3,
    });
    expect(r.corporateTax).toBe(0);
    expect(r.remainingCash).toBe(-2_000_000);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `src/lib/calc/corporateTax.ts`**
```ts
import { D } from "@/lib/utils/money";

export function calcCorporateTax(params: {
  preSalaryProfit: number; directorSalaryAnnual: number; fixedBonusAnnual: number;
  companySocialInsurance: number; idecoPlusCompanyAnnual: number; companyDeductibleExpenses: number;
  corporateTaxRate: number;
}) {
  const profitBeforeTax = D(params.preSalaryProfit)
    .minus(params.directorSalaryAnnual)
    .minus(params.fixedBonusAnnual)
    .minus(params.companySocialInsurance)
    .minus(params.idecoPlusCompanyAnnual)
    .minus(params.companyDeductibleExpenses)
    .toNumber();
  const corporateTax = D(Math.max(0, profitBeforeTax)).times(params.corporateTaxRate).toNumber();
  return { profitBeforeTax, corporateTax, remainingCash: profitBeforeTax - corporateTax };
}
```

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: corporate tax calc"`

---

## Task 13: Simulator (employee + corporate cases + difference)

**Files:**
- Create: `src/lib/calc/simulator.ts`
- Test: `src/lib/calc/simulator.test.ts`

**Interfaces:**
- Consumes: all calc modules + types.
- Produces:
  - `simulateEmployeeCase(input: SimulationInput): CaseResult`.
  - `simulateCorporateCase(input: SimulationInput): CaseResult`.
  - `simulate(input: SimulationInput): SimulationResult` (employee, corporate, difference).
  - helper `bonusListFor(annualBonus, count): number[]` (均等割付).

- [ ] **Step 1: Write failing test**
```ts
import { describe, it, expect } from "vitest";
import { simulate } from "./simulator";
import type { SimulationInput } from "@/types/input";

const input: SimulationInput = {
  basic: { prefecture: "東京", age: 40, hasCareInsurance: true, dependents: 0, spouseDeduction: false, simulationYear: 2026 },
  employee: { annualSalary: 6_000_000, monthlySalary: 400_000, annualBonus: 1_200_000, bonusCount: 2, rentSubsidyAnnual: 0, employeeIdecoMonthly: 0, companyDcMonthly: 0 },
  corporate: { preSalaryProfit: 12_000_000, monthlyDirectorSalary: 500_000, fixedBonusAnnual: 0, fixedBonusCount: 0, fixedBonusMonths: [], corporateTaxRate: 0.3 },
  taxSaving: { companyHousingEnabled: false, monthlyRent: 0, companyRentShareRate: 0, personalRentShareRate: 0, idecoPlusEnabled: false, idecoPlusCompanyMonthly: 0, idecoPlusPersonalMonthly: 0, smallBusinessMutualMonthly: 0, businessSafetyMutualAnnual: 0, travelAllowanceEnabled: false, travelDaysPerMonth: 0, travelAllowancePerDay: 0, lifeInsuranceAnnual: 0 },
};

describe("simulate", () => {
  const r = simulate(input);
  it("会社員の現金手取りは正で給与収入より小さい", () => {
    expect(r.employee.cashNet).toBeGreaterThan(0);
    expect(r.employee.cashNet).toBeLessThan(r.employee.salaryIncome);
  });
  it("法人は法人残キャッシュと合計を返す", () => {
    expect(r.corporate.corporate).toBeDefined();
    expect(r.corporate.totalOwnerCash).toBe(r.corporate.effectiveNet + r.corporate.corporate!.remainingCash);
  });
  it("差額(法人合計-会社員)が計算される", () => {
    expect(r.difference.totalOwnerCash).toBe(r.corporate.totalOwnerCash - r.employee.totalOwnerCash);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `src/lib/calc/simulator.ts`**
```ts
import type { SimulationInput } from "@/types/input";
import type { CaseResult, DifferenceResult, SimulationResult, SocialInsuranceResult } from "@/types/result";
import { calcMonthlySocialInsurance } from "./socialInsurance";
import { calcAnnualBonusSocialInsurance, calcBonusSocialInsurance } from "./bonusSocialInsurance";
import { calcEmploymentIncome } from "./salaryIncome";
import { calcIncomeTax, progressiveIncomeTax } from "./incomeTax";
import { calcResidentTax } from "./residentTax";
import { calcIdecoPlus, validateIdecoPlus } from "./idecoPlus";
import { calcTaxSaving } from "./taxSaving";
import { calcCorporateTax } from "./corporateTax";

export function bonusListFor(annualBonus: number, count: number): number[] {
  if (count <= 0 || annualBonus <= 0) return [];
  const each = Math.floor(annualBonus / count);
  return Array.from({ length: count }, () => each);
}

function buildSocial(params: {
  monthlySalary: number; annualBonus: number; bonusCount: number; age: number; year: number;
}): SocialInsuranceResult {
  const { monthlySalary, annualBonus, bonusCount, age, year } = params;
  const threshold = 4; // bonusCountThreshold; 年4回以上は報酬扱い
  const treatedAsMonthly = bonusCount >= threshold;
  const effectiveMonthly = treatedAsMonthly ? monthlySalary + annualBonus / 12 : monthlySalary;
  const monthly = calcMonthlySocialInsurance({ monthlySalary: effectiveMonthly, age, year });
  const bonus = treatedAsMonthly
    ? { employee: 0, company: 0 }
    : calcAnnualBonusSocialInsurance({ bonuses: bonusListFor(annualBonus, bonusCount), age, year });
  const annualEmployee = monthly.monthlyEmployee * 12 + bonus.employee;
  return {
    standardMonthly: monthly.standardMonthly,
    monthlyEmployee: monthly.monthlyEmployee,
    monthlyCompany: monthly.monthlyCompany,
    bonusEmployee: bonus.employee,
    bonusCompany: bonus.company,
    annualEmployee,
    annualCompany: annualEmployee,
    breakdown: monthly.breakdown,
    treatedAsMonthly,
  };
}

const emptyIdeco = { companyAnnual: 0, personalAnnual: 0, corporateTaxSaving: 0, personalIncomeTaxSaving: 0, personalResidentTaxSaving: 0, socialInsuranceSaving: 0 };
const emptyTaxSaving = { companyPaidRentAnnual: 0, housingBenefit: 0, travelAllowanceAnnual: 0, smallBusinessMutualAnnual: 0, businessSafetyMutualAnnual: 0, companyDeductibleExpenses: 0 };

export function simulateEmployeeCase(input: SimulationInput): CaseResult {
  const { basic, employee } = input;
  const salaryIncome = employee.monthlySalary * 12 + employee.annualBonus;
  const social = buildSocial({ monthlySalary: employee.monthlySalary, annualBonus: employee.annualBonus, bonusCount: employee.bonusCount, age: basic.age, year: basic.simulationYear });
  const { employmentIncome } = calcEmploymentIncome(salaryIncome, basic.simulationYear);
  const idecoPersonalAnnual = employee.employeeIdecoMonthly * 12;
  const incomeTax = calcIncomeTax({ employmentIncome, socialInsurance: social.annualEmployee, idecoPersonalAnnual, smallBusinessMutualAnnual: 0, spouseDeduction: basic.spouseDeduction, dependents: basic.dependents, year: basic.simulationYear });
  const residentTax = calcResidentTax({ employmentIncome, socialInsurance: social.annualEmployee, idecoPersonalAnnual, smallBusinessMutualAnnual: 0, spouseDeduction: basic.spouseDeduction, dependents: basic.dependents, year: basic.simulationYear });
  const cashNet = salaryIncome - social.annualEmployee - incomeTax.total - residentTax.total - idecoPersonalAnnual;
  const effectiveNet = cashNet + employee.rentSubsidyAnnual;
  return {
    label: "会社員", salaryIncome, employmentIncome, social, incomeTax, residentTax,
    ideco: emptyIdeco, taxSaving: emptyTaxSaving,
    cashNet, effectiveNet, futureAssetNet: effectiveNet + idecoPersonalAnnual,
    totalOwnerCash: effectiveNet,
  };
}

export function simulateCorporateCase(input: SimulationInput): CaseResult {
  const { basic, corporate, taxSaving } = input;
  const directorSalaryAnnual = corporate.monthlyDirectorSalary * 12;
  const fixedBonusAnnual = corporate.fixedBonusAnnual;
  const salaryIncome = directorSalaryAnnual + fixedBonusAnnual;

  const social = buildSocial({ monthlySalary: corporate.monthlyDirectorSalary, annualBonus: fixedBonusAnnual, bonusCount: corporate.fixedBonusCount, age: basic.age, year: basic.simulationYear });
  const { employmentIncome } = calcEmploymentIncome(salaryIncome, basic.simulationYear);

  if (taxSaving.idecoPlusEnabled) validateIdecoPlus(taxSaving.idecoPlusCompanyMonthly, taxSaving.idecoPlusPersonalMonthly);
  // 限界税率の概算: 控除前の課税所得から
  const provisionalTaxable = Math.max(0, employmentIncome - social.annualEmployee - 580_000);
  const marginalRate = progressiveIncomeTax(provisionalTaxable, basic.simulationYear).marginalRate;
  const ideco = taxSaving.idecoPlusEnabled
    ? calcIdecoPlus({ companyMonthly: taxSaving.idecoPlusCompanyMonthly, personalMonthly: taxSaving.idecoPlusPersonalMonthly, corporateTaxRate: corporate.corporateTaxRate, marginalIncomeTaxRate: marginalRate })
    : emptyIdeco;
  const ts = calcTaxSaving(taxSaving);

  const incomeTax = calcIncomeTax({ employmentIncome, socialInsurance: social.annualEmployee, idecoPersonalAnnual: ideco.personalAnnual, smallBusinessMutualAnnual: ts.smallBusinessMutualAnnual, spouseDeduction: basic.spouseDeduction, dependents: basic.dependents, year: basic.simulationYear });
  const residentTax = calcResidentTax({ employmentIncome, socialInsurance: social.annualEmployee, idecoPersonalAnnual: ideco.personalAnnual, smallBusinessMutualAnnual: ts.smallBusinessMutualAnnual, spouseDeduction: basic.spouseDeduction, dependents: basic.dependents, year: basic.simulationYear });

  const cashNet = salaryIncome - social.annualEmployee - incomeTax.total - residentTax.total - ideco.personalAnnual - ts.smallBusinessMutualAnnual;
  const effectiveNet = cashNet + ts.housingBenefit + ts.travelAllowanceAnnual + ideco.companyAnnual + ts.smallBusinessMutualAnnual;

  const corp = calcCorporateTax({
    preSalaryProfit: corporate.preSalaryProfit, directorSalaryAnnual, fixedBonusAnnual,
    companySocialInsurance: social.annualCompany, idecoPlusCompanyAnnual: ideco.companyAnnual,
    companyDeductibleExpenses: ts.companyDeductibleExpenses, corporateTaxRate: corporate.corporateTaxRate,
  });

  return {
    label: "法人役員", salaryIncome, employmentIncome, social, incomeTax, residentTax, ideco, taxSaving: ts,
    cashNet, effectiveNet, futureAssetNet: effectiveNet + ideco.personalAnnual,
    corporate: { profitBeforeTax: corp.profitBeforeTax, corporateTax: corp.corporateTax, remainingCash: corp.remainingCash },
    totalOwnerCash: effectiveNet + corp.remainingCash,
  };
}

export function simulate(input: SimulationInput): SimulationResult {
  const employee = simulateEmployeeCase(input);
  const corporate = simulateCorporateCase(input);
  const difference: DifferenceResult = {
    salaryIncome: corporate.salaryIncome - employee.salaryIncome,
    socialEmployee: corporate.social.annualEmployee - employee.social.annualEmployee,
    socialCompany: corporate.social.annualCompany - employee.social.annualCompany,
    incomeTax: corporate.incomeTax.total - employee.incomeTax.total,
    residentTax: corporate.residentTax.total - employee.residentTax.total,
    corporateTax: (corporate.corporate?.corporateTax ?? 0) - 0,
    cashNet: corporate.cashNet - employee.cashNet,
    effectiveNet: corporate.effectiveNet - employee.effectiveNet,
    totalOwnerCash: corporate.totalOwnerCash - employee.totalOwnerCash,
  };
  return { employee, corporate, difference };
}
```

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: employee/corporate simulation and difference"`

---

## Task 14: Optimizer

**Files:**
- Create: `src/lib/calc/optimizer.ts`
- Test: `src/lib/calc/optimizer.test.ts`

**Interfaces:**
- Consumes: `simulateCorporateCase`, `SimulationInput`, `OptimizationInput`, `OptimizationResult`.
- Produces: `optimize(input: SimulationInput, opt: OptimizationInput): OptimizationResult[]` (top 20 by score desc). Guards combination count <= 20,000 else throws.

- [ ] **Step 1: Write failing test**
```ts
import { describe, it, expect } from "vitest";
import { optimize } from "./optimizer";
import type { SimulationInput, OptimizationInput } from "@/types/input";

const base: SimulationInput = {
  basic: { prefecture: "東京", age: 40, hasCareInsurance: true, dependents: 0, spouseDeduction: false, simulationYear: 2026 },
  employee: { annualSalary: 0, monthlySalary: 0, annualBonus: 0, bonusCount: 0, rentSubsidyAnnual: 0, employeeIdecoMonthly: 0, companyDcMonthly: 0 },
  corporate: { preSalaryProfit: 15_000_000, monthlyDirectorSalary: 0, fixedBonusAnnual: 0, fixedBonusCount: 0, fixedBonusMonths: [], corporateTaxRate: 0.3 },
  taxSaving: { companyHousingEnabled: false, monthlyRent: 0, companyRentShareRate: 0, personalRentShareRate: 0, idecoPlusEnabled: false, idecoPlusCompanyMonthly: 0, idecoPlusPersonalMonthly: 0, smallBusinessMutualMonthly: 0, businessSafetyMutualAnnual: 0, travelAllowanceEnabled: false, travelDaysPerMonth: 0, travelAllowancePerDay: 0, lifeInsuranceAnnual: 0 },
};
const opt: OptimizationInput = { preSalaryProfit: 15_000_000, monthlySalaryMin: 200_000, monthlySalaryMax: 800_000, monthlySalaryStep: 100_000, bonusMin: 0, bonusMax: 0, bonusStep: 100_000 };

describe("optimize", () => {
  it("上位20件以内・スコア降順", () => {
    const r = optimize(base, opt);
    expect(r.length).toBeGreaterThan(0);
    expect(r.length).toBeLessThanOrEqual(20);
    for (let i = 1; i < r.length; i++) expect(r[i - 1].score).toBeGreaterThanOrEqual(r[i].score);
  });
  it("組合せ過大なら例外", () => {
    expect(() => optimize(base, { ...opt, monthlySalaryStep: 1, bonusStep: 1, bonusMax: 10_000_000 })).toThrow();
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `src/lib/calc/optimizer.ts`**
```ts
import type { SimulationInput, OptimizationInput } from "@/types/input";
import type { OptimizationResult } from "@/types/result";
import { simulateCorporateCase } from "./simulator";

const MAX_COMBOS = 20_000;

export function optimize(input: SimulationInput, opt: OptimizationInput): OptimizationResult[] {
  const salarySteps = Math.floor((opt.monthlySalaryMax - opt.monthlySalaryMin) / opt.monthlySalaryStep) + 1;
  const bonusSteps = Math.floor((opt.bonusMax - opt.bonusMin) / opt.bonusStep) + 1;
  if (salarySteps * bonusSteps > MAX_COMBOS)
    throw new Error(`組合せが多すぎます(${salarySteps * bonusSteps})。刻みを大きくしてください`);

  const results: OptimizationResult[] = [];
  for (let s = opt.monthlySalaryMin; s <= opt.monthlySalaryMax; s += opt.monthlySalaryStep) {
    for (let b = opt.bonusMin; b <= opt.bonusMax; b += opt.bonusStep) {
      const trial: SimulationInput = {
        ...input,
        corporate: {
          ...input.corporate,
          preSalaryProfit: opt.preSalaryProfit,
          monthlyDirectorSalary: s,
          fixedBonusAnnual: b,
          fixedBonusCount: b > 0 ? Math.max(1, input.corporate.fixedBonusCount) : 0,
        },
      };
      const c = simulateCorporateCase(trial);
      const remainingCash = c.corporate!.remainingCash;
      results.push({
        monthlyDirectorSalary: s, fixedBonusAnnual: b,
        effectiveNet: c.effectiveNet, corporateRemainingCash: remainingCash,
        totalOwnerCash: c.totalOwnerCash, score: c.effectiveNet + remainingCash,
      });
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 20);
}
```

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: optimization mode (top-20 ranking)"`

---

## Task 15: Zod validation schema

**Files:**
- Create: `src/lib/validation/schema.ts`
- Test: `src/lib/validation/schema.test.ts`

**Interfaces:**
- Consumes: zod, `SimulationInput`.
- Produces: `simulationSchema` (Zod object matching `SimulationInput`), `defaultInput: SimulationInput`.

- [ ] **Step 1: Write failing test**
```ts
import { describe, it, expect } from "vitest";
import { simulationSchema, defaultInput } from "./schema";

describe("simulationSchema", () => {
  it("defaultInput is valid", () => expect(simulationSchema.safeParse(defaultInput).success).toBe(true));
  it("fixedBonusCount>3 fails", () => {
    const bad = { ...defaultInput, corporate: { ...defaultInput.corporate, fixedBonusCount: 4 } };
    expect(simulationSchema.safeParse(bad).success).toBe(false);
  });
  it("iDeCo+ 合計>23000 fails", () => {
    const bad = { ...defaultInput, taxSaving: { ...defaultInput.taxSaving, idecoPlusEnabled: true, idecoPlusCompanyMonthly: 20000, idecoPlusPersonalMonthly: 5000 } };
    expect(simulationSchema.safeParse(bad).success).toBe(false);
  });
  it("smallBusinessMutualMonthly>70000 fails", () => {
    const bad = { ...defaultInput, taxSaving: { ...defaultInput.taxSaving, smallBusinessMutualMonthly: 80000 } };
    expect(simulationSchema.safeParse(bad).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `src/lib/validation/schema.ts`**
```ts
import { z } from "zod";
import type { SimulationInput } from "@/types/input";

const basic = z.object({
  prefecture: z.string().min(1),
  age: z.number().int().min(0).max(120),
  hasCareInsurance: z.boolean(),
  dependents: z.number().int().min(0).max(20),
  spouseDeduction: z.boolean(),
  simulationYear: z.number().int(),
});

const employee = z.object({
  annualSalary: z.number().min(0),
  monthlySalary: z.number().min(0),
  annualBonus: z.number().min(0),
  bonusCount: z.number().int().min(0).max(12),
  rentSubsidyAnnual: z.number().min(0),
  employeeIdecoMonthly: z.number().min(0),
  companyDcMonthly: z.number().min(0),
});

const corporate = z.object({
  preSalaryProfit: z.number(),
  monthlyDirectorSalary: z.number().min(0),
  fixedBonusAnnual: z.number().min(0),
  fixedBonusCount: z.number().int().min(0).max(3),
  fixedBonusMonths: z.array(z.number().int().min(1).max(12)),
  corporateTaxRate: z.number().min(0).max(1),
});

const taxSaving = z.object({
  companyHousingEnabled: z.boolean(),
  monthlyRent: z.number().min(0),
  companyRentShareRate: z.number().min(0).max(1),
  personalRentShareRate: z.number().min(0).max(1),
  idecoPlusEnabled: z.boolean(),
  idecoPlusCompanyMonthly: z.number().min(0),
  idecoPlusPersonalMonthly: z.number().min(0),
  smallBusinessMutualMonthly: z.number().min(0).max(70000),
  businessSafetyMutualAnnual: z.number().min(0).max(2400000),
  travelAllowanceEnabled: z.boolean(),
  travelDaysPerMonth: z.number().min(0).max(31),
  travelAllowancePerDay: z.number().min(0),
  lifeInsuranceAnnual: z.number().min(0),
}).superRefine((v, ctx) => {
  if (!v.idecoPlusEnabled) return;
  const total = v.idecoPlusCompanyMonthly + v.idecoPlusPersonalMonthly;
  if (total > 23000) ctx.addIssue({ code: "custom", message: "iDeCo+合計は月額23,000円以下" });
  if (total > 0 && total < 5000) ctx.addIssue({ code: "custom", message: "iDeCo+合計は月額5,000円以上" });
  if (v.idecoPlusCompanyMonthly % 1000 !== 0 || v.idecoPlusPersonalMonthly % 1000 !== 0)
    ctx.addIssue({ code: "custom", message: "iDeCo+は1,000円単位" });
});

export const simulationSchema = z.object({ basic, employee, corporate, taxSaving });

export const defaultInput: SimulationInput = {
  basic: { prefecture: "東京", age: 40, hasCareInsurance: true, dependents: 0, spouseDeduction: false, simulationYear: 2026 },
  employee: { annualSalary: 6_000_000, monthlySalary: 400_000, annualBonus: 1_200_000, bonusCount: 2, rentSubsidyAnnual: 0, employeeIdecoMonthly: 0, companyDcMonthly: 0 },
  corporate: { preSalaryProfit: 12_000_000, monthlyDirectorSalary: 500_000, fixedBonusAnnual: 0, fixedBonusCount: 0, fixedBonusMonths: [], corporateTaxRate: 0.3 },
  taxSaving: { companyHousingEnabled: false, monthlyRent: 200_000, companyRentShareRate: 0.5, personalRentShareRate: 0.5, idecoPlusEnabled: false, idecoPlusCompanyMonthly: 0, idecoPlusPersonalMonthly: 0, smallBusinessMutualMonthly: 0, businessSafetyMutualAnnual: 0, travelAllowanceEnabled: false, travelDaysPerMonth: 0, travelAllowancePerDay: 0, lifeInsuranceAnnual: 0 },
};
```

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: zod schema and default input"`

---

## Task 16: Shared state store + age→care auto-derivation

**Files:**
- Create: `src/lib/state/store.ts`
- Test: `src/lib/state/store.test.ts`

**Interfaces:**
- Consumes: zustand, `SimulationInput`, `defaultInput`.
- Produces: `useSimStore` with `{ input: SimulationInput; setInput(partial deep-merge); reset() }`. `deriveCareInsurance(age): boolean`.

- [ ] **Step 1: Write failing test**
```ts
import { describe, it, expect } from "vitest";
import { deriveCareInsurance } from "./store";

describe("deriveCareInsurance", () => {
  it("39歳false / 40歳true / 65歳false", () => {
    expect(deriveCareInsurance(39)).toBe(false);
    expect(deriveCareInsurance(40)).toBe(true);
    expect(deriveCareInsurance(65)).toBe(false);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `src/lib/state/store.ts`**
```ts
import { create } from "zustand";
import type { SimulationInput } from "@/types/input";
import { defaultInput } from "@/lib/validation/schema";

export const deriveCareInsurance = (age: number): boolean => age >= 40 && age < 65;

type Store = {
  input: SimulationInput;
  setInput: (input: SimulationInput) => void;
  reset: () => void;
};

export const useSimStore = create<Store>((set) => ({
  input: defaultInput,
  setInput: (input) => set({ input: { ...input, basic: { ...input.basic, hasCareInsurance: deriveCareInsurance(input.basic.age) } } }),
  reset: () => set({ input: defaultInput }),
}));
```

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: shared zustand store with care-insurance derivation"`

---

## Task 17: Result presentation components

**Files:**
- Create: `src/components/Disclaimer.tsx`, `src/components/results/SummaryCards.tsx`, `ComparisonTable.tsx`, `TaxBreakdown.tsx`, `CashflowChart.tsx`
- (No unit tests; verified via page render in Task 19. Typecheck only.)

**Interfaces:**
- Consumes: `SimulationResult`, Recharts.
- Produces: presentational components taking `{ result: SimulationResult }` (or sub-slices).

- [ ] **Step 1: Create a yen formatter util** in `src/lib/utils/format.ts`:
```ts
export const fmtYen = (v: number): string =>
  `${Math.round(v).toLocaleString("ja-JP")}円`;
```

- [ ] **Step 2: Create `src/components/Disclaimer.tsx`**
```tsx
export function Disclaimer() {
  return (
    <p className="mt-8 rounded-md bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
      このシミュレーションは概算です。実際の税額・社会保険料は、扶養状況、自治体、健康保険組合、役員社宅の評価、賞与支給月、年末調整、税制改正等により変わります。
      事前確定届出給与、社宅制度、出張旅費規程、iDeCo+、小規模企業共済等を実行する場合は、税理士・社労士等の専門家に確認してください。
    </p>
  );
}
```

- [ ] **Step 3: Create `src/components/results/SummaryCards.tsx`**
```tsx
import type { SimulationResult } from "@/types/result";
import { fmtYen } from "@/lib/utils/format";

function Card({ title, value, accent }: { title: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${accent ? "border-blue-300 bg-blue-50" : "bg-white"}`}>
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-1 text-lg font-bold">{fmtYen(value)}</div>
    </div>
  );
}

export function SummaryCards({ result }: { result: SimulationResult }) {
  const { employee, corporate, difference } = result;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      <Card title="会社員 実質手取り" value={employee.effectiveNet} />
      <Card title="法人 実質手取り" value={corporate.effectiveNet} />
      <Card title="法人残キャッシュ" value={corporate.corporate?.remainingCash ?? 0} />
      <Card title="法人 個人＋法人合計" value={corporate.totalOwnerCash} accent />
      <Card title="会社員との合計差額" value={difference.totalOwnerCash} accent />
      <Card title="法人税等" value={corporate.corporate?.corporateTax ?? 0} />
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/results/ComparisonTable.tsx`**
```tsx
import type { SimulationResult } from "@/types/result";
import { fmtYen } from "@/lib/utils/format";

export function ComparisonTable({ result }: { result: SimulationResult }) {
  const { employee: e, corporate: c, difference: d } = result;
  const rows: [string, number | null, number | null, number | null][] = [
    ["給与収入", e.salaryIncome, c.salaryIncome, d.salaryIncome],
    ["社会保険(本人)", e.social.annualEmployee, c.social.annualEmployee, d.socialEmployee],
    ["社会保険(会社)", null, c.social.annualCompany, d.socialCompany],
    ["所得税", e.incomeTax.total, c.incomeTax.total, d.incomeTax],
    ["住民税", e.residentTax.total, c.residentTax.total, d.residentTax],
    ["法人税等", null, c.corporate?.corporateTax ?? 0, d.corporateTax],
    ["社宅メリット", 0, c.taxSaving.housingBenefit, c.taxSaving.housingBenefit],
    ["iDeCo+効果(会社分)", 0, c.ideco.companyAnnual, c.ideco.companyAnnual],
    ["小規模企業共済", 0, c.taxSaving.smallBusinessMutualAnnual, c.taxSaving.smallBusinessMutualAnnual],
    ["出張旅費", 0, c.taxSaving.travelAllowanceAnnual, c.taxSaving.travelAllowanceAnnual],
    ["現金手取り", e.cashNet, c.cashNet, d.cashNet],
    ["実質手取り", e.effectiveNet, c.effectiveNet, d.effectiveNet],
    ["法人残キャッシュ", null, c.corporate?.remainingCash ?? 0, c.corporate?.remainingCash ?? 0],
    ["個人＋法人合計", e.totalOwnerCash, c.totalOwnerCash, d.totalOwnerCash],
  ];
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b text-left text-gray-500">
          <th className="py-2">項目</th><th className="py-2 text-right">会社員</th>
          <th className="py-2 text-right">法人役員</th><th className="py-2 text-right">差額</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, a, b, diff]) => (
          <tr key={label} className="border-b">
            <td className="py-1.5">{label}</td>
            <td className="py-1.5 text-right">{a === null ? "—" : fmtYen(a)}</td>
            <td className="py-1.5 text-right">{b === null ? "—" : fmtYen(b)}</td>
            <td className="py-1.5 text-right">{diff === null ? "—" : fmtYen(diff)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 5: Create `src/components/results/CashflowChart.tsx`** (bar: 会社員 vs 法人 effective/total)
```tsx
"use client";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SimulationResult } from "@/types/result";

export function CashflowChart({ result }: { result: SimulationResult }) {
  const data = [
    { name: "会社員", 実質手取り: result.employee.effectiveNet, 法人残: 0, 合計: result.employee.totalOwnerCash },
    { name: "法人役員", 実質手取り: result.corporate.effectiveNet, 法人残: result.corporate.corporate?.remainingCash ?? 0, 合計: result.corporate.totalOwnerCash },
  ];
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" /><YAxis tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} />
        <Tooltip formatter={(v: number) => `${v.toLocaleString()}円`} /><Legend />
        <Bar dataKey="実質手取り" fill="#3b82f6" /><Bar dataKey="法人残" fill="#10b981" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 6: Create `src/components/results/TaxBreakdown.tsx`** (pie: 法人役員の税・社保内訳)
```tsx
"use client";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CaseResult } from "@/types/result";

const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6"];

export function TaxBreakdown({ result }: { result: CaseResult }) {
  const data = [
    { name: "社会保険(本人)", value: result.social.annualEmployee },
    { name: "所得税", value: result.incomeTax.total },
    { name: "住民税", value: result.residentTax.total },
    { name: "法人税等", value: result.corporate?.corporateTax ?? 0 },
  ].filter((d) => d.value > 0);
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} label>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v: number) => `${v.toLocaleString()}円`} /><Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 7: Typecheck** — `npx tsc --noEmit` → no errors.

- [ ] **Step 8: Commit** — `git add -A && git commit -m "feat: result presentation components"`

---

## Task 18: Input form components

**Files:**
- Create: `src/components/forms/{BasicInfoForm,EmployeeForm,CorporateForm,TaxSavingForm}.tsx`, `src/components/forms/Field.tsx`
- (Typecheck only.)

**Interfaces:**
- Consumes: `useSimStore`, `SimulationInput`.
- Produces: controlled form sections that read/write `useSimStore`. Each takes no props (reads store directly).

- [ ] **Step 1: Create `src/components/forms/Field.tsx`** (reusable number/checkbox field)
```tsx
export function NumberField({ label, value, onChange, step = 1000, suffix }: { label: string; value: number; onChange: (v: number) => void; step?: number; suffix?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-600">{label}</span>
      <div className="flex items-center gap-1">
        <input type="number" className="w-full rounded border px-2 py-1" value={value} step={step}
          onChange={(e) => onChange(Number(e.target.value))} />
        {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
      </div>
    </label>
  );
}

export function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-gray-600">{label}</span>
    </label>
  );
}
```

- [ ] **Step 2: Create `src/components/forms/BasicInfoForm.tsx`**
```tsx
"use client";
import { useSimStore } from "@/lib/state/store";
import { NumberField, CheckField } from "./Field";

export function BasicInfoForm() {
  const { input, setInput } = useSimStore();
  const b = input.basic;
  const patch = (p: Partial<typeof b>) => setInput({ ...input, basic: { ...b, ...p } });
  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 text-sm font-semibold">基本情報</legend>
      <NumberField label="年齢" value={b.age} step={1} onChange={(v) => patch({ age: v })} />
      <NumberField label="扶養人数" value={b.dependents} step={1} onChange={(v) => patch({ dependents: v })} />
      <NumberField label="計算年度" value={b.simulationYear} step={1} onChange={(v) => patch({ simulationYear: v })} />
      <CheckField label="配偶者控除を適用" checked={b.spouseDeduction} onChange={(v) => patch({ spouseDeduction: v })} />
      <p className="text-xs text-gray-400">介護保険は40〜65歳で自動適用（現在: {b.hasCareInsurance ? "適用" : "なし"}）</p>
    </fieldset>
  );
}
```

- [ ] **Step 3: Create `src/components/forms/EmployeeForm.tsx`**
```tsx
"use client";
import { useSimStore } from "@/lib/state/store";
import { NumberField } from "./Field";

export function EmployeeForm() {
  const { input, setInput } = useSimStore();
  const e = input.employee;
  const patch = (p: Partial<typeof e>) => setInput({ ...input, employee: { ...e, ...p } });
  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 text-sm font-semibold">会社員ケース</legend>
      <NumberField label="月給" value={e.monthlySalary} suffix="円" onChange={(v) => patch({ monthlySalary: v })} />
      <NumberField label="年間賞与" value={e.annualBonus} suffix="円" onChange={(v) => patch({ annualBonus: v })} />
      <NumberField label="賞与回数" value={e.bonusCount} step={1} onChange={(v) => patch({ bonusCount: v })} />
      <NumberField label="家賃補助(年)" value={e.rentSubsidyAnnual} suffix="円" onChange={(v) => patch({ rentSubsidyAnnual: v })} />
      <NumberField label="iDeCo(月)" value={e.employeeIdecoMonthly} onChange={(v) => patch({ employeeIdecoMonthly: v })} />
    </fieldset>
  );
}
```

- [ ] **Step 4: Create `src/components/forms/CorporateForm.tsx`**
```tsx
"use client";
import { useSimStore } from "@/lib/state/store";
import { NumberField } from "./Field";

export function CorporateForm() {
  const { input, setInput } = useSimStore();
  const c = input.corporate;
  const patch = (p: Partial<typeof c>) => setInput({ ...input, corporate: { ...c, ...p } });
  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 text-sm font-semibold">法人ケース</legend>
      <NumberField label="役員報酬支給前利益" value={c.preSalaryProfit} suffix="円" onChange={(v) => patch({ preSalaryProfit: v })} />
      <NumberField label="役員報酬(月)" value={c.monthlyDirectorSalary} suffix="円" onChange={(v) => patch({ monthlyDirectorSalary: v })} />
      <NumberField label="事前確定届出給与(年)" value={c.fixedBonusAnnual} suffix="円" onChange={(v) => patch({ fixedBonusAnnual: v })} />
      <NumberField label="役員賞与回数(0-3)" value={c.fixedBonusCount} step={1} onChange={(v) => patch({ fixedBonusCount: v })} />
      <NumberField label="法人実効税率(%)" value={Math.round(c.corporateTaxRate * 100)} step={1} suffix="%" onChange={(v) => patch({ corporateTaxRate: v / 100 })} />
    </fieldset>
  );
}
```

- [ ] **Step 5: Create `src/components/forms/TaxSavingForm.tsx`**
```tsx
"use client";
import { useSimStore } from "@/lib/state/store";
import { NumberField, CheckField } from "./Field";

export function TaxSavingForm() {
  const { input, setInput } = useSimStore();
  const t = input.taxSaving;
  const patch = (p: Partial<typeof t>) => setInput({ ...input, taxSaving: { ...t, ...p } });
  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 text-sm font-semibold">節税施策</legend>
      <CheckField label="社宅を利用" checked={t.companyHousingEnabled} onChange={(v) => patch({ companyHousingEnabled: v })} />
      <NumberField label="家賃(月)" value={t.monthlyRent} suffix="円" onChange={(v) => patch({ monthlyRent: v })} />
      <NumberField label="会社負担率(%)" value={Math.round(t.companyRentShareRate * 100)} step={5} suffix="%" onChange={(v) => patch({ companyRentShareRate: v / 100 })} />
      <CheckField label="iDeCo+を利用" checked={t.idecoPlusEnabled} onChange={(v) => patch({ idecoPlusEnabled: v })} />
      <NumberField label="iDeCo+会社分(月)" value={t.idecoPlusCompanyMonthly} onChange={(v) => patch({ idecoPlusCompanyMonthly: v })} />
      <NumberField label="iDeCo+個人分(月)" value={t.idecoPlusPersonalMonthly} onChange={(v) => patch({ idecoPlusPersonalMonthly: v })} />
      <NumberField label="小規模企業共済(月)" value={t.smallBusinessMutualMonthly} onChange={(v) => patch({ smallBusinessMutualMonthly: v })} />
      <NumberField label="経営セーフティ共済(年)" value={t.businessSafetyMutualAnnual} onChange={(v) => patch({ businessSafetyMutualAnnual: v })} />
      <CheckField label="出張旅費を利用" checked={t.travelAllowanceEnabled} onChange={(v) => patch({ travelAllowanceEnabled: v })} />
      <NumberField label="出張日数(月)" value={t.travelDaysPerMonth} step={1} onChange={(v) => patch({ travelDaysPerMonth: v })} />
      <NumberField label="日当(円/日)" value={t.travelAllowancePerDay} onChange={(v) => patch({ travelAllowancePerDay: v })} />
    </fieldset>
  );
}
```

- [ ] **Step 6: Typecheck** — `npx tsc --noEmit` → no errors.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: input form components bound to store"`

---

## Task 19: Optimization ranking component

**Files:**
- Create: `src/components/results/OptimizationRanking.tsx`, `src/components/forms/OptimizationForm.tsx`
- (Typecheck only.)

**Interfaces:**
- Consumes: `optimize`, `useSimStore`, `OptimizationInput`, `OptimizationResult`.
- Produces: `OptimizationRanking` component that holds local `OptimizationInput` state, runs `optimize(input, opt)` on button click, renders top-20 table; guards errors (組合せ過大) with a message.

- [ ] **Step 1: Create `src/components/results/OptimizationRanking.tsx`**
```tsx
"use client";
import { useState } from "react";
import { useSimStore } from "@/lib/state/store";
import { optimize } from "@/lib/calc/optimizer";
import type { OptimizationInput } from "@/types/input";
import type { OptimizationResult } from "@/types/result";
import { fmtYen } from "@/lib/utils/format";

export function OptimizationRanking() {
  const { input } = useSimStore();
  const [opt, setOpt] = useState<OptimizationInput>({
    preSalaryProfit: input.corporate.preSalaryProfit,
    monthlySalaryMin: 100_000, monthlySalaryMax: 1_000_000, monthlySalaryStep: 50_000,
    bonusMin: 0, bonusMax: 3_000_000, bonusStep: 500_000,
  });
  const [rows, setRows] = useState<OptimizationResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    try { setError(null); setRows(optimize(input, { ...opt, preSalaryProfit: input.corporate.preSalaryProfit })); }
    catch (e) { setError((e as Error).message); setRows([]); }
  };

  return (
    <div className="space-y-3">
      <button onClick={run} className="rounded bg-blue-600 px-4 py-2 text-sm text-white">最適パターンを計算</button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {rows.length > 0 && (
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500">
            <th className="py-2">順位</th><th>月給</th><th>賞与</th><th className="text-right">実質手取り</th><th className="text-right">法人残</th><th className="text-right">合計</th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b">
                <td className="py-1.5">{i + 1}</td><td>{fmtYen(r.monthlyDirectorSalary)}</td><td>{fmtYen(r.fixedBonusAnnual)}</td>
                <td className="text-right">{fmtYen(r.effectiveNet)}</td><td className="text-right">{fmtYen(r.corporateRemainingCash)}</td>
                <td className="text-right font-semibold">{fmtYen(r.totalOwnerCash)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit`.

- [ ] **Step 3: Commit** — `git add -A && git commit -m "feat: optimization ranking UI"`

---

## Task 20: Pages — landing, simulator, result detail

**Files:**
- Modify: `src/app/page.tsx`, `src/app/layout.tsx`
- Create: `src/app/simulator/page.tsx`, `src/app/simulator/result/page.tsx`

**Interfaces:**
- Consumes: all forms, result components, `useSimStore`, `simulate`.

- [ ] **Step 1: Replace `src/app/page.tsx` (landing)**
```tsx
import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">役員報酬・会社員比較シミュレーター</h1>
      <p className="mt-3 text-sm text-gray-600">
        会社員として働く場合と、法人化して役員報酬・節税施策（iDeCo+・小規模企業共済・社宅・出張旅費）を使う場合の手取り・法人残・合計キャッシュを比較します。
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/simulator" className="rounded bg-blue-600 px-5 py-2 text-white">シミュレーターを開く</Link>
      </div>
      <Disclaimer />
    </main>
  );
}
```

- [ ] **Step 2: Create `src/app/simulator/page.tsx`**
```tsx
"use client";
import { useMemo } from "react";
import { useSimStore } from "@/lib/state/store";
import { simulate } from "@/lib/calc/simulator";
import { simulationSchema } from "@/lib/validation/schema";
import { BasicInfoForm } from "@/components/forms/BasicInfoForm";
import { EmployeeForm } from "@/components/forms/EmployeeForm";
import { CorporateForm } from "@/components/forms/CorporateForm";
import { TaxSavingForm } from "@/components/forms/TaxSavingForm";
import { SummaryCards } from "@/components/results/SummaryCards";
import { ComparisonTable } from "@/components/results/ComparisonTable";
import { CashflowChart } from "@/components/results/CashflowChart";
import { TaxBreakdown } from "@/components/results/TaxBreakdown";
import { OptimizationRanking } from "@/components/results/OptimizationRanking";
import { Disclaimer } from "@/components/Disclaimer";

export default function SimulatorPage() {
  const { input } = useSimStore();
  const { result, error } = useMemo(() => {
    const parsed = simulationSchema.safeParse(input);
    if (!parsed.success) return { result: null, error: parsed.error.issues[0]?.message ?? "入力エラー" };
    try { return { result: simulate(input), error: null }; }
    catch (e) { return { result: null, error: (e as Error).message }; }
  }, [input]);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-xl font-bold">シミュレーター</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <BasicInfoForm /><EmployeeForm /><CorporateForm /><TaxSavingForm />
        </div>
        <div className="space-y-6">
          {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {result && (
            <>
              <SummaryCards result={result} />
              <section><h2 className="mb-2 font-semibold">比較表</h2><ComparisonTable result={result} /></section>
              <section className="grid gap-6 md:grid-cols-2">
                <div><h2 className="mb-2 font-semibold">会社員 vs 法人</h2><CashflowChart result={result} /></div>
                <div><h2 className="mb-2 font-semibold">法人役員の負担内訳</h2><TaxBreakdown result={result.corporate} /></div>
              </section>
              <section><h2 className="mb-2 font-semibold">最適報酬パターン</h2><OptimizationRanking /></section>
            </>
          )}
          <Disclaimer />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Create `src/app/simulator/result/page.tsx`** (detail view reusing store)
```tsx
"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useSimStore } from "@/lib/state/store";
import { simulate } from "@/lib/calc/simulator";
import { ComparisonTable } from "@/components/results/ComparisonTable";
import { TaxBreakdown } from "@/components/results/TaxBreakdown";
import { Disclaimer } from "@/components/Disclaimer";

export default function ResultPage() {
  const { input } = useSimStore();
  const result = useMemo(() => simulate(input), [input]);
  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link href="/simulator" className="text-sm text-blue-600">← 入力に戻る</Link>
      <h1 className="my-4 text-xl font-bold">結果詳細</h1>
      <ComparisonTable result={result} />
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div><h2 className="mb-2 font-semibold">会社員 負担内訳</h2><TaxBreakdown result={result.employee} /></div>
        <div><h2 className="mb-2 font-semibold">法人役員 負担内訳</h2><TaxBreakdown result={result.corporate} /></div>
      </div>
      <Disclaimer />
    </main>
  );
}
```

- [ ] **Step 4: Set page title in `src/app/layout.tsx`** — change `metadata.title` to `"役員報酬・会社員比較シミュレーター"` and ensure `lang="ja"` on `<html>`.

- [ ] **Step 5: Build check** — Run `npm run build`. Expected: build succeeds with no type errors.

- [ ] **Step 6: Run all tests** — Run `npm test`. Expected: all tests PASS.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: landing, simulator, and result pages"`

---

## Task 21: Manual verification & README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Start dev server** — Run `npm run dev`, open `http://localhost:3000/simulator`. Verify: forms render, changing 月給 updates result cards live, optimization button produces a ranked table, disclaimer visible.

- [ ] **Step 2: Write `README.md`** documenting: purpose, `npm run dev` / `npm test` / `npm run build`, where to edit rates (`src/lib/constants/rateMaster/2026.ts`), and how to add a new year (register in `index.ts`). State that figures are approximations and 令和8年(2026) tax values are estimates pending official confirmation.

- [ ] **Step 3: Commit** — `git add -A && git commit -m "docs: add README"`

---

## Self-Review Notes

- **Spec coverage:** 会社員/法人ケース計算(13)、社保 月給(5)/賞与(6)、所得税(8)/住民税(9)、iDeCo+(10)、小規模・社宅・旅費・セーフティ共済(11)、法人税(12)、最適化(14)、料率マスタ差し替え(4)、Zod(15)、UI フォーム(18)/結果(17)/最適化(19)/ページ(20)、注意書き(17,20)、検証(全 calc タスク + 21)。標準報酬月額表は料率から生成(4)。
- **概算の明示:** 住民税控除33万・均等割一律・厚年範囲外0・基礎控除令和8年分上乗せはコード内コメント＋README＋Disclaimer で概算と明記。
- **型整合:** `SimulationInput`/`CaseResult`/`SocialInsuranceResult`/`IdecoPlusResult`/`TaxSavingResult`/`OptimizationResult` を Task 3 で定義し、calc/UI が同一名で参照。`getRateMaster`/`calcMonthlySocialInsurance`/`calcAnnualBonusSocialInsurance`/`calcEmploymentIncome`/`calcIncomeTax`/`progressiveIncomeTax`/`calcResidentTax`/`calcIdecoPlus`/`calcTaxSaving`/`calcCorporateTax`/`simulate`/`optimize` の名称をタスク間で統一。
