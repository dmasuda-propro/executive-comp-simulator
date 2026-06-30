import type { SimulationInput } from "@/types/input";
import type {
  CaseResult,
  DifferenceResult,
  SimulationResult,
  SocialInsuranceResult,
} from "@/types/result";
import { getRateMaster } from "@/lib/constants/rateMaster";
import { calcMonthlySocialInsurance } from "./socialInsurance";
import { calcAnnualBonusSocialInsurance } from "./bonusSocialInsurance";
import { calcEmploymentIncome } from "./salaryIncome";
import { calcIncomeTax } from "./incomeTax";
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
  monthlySalary: number;
  annualBonus: number;
  bonusCount: number;
  age: number;
  year: number;
}): SocialInsuranceResult {
  const { monthlySalary, annualBonus, age, year } = params;
  // 賞与額>0なのに回数0だと賞与社保を取りこぼすため最低1回に正規化(optimizerと共通の挙動)
  const bonusCount = annualBonus > 0 ? Math.max(1, params.bonusCount) : 0;
  const threshold = 4; // 年4回以上は報酬扱い
  const treatedAsMonthly = bonusCount >= threshold;
  const effectiveMonthly = treatedAsMonthly
    ? monthlySalary + annualBonus / 12
    : monthlySalary;
  const monthly = calcMonthlySocialInsurance({
    monthlySalary: effectiveMonthly,
    age,
    year,
  });
  const bonus = treatedAsMonthly
    ? { employee: 0, company: 0 }
    : calcAnnualBonusSocialInsurance({
        bonuses: bonusListFor(annualBonus, bonusCount),
        age,
        year,
      });
  const annualEmployee = monthly.monthlyEmployee * 12 + bonus.employee;
  // 会社負担は折半分(本人と同額)＋子ども・子育て拠出金(全額事業主)で本人より大きい
  const annualCompany = monthly.monthlyCompany * 12 + bonus.company;
  return {
    standardMonthly: monthly.standardMonthly,
    monthlyEmployee: monthly.monthlyEmployee,
    monthlyCompany: monthly.monthlyCompany,
    bonusEmployee: bonus.employee,
    bonusCompany: bonus.company,
    annualEmployee,
    annualCompany,
    breakdown: monthly.breakdown,
    treatedAsMonthly,
  };
}

const emptyIdeco = {
  companyAnnual: 0,
  personalAnnual: 0,
  corporateTaxSaving: 0,
  personalIncomeTaxSaving: 0,
  personalResidentTaxSaving: 0,
  socialInsuranceSaving: 0,
};
const emptyTaxSaving = {
  companyPaidRentAnnual: 0,
  housingBenefit: 0,
  travelAllowanceAnnual: 0,
  smallBusinessMutualAnnual: 0,
  businessSafetyMutualAnnual: 0,
  companyDeductibleExpenses: 0,
};

