import type { CaseResult } from "@/types/result";
import { fmtYen } from "@/lib/utils/format";

type Row = {
  label: string;
  emp: number;
  corp: number;
  strong?: boolean;
  minus?: boolean;
};

export function IncomeBreakdown({
  employee,
  corporate,
}: {
  employee: CaseResult;
  corporate: CaseResult;
}) {
  const rows: Row[] = [
    { label: "額面（給与・役員報酬＋賞与）", emp: employee.salaryIncome, corp: corporate.salaryIncome, strong: true },
    { label: "社会保険料（本人）", emp: employee.social.annualEmployee, corp: corporate.social.annualEmployee, minus: true },
    { label: "所得税", emp: employee.incomeTax.total, corp: corporate.incomeTax.total, minus: true },
    { label: "住民税", emp: employee.residentTax.total, corp: corporate.residentTax.total, minus: true },
    { label: "現金手取り", emp: employee.cashNet, corp: corporate.cashNet, strong: true },
    { label: "実質手取り（社宅・出張旅費・iDeCo+会社分を加算）", emp: employee.effectiveNet, corp: corporate.effectiveNet },
    { label: "将来資産込み手取り（小規模・iDeCo個人を加算）", emp: employee.futureAssetNet, corp: corporate.futureAssetNet, strong: true },
  ];

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
            {rows.map((r) => (
              <tr
                key={r.label}
                className={`border-b border-gray-100 ${r.strong ? "bg-blue-50 font-bold" : ""}`}
              >
                <td className="py-1.5 text-left">
                  {r.minus && <span className="mr-0.5 text-gray-400">−</span>}
                  {r.label}
                </td>
                <td className="py-1.5 text-right tabular-nums">
                  {r.minus ? `−${fmtYen(r.emp)}` : fmtYen(r.emp)}
                </td>
                <td className="py-1.5 text-right tabular-nums">
                  {r.minus ? `−${fmtYen(r.corp)}` : fmtYen(r.corp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-gray-400">
        ※ 法人税等・法人残キャッシュは下部の比較表を参照。実質手取り＝現金手取り＋非現金メリット、将来資産込み＝＋iDeCo・共済の積立。
      </p>
    </div>
  );
}
