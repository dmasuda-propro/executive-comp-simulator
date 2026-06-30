import type { CaseResult } from "@/types/result";
import { fmtYen } from "@/lib/utils/format";

type Kind = "detail" | "minus" | "plus" | "subtotal" | "total";
type RowDef = { label: string; kind: Kind; f: (c: CaseResult) => number };

export type BreakdownCase = { header: string; result: CaseResult };

const ROWS: RowDef[] = [
  { label: "年収・本業（月給×12／業務委託）", kind: "detail", f: (c) => c.baseSalaryAnnual },
  { label: "賞与・役員報酬（賞与／マイクロ法人）", kind: "detail", f: (c) => c.bonusAnnual },
  { label: "額面 合計", kind: "subtotal", f: (c) => c.salaryIncome },
  { label: "経費（業務委託）", kind: "minus", f: (c) => c.businessExpenseAnnual },
  { label: "社会保険料（本人）", kind: "minus", f: (c) => c.social.annualEmployee },
  { label: "所得税", kind: "minus", f: (c) => c.incomeTax.total },
  { label: "住民税", kind: "minus", f: (c) => c.residentTax.total },
  { label: "小規模企業共済 掛金", kind: "minus", f: (c) => c.taxSaving.smallBusinessMutualAnnual },
  { label: "iDeCo 個人掛金", kind: "minus", f: (c) => c.ideco.personalAnnual },
  { label: "現金手取り", kind: "subtotal", f: (c) => c.cashNet },
  { label: "社宅メリット（会社負担家賃）", kind: "plus", f: (c) => c.taxSaving.housingBenefit },
  { label: "出張旅費・日当", kind: "plus", f: (c) => c.taxSaving.travelAllowanceAnnual },
  { label: "小規模企業共済（将来資産）", kind: "plus", f: (c) => c.taxSaving.smallBusinessMutualAnnual },
  { label: "iDeCo＋（会社＋個人の積立）", kind: "plus", f: (c) => c.ideco.companyAnnual + c.ideco.personalAnnual },
  { label: "将来資産込み総資産", kind: "total", f: (c) => c.futureAssetNet },
];

export function IncomeBreakdown({ cases }: { cases: BreakdownCase[] }) {
  const always = (k: Kind) => k === "subtotal" || k === "total";
  const rows = ROWS.filter(
    (r) => always(r.kind) || cases.some((c) => r.f(c.result) !== 0),
  );

  const cell = (v: number, kind: Kind) => {
    const sign = kind === "minus" ? "−" : kind === "plus" ? "＋" : "";
    return `${sign}${fmtYen(v)}`;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="mb-1 font-semibold">手取り明細（3案比較）</h2>
      <p className="mb-2 text-xs text-gray-500">
        法人役員は節税フル活用（iDeCo+上限・小規模7万円/月＋社宅・出張旅費等）、業務委託はマイクロ法人スキーム（社保最低・事業所得 青色65万）の前提です。
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
            {rows.map((r) => {
              const strong = r.kind === "subtotal" || r.kind === "total";
              const bg = r.kind === "total" ? "bg-blue-100" : r.kind === "subtotal" ? "bg-blue-50" : "";
              const indent = r.kind !== "subtotal" && r.kind !== "total" ? "pl-3" : "";
              const labelColor = r.kind === "detail" ? "text-gray-400" : "";
              const valColor =
                r.kind === "minus"
                  ? "text-rose-600"
                  : r.kind === "plus"
                    ? "text-green-600"
                    : r.kind === "detail"
                      ? "text-gray-400"
                      : "";
              return (
                <tr key={r.label} className={`border-b border-gray-100 ${bg} ${strong ? "font-bold" : ""}`}>
                  <td className={`py-1.5 text-left ${indent} ${labelColor}`}>{r.label}</td>
                  {cases.map((c) => (
                    <td key={c.header} className={`py-1.5 text-right tabular-nums ${valColor}`}>
                      {cell(r.f(c.result), r.kind)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-gray-400">
        ※ 額面 −（経費＋社保＋所得税＋住民税＋小規模・iDeCo個人掛金）＝現金手取り。＋（社宅・出張旅費・小規模・iDeCo＋）＝将来資産込み総資産。業務委託は青色申告特別控除65万円（税額に反映・現金には影響なし）。法人残・マイクロ法人の利益は含みません。
      </p>
    </div>
  );
}
