import type { CaseResult } from "@/types/result";
import { fmtYen, fmtYenSigned } from "@/lib/utils/format";

type Row = { label: string; emp: number; corp: number; always?: boolean };

export function CompanyCostComparison({
  employee,
  corporate,
}: {
  employee: CaseResult;
  corporate: CaseResult;
}) {
  const both = (f: (c: CaseResult) => number, always?: boolean): Row => ({
    label: "",
    emp: f(employee),
    corp: f(corporate),
    always,
  });

  const items: Row[] = [
    { ...both((c) => c.salaryIncome, true), label: "額面（給与・役員報酬＋賞与）" },
    { ...both((c) => c.social.annualCompany, true), label: "会社負担 社会保険料" },
    { ...both((c) => c.ideco.companyAnnual), label: "iDeCo+ 会社掛金" },
    { ...both((c) => c.taxSaving.companyPaidRentAnnual), label: "社宅（会社負担家賃）" },
    { ...both((c) => c.taxSaving.travelAllowanceAnnual), label: "出張旅費・日当" },
    { ...both((c) => c.taxSaving.businessSafetyMutualAnnual), label: "経営セーフティ共済" },
  ];
  const rows = items.filter((r) => r.always || r.emp !== 0 || r.corp !== 0);

  const empTotal = items.reduce((s, r) => s + r.emp, 0);
  const corpTotal = items.reduce((s, r) => s + r.corp, 0);
  const diff = corpTotal - empTotal;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="mb-1 font-semibold">会社の支出比較（年間・会社負担社保・節税損金を含む）</h2>
      <p className="mb-2 text-xs text-gray-500">
        上の手取り明細の前提で、各社が支払う総額（額面＋会社負担の社会保険料＋会社負担の節税策）を比較します。
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200 text-gray-500">
              <th className="py-2 text-left font-medium">項目</th>
              <th className="py-2 text-right font-medium">現職の会社<br />（会社員）</th>
              <th className="py-2 text-right font-medium">自社<br />（法人役員・節税フル活用）</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-gray-100">
                <td className="py-1.5 text-left">{r.label}</td>
                <td className="py-1.5 text-right tabular-nums">{fmtYen(r.emp)}</td>
                <td className="py-1.5 text-right tabular-nums">{fmtYen(r.corp)}</td>
              </tr>
            ))}
            <tr className="border-b border-gray-100 bg-blue-100 font-bold">
              <td className="py-1.5 text-left">会社の支出 合計</td>
              <td className="py-1.5 text-right tabular-nums">{fmtYen(empTotal)}</td>
              <td className="py-1.5 text-right tabular-nums">{fmtYen(corpTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        className={`mt-2 rounded-lg p-2 text-center text-sm font-semibold ${
          diff <= 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"
        }`}
      >
        自社の支出は現職の会社より {fmtYenSigned(diff)}
        <span className="ml-1 font-normal text-gray-500">
          （{diff <= 0 ? "安く同等条件を提示できます" : "高くなります"}）
        </span>
      </div>
      <p className="mt-2 text-[11px] text-gray-400">
        ※ 役員報酬・会社負担社保・節税策（社宅・旅費・iDeCo+会社掛金・経営セーフティ共済）はいずれも法人の損金（法人税が下がる）。実際の純コストはこの支出から法人税減少分を差し引いた額に近くなります。
      </p>
    </div>
  );
}
