import type { CaseResult } from "@/types/result";
import { fmtYen } from "@/lib/utils/format";
import type { BreakdownCase } from "./IncomeBreakdown";

type RowDef = { label: string; f: (c: CaseResult) => number };

const ROWS: RowDef[] = [
  { label: "額面・業務委託費", f: (c) => c.companyBaseCost },
  { label: "消費税 仕入税額控除（10%）", f: (c) => -c.companyConsumptionTaxCredit },
  { label: "会社負担 社会保険料", f: (c) => (c.employerBearsSocial ? c.social.annualCompany : 0) },
  { label: "iDeCo+ 会社掛金", f: (c) => c.ideco.companyAnnual },
  { label: "社宅（会社負担家賃）", f: (c) => c.taxSaving.companyPaidRentAnnual },
  { label: "出張旅費・日当", f: (c) => c.taxSaving.travelAllowanceAnnual },
  { label: "経営セーフティ共済", f: (c) => c.taxSaving.businessSafetyMutualAnnual },
];

const total = (c: CaseResult) => ROWS.reduce((s, r) => s + r.f(c), 0);

export function CompanyCostComparison({ cases }: { cases: BreakdownCase[] }) {
  const rows = ROWS.filter((r) => cases.some((c) => r.f(c.result) !== 0));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="mb-1 font-semibold">会社の支出比較（年間・3案）</h2>
      <p className="mb-2 text-xs text-gray-500">
        各案で会社が支払う総額（額面／業務委託費＋会社負担社保＋会社負担の節税策）。業務委託は雇用でないため会社負担社保はなく、本則課税の会社は業務委託費の消費税10%を仕入税額控除できるため、その分だけ会社支出が減ります。マイクロ法人側（売上80万）は別管理で含みません。
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200 text-gray-500">
              <th className="py-2 text-left font-medium">項目</th>
              {cases.map((c) => (
                <th key={c.header} className="py-2 text-right font-medium">
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-gray-100">
                <td className="py-1.5 text-left">{r.label}</td>
                {cases.map((c) => (
                  <td key={c.header} className="py-1.5 text-right tabular-nums">
                    {fmtYen(r.f(c.result))}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-b border-gray-100 bg-blue-100 font-bold">
              <td className="py-1.5 text-left">会社の支出 合計</td>
              {cases.map((c) => (
                <td key={c.header} className="py-1.5 text-right tabular-nums">
                  {fmtYen(total(c.result))}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-gray-400">
        ※ 役員報酬・会社負担社保・節税策はいずれも法人の損金（法人税が下がる）。業務委託費も全額損金。実際の純コストは法人税減少分を差し引いた額に近くなります。
      </p>
    </div>
  );
}
