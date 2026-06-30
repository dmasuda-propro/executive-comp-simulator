import type { SimulationResult } from "@/types/result";
import { fmtYen, fmtYenSigned } from "@/lib/utils/format";

type Row = {
  label: string;
  emp: number | null;
  corp: number | null;
  diff: number | null;
  colorDiff?: boolean; // 差額を緑/赤で色付け(高いほど良い項目)
  highlight?: boolean;
};

export function ComparisonTable({ result }: { result: SimulationResult }) {
  const { employee: e, corporate: c, difference: d } = result;
  const rows: Row[] = [
    { label: "給与収入", emp: e.salaryIncome, corp: c.salaryIncome, diff: d.salaryIncome },
    { label: "社会保険（本人）", emp: e.social.annualEmployee, corp: c.social.annualEmployee, diff: d.socialEmployee },
    { label: "社会保険（会社）", emp: null, corp: c.social.annualCompany, diff: d.socialCompany },
    { label: "所得税", emp: e.incomeTax.total, corp: c.incomeTax.total, diff: d.incomeTax },
    { label: "住民税", emp: e.residentTax.total, corp: c.residentTax.total, diff: d.residentTax },
    { label: "法人税等", emp: null, corp: c.corporate?.corporateTax ?? 0, diff: d.corporateTax },
    { label: "社宅メリット", emp: 0, corp: c.taxSaving.housingBenefit, diff: c.taxSaving.housingBenefit },
    { label: "iDeCo+効果（会社分）", emp: 0, corp: c.ideco.companyAnnual, diff: c.ideco.companyAnnual },
    { label: "小規模企業共済", emp: 0, corp: c.taxSaving.smallBusinessMutualAnnual, diff: c.taxSaving.smallBusinessMutualAnnual },
    { label: "出張旅費", emp: 0, corp: c.taxSaving.travelAllowanceAnnual, diff: c.taxSaving.travelAllowanceAnnual },
    { label: "現金手取り", emp: e.cashNet, corp: c.cashNet, diff: d.cashNet, colorDiff: true },
    { label: "実質手取り", emp: e.effectiveNet, corp: c.effectiveNet, diff: d.effectiveNet, colorDiff: true },
    { label: "法人残キャッシュ", emp: null, corp: c.corporate?.remainingCash ?? 0, diff: c.corporate?.remainingCash ?? 0 },
    { label: "個人＋法人合計", emp: e.totalOwnerCash, corp: c.totalOwnerCash, diff: d.totalOwnerCash, colorDiff: true, highlight: true },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200 text-gray-500">
            <th className="py-2 text-left font-medium">項目</th>
            <th className="py-2 text-right font-medium">会社員</th>
            <th className="py-2 text-right font-medium">法人役員</th>
            <th className="py-2 text-right font-medium">差額</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const diffColor =
              r.colorDiff && r.diff !== null
                ? r.diff > 0
                  ? "text-green-600"
                  : r.diff < 0
                    ? "text-rose-600"
                    : "text-gray-400"
                : "text-gray-500";
            return (
              <tr
                key={r.label}
                className={`border-b border-gray-100 ${r.highlight ? "bg-blue-50 font-bold" : ""}`}
              >
                <td className="py-1.5 text-left">{r.label}</td>
                <td className="py-1.5 text-right tabular-nums">{r.emp === null ? "—" : fmtYen(r.emp)}</td>
                <td className="py-1.5 text-right tabular-nums">{r.corp === null ? "—" : fmtYen(r.corp)}</td>
                <td className={`py-1.5 text-right tabular-nums ${diffColor}`}>
                  {r.diff === null ? "—" : r.colorDiff ? fmtYenSigned(r.diff) : fmtYen(r.diff)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
