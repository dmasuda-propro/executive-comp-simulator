"use client";
import { useSimStore } from "@/lib/state/store";
import { NumberField } from "./Field";

export function MicroSchemeForm() {
  const { input, setInput } = useSimStore();
  const m = input.microScheme;
  const patch = (p: Partial<typeof m>) =>
    setInput({ ...input, microScheme: { ...m, ...p } });
  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 text-sm font-semibold">業務委託（マイクロ法人スキーム）</legend>
      <NumberField label="業務委託 年間報酬（本業）" value={m.contractRevenueAnnual} suffix="円" onChange={(v) => patch({ contractRevenueAnnual: v })} />
      <NumberField label="経費（年）" value={m.contractExpensesAnnual} suffix="円" onChange={(v) => patch({ contractExpensesAnnual: v })} />
      <NumberField label="マイクロ法人 役員報酬(月)" value={m.microMonthlySalary} suffix="円" onChange={(v) => patch({ microMonthlySalary: v })} hint="社保を最低等級にするため5.5万円程度。標準報酬5.8万(厚年は下限8.8万)で算定" />
      <p className="text-xs text-gray-400">
        別会社（マイクロ法人・売上80万円は別管理）から役員報酬5.5万円を受け、社会保険を最低額で固定。本業は業務委託（事業所得・青色申告特別控除65万）で受け取り、社会保険の対象外。所得税・住民税は事業所得＋給与所得で計算します。
      </p>
    </fieldset>
  );
}