export function simulateEmployeeCase(input: SimulationInput): CaseResult {
  const { basic, employee } = input;
  // 家賃補助(現金給付)は課税給与かつ社会保険の算定対象として扱う(月割で報酬に算入)
  const salaryIncome =
    employee.monthlySalary * 12 + employee.annualBonus + employee.rentSubsidyAnnual;
  const social = buildSocial({
    monthlySalary: employee.monthlySalary + employee.rentSubsidyAnnual / 12,
    annualBonus: employee.annualBonus,
    bonusCount: employee.bonusCount,
    age: basic.age,
    year: basic.simulationYear,
  });
  const { employmentIncome } = calcEmploymentIncome(
    salaryIncome,
    basic.simulationYear,
  );
  const idecoPersonalAnnual = employee.employeeIdecoMonthly * 12;
  const incomeTax = calcIncomeTax({
    employmentIncome,
    socialInsurance: social.annualEmployee,
    idecoPersonalAnnual,
    smallBusinessMutualAnnual: 0,
    spouseDeduction: basic.spouseDeduction,
    dependents: basic.dependents,
    disabilityGeneral: basic.disabilityGeneral,
    disabilitySpecial: basic.disabilitySpecial,
    medicalExpenseAnnual: basic.medicalExpenseAnnual,
    year: basic.simulationYear,
  });
  const residentTax = calcResidentTax({
    employmentIncome,
    socialInsurance: social.annualEmployee,
    idecoPersonalAnnual,
    smallBusinessMutualAnnual: 0,
    spouseDeduction: basic.spouseDeduction,
    dependents: basic.dependents,
    disabilityGeneral: basic.disabilityGeneral,
    disabilitySpecial: basic.disabilitySpecial,
    medicalExpenseAnnual: basic.medicalExpenseAnnual,
    year: basic.simulationYear,
  });
  const cashNet =
    salaryIncome -
    social.annualEmployee -
    incomeTax.total -
    residentTax.total -
    idecoPersonalAnnual;
  // 家賃補助は課税給与として salaryIncome に算入済みのため、ここで二重加算しない
  const effectiveNet = cashNet;
  return {
    label: "会社員",
    salaryIncome,
    baseSalaryAnnual: employee.monthlySalary * 12 + employee.rentSubsidyAnnual,
    bonusAnnual: employee.annualBonus,
    businessExpenseAnnual: 0,
    consumptionTaxAnnual: 0,
    businessTaxAnnual: 0,
    companyConsumptionTaxCredit: 0,
    companyBaseCost: salaryIncome,
    employerBearsSocial: true,
    employmentIncome,
    social,
    incomeTax,
    residentTax,
    // 会社員の個人iDeCo拠出額を明細表示できるよう保持(節税効果は会社員では算出しない)
    ideco: { ...emptyIdeco, personalAnnual: idecoPersonalAnnual },
    taxSaving: emptyTaxSaving,
    cashNet,
    effectiveNet,
    futureAssetNet: effectiveNet + idecoPersonalAnnual,
    totalOwnerCash: effectiveNet,
  };
}

