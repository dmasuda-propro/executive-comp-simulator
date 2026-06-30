"use client";
import { useMemo } from "react";
import { useSimStore } from "@/lib/state/store";
import { solveDirectorSalaryForTakeHome } from "@/lib/calc/reverseSolver";
import { fmtYen, fmtMan, fmtYenSigned } from "@/lib/utils/format";

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border-b border-gray-100 py-1.5 text-sm">
      <span className="text-gray-600">{label}</span>
      <span className={`tabular-nums ${strong ? "text-base font-bold" : "font-medium"}`}>{value}</span>
    </div>
  );
}

export function ReverseSolver() {
  const { input } = useSimStore();
  const r = useMemo(() => solveDirectorSalaryForTakeHome(input), [input]);
  const diff = r.annualDirectorSalary - r.employeeGrossSalary;
  const cheaper = diff < 0;
  const futureAsset = r.result.futureAssetNet - r.result.effectiveNet; // 将来資産の積立額

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        他社の会社員を取締役に招くための試算です。現職と同等の「将来資産込み総資産」（手取り＋iDeCo・共済等の積立）になる役員報酬（額面）を、
        節税をフル活用（iDeCo+合計2.3万円/月・小規模共済7万円/月＋設定中の社宅・出張旅費・経営セーフティ共済）した前提で逆算します。
      </p>

      {/* 額面 vs 役員報酬 の比較 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs text-gray-500">現職の額面年収</div>
          <div className="mt-1 text-xl font-bold tabular-nums">{fmtYen(r.employeeGrossSalary)}</div>
          <div className="text-[11px] tabular-nums text-gray-400">{fmtMan(r.employeeGrossSalary)}</div>
        </div>
        <div className="rounded-lg border border-blue-300 bg-blue-50 p-4">
          <div className="text-xs text-gray-500">提案する役員報酬（額面）</div>
          <div className="mt-1 text-xl font-bold tabular-nums">{fmtYen(r.annualDirectorSalary)}</div>
          <div className="text-[11px] tabular-nums text-gray-400">
            {fmtMan(r.annualDirectorSalary)}（月 {fmtYen(r.monthlyDirectorSalary)}）
          </div>
        </div>
      </div>

      <div
        className={`rounded-lg p-3 text-center text-sm font-semibold ${
          cheaper ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"
        }`}
      >
        {cheaper
          ? `現職より低い額面（${fmtYenSigned(diff)}）で、同等の将来資産込み総資産を提示できます`
          : `同等の総資産には現職額面より高い役員報酬（${fmtYenSigned(diff)}）が必要です`}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <Line label="達成する将来資産込み総資産（現職と同等）" value={fmtYen(r.achievedValue)} strong />
        <Line label="　うち実質手取り" value={fmtYen(r.result.effectiveNet)} />
        <Line label="　うち将来資産の積立（小規模・iDeCo）" value={`+${fmtYen(futureAsset)}`} />
        <Line label="会社の年間負担（報酬＋会社社保＋節税損金, 概算）" value={fmtYen(r.companyAnnualCost)} />
      </div>

      {r.reachedCap && (
        <p className="rounded bg-amber-50 p-2 text-xs text-amber-800">
          役員報酬を上限まで上げても現職と同等の総資産に届きませんでした。節税施策の前提を見直してください。
        </p>
      )}
      {r.insufficientProfit && (
        <p className="rounded bg-rose-50 p-2 text-xs text-rose-700">
          この役員報酬では「役員報酬支給前利益」が不足し、会社のキャッシュがマイナスです（法人ケースタブの支給前利益を増やすか報酬を下げてください）。会社が支払えるかの確認用です。
        </p>
      )}
      <p className="text-[11px] text-gray-400">
        ※ 比較は「現職の額面年収」と「提案する役員報酬（額面）」。同等性は将来資産込み総資産で判定しています。役員社宅・出張旅費・iDeCo+会社掛金などの非現金メリットがあるほど、低い額面でも同等の総資産を提示できます。
      </p>
    </div>
  );
}
