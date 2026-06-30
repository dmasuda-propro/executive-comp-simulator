"use client";
import { useSimStore } from "@/lib/state/store";
import { NumberField, CheckField } from "./Field";

export function BasicInfoForm() {
  const { input, setInput } = useSimStore();
  const b = input.basic;
  const patch = (p: Partial<typeof b>) =>
    setInput({ ...input, basic: { ...b, ...p } });
  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 text-sm font-semibold">基本情報</legend>
      <NumberField label="年齢" value={b.age} step={1} onChange={(v) => patch({ age: v })} />
      <NumberField label="扶養人数" value={b.dependents} step={1} onChange={(v) => patch({ dependents: v })} />
      <NumberField label="計算年度" value={b.simulationYear} step={1} onChange={(v) => patch({ simulationYear: v })} />
      <CheckField label="配偶者控除を適用" checked={b.spouseDeduction} onChange={(v) => patch({ spouseDeduction: v })} />
      <p className="text-xs text-gray-400">
        介護保険は40〜65歳で自動適用（現在: {b.hasCareInsurance ? "適用" : "なし"}）
      </p>
    </fieldset>
  );
}
