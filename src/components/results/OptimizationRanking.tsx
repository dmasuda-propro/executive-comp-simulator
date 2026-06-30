"use client";
import { useState } from "react";
import { useSimStore } from "@/lib/state/store";
import { optimize } from "@/lib/calc/optimizer";
import type { OptimizationInput } from "@/types/input";
import type { OptimizationResult } from "@/types/result";
import { fmtYen } from "@/lib/utils/format";

export function OptimizationRanking() {
  const { input } = useSimStore();
  const [opt, setOpt] = useState<OptimizationInput>({
    preSalaryProfit: input.corporate.preSalaryProfit,
    monthlySalaryMin: 100_000,
    monthlySalaryMax: 1_000_000,
    monthlySalaryStep: 50_000,
    bonusMin: 0,
    bonusMax: 3_000_000,
    bonusStep: 500_000,
  });
  const [rows, setRows] = useState<OptimizationResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    try {
      setError(null);
      setRows(
        optimize(input, {
          ...opt,
          preSalaryProfit: input.corporate.preSalaryProfit,
        }),
      );
    } catch (e) {
      setError((e as Error).message);
      setRows([]);
    }
  };

  const numField = (
    label: string,
    key: keyof OptimizationInput,
    step: number,
  ) => (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-gray-500">{label}</span>
      <input
        type="number"
        step={step}
        className="w-full rounded border px-2 py-1"
        value={opt[key]}
        onChange={(e) => setOpt({ ...opt, [key]: Number(e.target.value) })}
      />
    </label>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {numField("月給 下限", "monthlySalaryMin", 10_000)}
        {numField("月給 上限", "monthlySalaryMax", 10_000)}
        {numField("月給 刻み", "monthlySalaryStep", 10_000)}
        {numField("賞与 下限", "bonusMin", 100_000)}
        {numField("賞与 上限", "bonusMax", 100_000)}
        {numField("賞与 刻み", "bonusStep", 100_000)}
      </div>
      <button
        onClick={run}
        className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
      >
        最適パターンを計算
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {rows.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">順位</th>
              <th>月給</th>
              <th>賞与</th>
              <th className="text-right">実質手取り</th>
              <th className="text-right">法人残</th>
              <th className="text-right">合計</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b">
                <td className="py-1.5">{i + 1}</td>
                <td>{fmtYen(r.monthlyDirectorSalary)}</td>
                <td>{fmtYen(r.fixedBonusAnnual)}</td>
                <td className="text-right">{fmtYen(r.effectiveNet)}</td>
                <td className="text-right">{fmtYen(r.corporateRemainingCash)}</td>
                <td className="text-right font-semibold">
                  {fmtYen(r.totalOwnerCash)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