export function simulateCorporateCase(input: SimulationInput): CaseResult {
  const { basic, corporate, taxSaving } = input;
  const directorSalaryAnnual = corporate.monthlyDirectorSalary * 12;
  const fixedBonusAnnual = corporate.fixedBonusAnnual;
  const salaryIncome = directorSalaryAnnual + fixedBonusAnnual;

  const social = buildSocial({
    monthlySalary: corporate.monthlyDirectorSalary,
    annualBonus: fixedBonusAnnual,
    bonusCount: corporate.fixedBonusCount,
    age: basic.age,
    year: basic.simulationYear,
  });
  const { employmentIncome } = calcEmploymentIncome(
    salaryIncome,
    basic.simulationYear,
  );

  if (taxSaving.idecoPlusEnabled)
    validateIdecoPlus(
      taxSaving.idecoPlusCompanyMonthly,
      taxSaving.idecoPlusPersonalMonthly,
      basic.simulationYear,
    );

  const ts = calcTaxSaving(taxSaving);
  // iDeCo+個人掛金(所得控除額)。掛金額は限界税率に依存しないため先に確定。
  const idecoPersonalAnnual = taxSaving.idecoPlusEnabled
    ? taxSaving.idecoPlusPersonalMonthly * 12
    : 0;

  const incomeTax = calcIncomeTax({
    employmentIncome,
    socialInsurance: social.annualEmployee,
    idecoPersonalAnnual,
    smallBusinessMutualAnnual: ts.smallBusinessMutualAnnual,
    spouseDeduction: basic.spouseDeduction,
    dependents: basic.dependents,
    disabilityGeneral: basic.disabilityGeneral,
    disabilitySpecial: basic.disabilitySpecial,
    medicalExpenseAnnual: basic.medicalExpenseAnnual,
    year: basic.simulationYear,
  });
  const residentTax = calcResidentTax({
    employmentIncome,
    socialInsurance: social.annualEmployee,
    idecoPersonalAnnual,
    smallBusinessMutualAnnual: ts.smallBusinessMutualAnnual,
    spouseDeduction: basic.spouseDeduction,
    dependents: basic.dependents,
    disabilityGeneral: basic.disabilityGeneral,
    disabilitySpecial: basic.disabilitySpecial,
    medicalExpenseAnnual: basic.medicalExpenseAnnual,
    year: basic.simulationYear,
  });

  // 節税額表示用の限界税率は、実際の課税所得から得た限界税率を使う(ハードコードを排除)
  const ideco = taxSaving.idecoPlusEnabled
    ? calcIdecoPlus({
        companyMonthly: taxSaving.idecoPlusCompanyMonthly,
        personalMonthly: taxSaving.idecoPlusPersonalMonthly,
        corporateTaxRate: corporate.corporateTaxRate,
        marginalIncomeTaxRate: incomeTax.marginalRate,
      })
    : emptyIdeco;

  const cashNet =
    salaryIncome -
    social.annualEmployee -
    incomeTax.total -
    residentTax.total -
    ideco.personalAnnual -
    ts.smallBusinessMutualAnnual;
  // 実質手取り = 現金手取り + 非現金の経済的メリット(社宅・旅費・iDeCo+会社掛金)。
  // iDeCo個人掛金・小規模共済は「現金として出ていく将来資産」なので実質手取りには戻さず、
  // futureAssetNet(将来資産込み)で戻す(個人iDeCoと小規模で扱いを統一)。
  const effectiveNet =
    cashNet + ts.housingBenefit + ts.travelAllowanceAnnual + ideco.companyAnnual;

  const corp = calcCorporateTax({
    preSalaryProfit: corporate.preSalaryProfit,
    directorSalaryAnnual,
    fixedBonusAnnual,
    companySocialInsurance: social.annualCompany,
    idecoPlusCompanyAnnual: ideco.companyAnnual,
    companyDeductibleExpenses: ts.companyDeductibleExpenses,
    corporateTaxRate: corporate.corporateTaxRate,
    perCapitaTax: getRateMaster(basic.simulationYear).corporate.perCapitaTax,
  });

  return {
    label: "法人役員",
    salaryIncome,
    baseSalaryAnnual: directorSalaryAnnual,
    bonusAnnual: fixedBonusAnnual,
    businessExpenseAnnual: 0,
    consumptionTaxAnnual: 0,
    businessTaxAnnual: 0,
    companyConsumptionTaxCredit: 0,
    companyBaseCost: salaryIncome,
    employerBearsSocial: true,
    employmentIncome,
    social,
    incomeTax,
    residentTax,
    ideco,
    taxSaving: ts,
    cashNet,
    effectiveNet,
    futureAssetNet:
      effectiveNet + ideco.personalAnnual + ts.smallBusinessMutualAnnual,
    corporate: {
      profitBeforeTax: corp.profitBeforeTax,
      corporateTax: corp.corporateTax,
      remainingCash: corp.remainingCash,
    },
    totalOwnerCash: effectiveNet + corp.remainingCash,
  };
}

