"use client";
import { useSimStore } from "@/lib/state/store";
import { NumberField } from "./Field";

export function DirectorPayForm() {
  const { input, setInput } = useSimStore();
  const c = input.corporate;
  const patch = (p: Partial<typeof c>) =>
    setInput({ ...input, corporate: { ...c, ...p } });
  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 text-sm font-semibold">役員報酬</legend>
      <NumberField label="役員報酬(月)" value={c.monthlyDirectorSalary} suffix="円" onChange={(v) => patch({ monthlyDirectorSalary: v })} />
      <NumberField label="事前確定届出給与(年)" value={c.fixedBonusAnnual} suffix="円" onChange={(v) => patch({ fixedBonusAnnual: v })} />
      <NumberField label="役員賞与回数(0-3)" value={c.fixedBonusCount} step={1} onChange={(v) => patch({ fixedBonusCount: v })} />
      <p className="text-xs text-gray-400">
        事前確定届出給与は年3回まで（年4回以上は社会保険上は報酬扱い）。
      </p>
    </fieldset>
  );
}
