import type { CaseResult } from "@/types/result";
import { fmtYen } from "@/lib/utils/format";

type Kind = "head" | "detail" | "minus" | "plus" | "subtotal" | "total";
type Row = { label: string; emp: number; corp: number; kind: Kind };

export function IncomeBreakdown({
  employee,
  corporate,
}: {
  employee: CaseResult;
  corporate: CaseResult;
}) {
  const val = (c: CaseResult, f: (c: CaseResult) => number) => f(c);
  const both = (f: (c: CaseResult) => number) => ({
    emp: val(employee, f),
    corp: val(corporate, f),
  });

  const allRows: Row[] = [
    { label: "年収（月給・役員報酬×12）", kind: "detail", ...both((c) => c.baseSalaryAnnual) },
    { label: "賞与（ボーナス・事前確定届出給与）", kind: "detail", ...both((c) => c.bonusAnnual) },
    { label: "額面 合計", kind: "subtotal", ...both((c) => c.salaryIncome) },
    { label: "社会保険料（本人）", kind: "minus", ...both((c) => c.social.annualEmployee) },
    { label: "所得税", kind: "minus", ...both((c) => c.incomeTax.total) },
    { label: "住民税", kind: "minus", ...both((c) => c.residentTax.total) },
    { label: "小規模企業共済 掛金", kind: "minus", ...both((c) => c.taxSaving.smallBusinessMutualAnnual) },
    { label: "iDeCo 個人掛金", kind: "minus", ...both((c) => c.ideco.personalAnnual) },
    { label: "現金手取り", kind: "subtotal", ...both((c) => c.cashNet) },
    { label: "社宅メリット（会社負担家賃）", kind: "plus", ...both((c) => c.taxSaving.housingBenefit) },
    { label: "出張旅費・日当", kind: "plus", ...both((c) => c.taxSaving.travelAllowanceAnnual) },
    { label: "小規模企業共済（将来資産）", kind: "plus", ...both((c) => c.taxSaving.smallBusinessMutualAnnual) },
    { label: "iDeCo＋（会社＋個人の積立）", kind: "plus", ...both((c) => c.ideco.companyAnnual + c.ideco.personalAnnual) },
    { label: "将来資産込み総資産", kind: "total", ...both((c) => c.futureAssetNet) },
  ];

  // 両者とも0の加算/減算行は非表示(小計・合計・額面は常時表示)
  const rows = allRows.filter(
    (r) => r.kind === "head" || r.kind === "subtotal" || r.kind === "total" || r.emp !== 0 || r.corp !== 0,
  );

  const cell = (v: number, kind: Kind) => {
    const sign = kind === "minus" ? "−" : kind === "plus" ? "＋" : "";
    return `${sign}${fmtYen(v)}`;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="mb-1 font-semibold">手取り明細：会社員 vs 法人役員（節税フル活用）</h2>
      <p className="mb-2 text-xs text-gray-500">
        法人役員側は節税をフル活用（iDeCo+を上限・小規模共済7万円/月＋設定中の社宅・出張旅費・経営セーフティ共済）した前提です。
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200 text-gray-500">
              <th className="py-2 text-left font-medium">項目</th>
              <th className="py-2 text-right font-medium">会社員<br />（給与・賞与）</th>
              <th className="py-2 text-right font-medium">法人役員<br />（節税フル活用）</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const strong = r.kind === "subtotal" || r.kind === "total" || r.kind === "head";
              const bg = r.kind === "total" ? "bg-blue-100" : r.kind === "subtotal" ? "bg-blue-50" : "";
              const indent =
                r.kind === "minus" || r.kind === "plus" || r.kind === "detail" ? "pl-3" : "";
              const detail = r.kind === "detail" ? "text-gray-400" : "";
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
                  <td className={`py-1.5 text-left ${indent} ${detail}`}>{r.label}</td>
                  <td className={`py-1.5 text-right tabular-nums ${valColor}`}>{cell(r.emp, r.kind)}</td>
                  <td className={`py-1.5 text-right tabular-nums ${valColor}`}>{cell(r.corp, r.kind)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-gray-400">
        ※ 額面 −（社保＋所得税＋住民税＋小規模・iDeCo個人掛金）＝現金手取り。現金手取り ＋（社宅・出張旅費＋小規模企業共済＋iDeCo＋）＝将来資産込み総資産。小規模・iDeCoは現金から拠出され将来資産として戻ります。法人税等・法人残は下部の比較表を参照。
      </p>
    </div>
  );
}