// マイクロ法人＋業務委託スキーム。本業を業務委託(事業所得・青色65万)で受け、
// 社会保険は別会社(マイクロ法人)の役員報酬5.5万円で最低等級に固定する。
export function simulateMicroSchemeCase(input: SimulationInput): CaseResult {
  const { basic, microScheme } = input;
  const year = basic.simulationYear;
  const rev = microScheme.contractRevenueAnnual;
  const exp = microScheme.contractExpensesAnnual;
  const microSalaryAnnual = microScheme.microMonthlySalary * 12;
  const idecoPersonalAnnual = microScheme.idecoMonthly * 12;
  const smallBizAnnual = microScheme.smallBusinessMutualMonthly * 12;
  // 消費税(簡易課税・サービス業=売上×5%)。租税公課として事業所得の経費にもなる。
  const consumptionTax = microScheme.consumptionTaxEnabled
    ? Math.floor(rev * microScheme.consumptionTaxRate)
    : 0;

  // マイクロ法人の給与所得(給与所得控除後)。役員報酬が控除額未満なら0
  const microEmploymentIncome = calcEmploymentIncome(microSalaryAnnual, year).employmentIncome;
  // 事業所得(業務委託): 収入 − 経費 − 消費税(租税公課) − 青色申告特別控除65万
  const businessBeforeBlue = Math.max(0, rev - exp - consumptionTax);
  const blueDeduction = Math.min(650_000, businessBeforeBlue);
  const businessIncome = businessBeforeBlue - blueDeduction;
  const totalIncome = businessIncome + microEmploymentIncome; // 合計所得金額
  // 個人事業税: (事業所得 + 青色控除戻し − 事業主控除290万) × 率。青色は加算戻し=businessBeforeBlue基準。
  const businessTax = microScheme.businessTaxEnabled
    ? Math.floor(Math.max(0, businessBeforeBlue - 2_900_000) * microScheme.businessTaxRate)
    : 0;

  // 社会保険は最低等級(マイクロ法人の役員報酬ベース・賞与なし)
  const monthly = calcMonthlySocialInsurance({
    monthlySalary: microScheme.microMonthlySalary,
    age: basic.age,
    year,
  });
  const social: SocialInsuranceResult = {
    standardMonthly: monthly.standardMonthly,
    monthlyEmployee: monthly.monthlyEmployee,
    monthlyCompany: monthly.monthlyCompany,
    bonusEmployee: 0,
    bonusCompany: 0,
    annualEmployee: monthly.monthlyEmployee * 12,
    annualCompany: monthly.monthlyCompany * 12,
    breakdown: monthly.breakdown,
    treatedAsMonthly: false,
  };

  const taxArgs = {
    employmentIncome: totalIncome, // 合計所得金額として税額計算
    socialInsurance: social.annualEmployee,
    idecoPersonalAnnual, // 小規模企業共済等掛金控除(全額所得控除)
    smallBusinessMutualAnnual: smallBizAnnual,
    spouseDeduction: basic.spouseDeduction,
    dependents: basic.dependents,
    disabilityGeneral: basic.disabilityGeneral,
    disabilitySpecial: basic.disabilitySpecial,
    medicalExpenseAnnual: basic.medicalExpenseAnnual,
    year,
  };
  const incomeTax = calcIncomeTax(taxArgs);
  const residentTax = calcResidentTax(taxArgs);

  const grossReceived = rev + microSalaryAnnual; // 額面(本業報酬＋マイクロ法人役員報酬)
  const cashNet =
    grossReceived -
    exp -
    consumptionTax -
    businessTax -
    social.annualEmployee -
    incomeTax.total -
    residentTax.total -
    idecoPersonalAnnual -
    smallBizAnnual;

  return {
    label: "マイクロ法人＋業務委託",
    salaryIncome: grossReceived,
    baseSalaryAnnual: rev,
    bonusAnnual: microSalaryAnnual,
    businessExpenseAnnual: exp,
    consumptionTaxAnnual: consumptionTax,
    businessTaxAnnual: businessTax,
    // 自社は本則課税で業務委託費の消費税10%を仕入税額控除できる(本人の簡易課税5%とは別)
    companyConsumptionTaxCredit: microScheme.consumptionTaxEnabled ? Math.floor(rev * 0.1) : 0,
    companyBaseCost: rev, // 自社が支払う業務委託費(税抜)
    employerBearsSocial: false, // 雇用でないため会社負担社保なし
    employmentIncome: totalIncome,
    social,
    incomeTax,
    residentTax,
    ideco: { ...emptyIdeco, personalAnnual: idecoPersonalAnnual },
    taxSaving: { ...emptyTaxSaving, smallBusinessMutualAnnual: smallBizAnnual },
    cashNet,
    effectiveNet: cashNet,
    futureAssetNet: cashNet + idecoPersonalAnnual + smallBizAnnual,
    totalOwnerCash: cashNet + idecoPersonalAnnual + smallBizAnnual,
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
