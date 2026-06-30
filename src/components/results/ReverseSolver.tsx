"use client";
import { useMemo } from "react";
import { useSimStore } from "@/lib/state/store";
import { solveDirectorSalaryForTakeHome } from "@/lib/calc/reverseSolver";
import { fmtYen, fmtMan } from "@/lib/utils/format";

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
  const corp = r.result.corporate;
  const futureAsset = r.result.futureAssetNet - r.achievedEffectiveNet; // 将来資産の積立額

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        会社員の実質手取り（目標 {fmtYen(r.targetEffectiveNet)}）と同じ実質手取りになる役員報酬を、
        節税をフル活用（iDeCo+合計2.3万円/月・小規模共済7万円/月＋設定中の社宅・出張旅費・経営セーフティ共済）した前提で逆算します。
      </p>

      <div className="rounded-lg border border-blue-300 bg-blue-50 p-4">
        <div className="text-xs text-gray-500">必要な役員報酬</div>
        <div className="mt-1 text-2xl font-bold tabular-nums">
          月 {fmtYen(r.monthlyDirectorSalary)}
        </div>
        <div className="text-sm tabular-nums text-gray-600">
          年 {fmtYen(r.annualDirectorSalary)}（{fmtMan(r.annualDirectorSalary)}）
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <Line label="達成した実質手取り（目標）" value={fmtYen(r.achievedEffectiveNet)} strong />
        <Line label="うち将来資産として積立（小規模・iDeCo）" value={`+${fmtYen(futureAsset)}`} />
        <Line label="将来資産込み手取り" value={fmtYen(r.result.futureAssetNet)} />
        <Line label="法人税等" value={fmtYen(corp?.corporateTax ?? 0)} />
        <Line label="法人残キャッシュ" value={fmtYen(corp?.remainingCash ?? 0)} />
        <Line label="個人＋法人合計" value={fmtYen(r.result.totalOwnerCash)} strong />
      </div>

      {r.reachedCap && (
        <p className="rounded bg-amber-50 p-2 text-xs text-amber-800">
          役員報酬を上限まで上げても会社員の実質手取りに届きませんでした（節税の現金拠出分が大きいため）。節税施策の金額を見直してください。
        </p>
      )}
      {r.insufficientProfit && (
        <p className="rounded bg-rose-50 p-2 text-xs text-rose-700">
          この役員報酬では「役員報酬支給前利益」が不足し、法人残キャッシュがマイナスです。法人ケースタブの支給前利益を増やすか、報酬を下げてください。
        </p>
      )}
      <p className="text-[11px] text-gray-400">
        ※ 小規模共済・iDeCo個人掛金は現金が将来資産にロックされるため、同じ実質手取りに届くには役員報酬が高くなります（その分、将来資産が積み上がります）。
      </p>
    </div>
  );
}
