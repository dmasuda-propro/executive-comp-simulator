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
          <th className="py-2">項目</th>
          <th className="py-2 text-right">会社員</th>
          <th className="py-2 text-right">法人役員</th>
          <th className="py-2 text-right">差額</th>
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
