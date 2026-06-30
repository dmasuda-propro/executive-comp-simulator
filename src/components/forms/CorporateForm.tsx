"use client";
import { useSimStore } from "@/lib/state/store";
import { NumberField } from "./Field";

export function CorporateForm() {
  const { input, setInput } = useSimStore();
  const c = input.corporate;
  const patch = (p: Partial<typeof c>) =>
    setInput({ ...input, corporate: { ...c, ...p } });
  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 text-sm font-semibold">法人ケース</legend>
      <NumberField label="役員報酬支給前利益" value={c.preSalaryProfit} suffix="円" onChange={(v) => patch({ preSalaryProfit: v })} />
      <NumberField label="役員報酬(月)" value={c.monthlyDirectorSalary} suffix="円" onChange={(v) => patch({ monthlyDirectorSalary: v })} />
      <NumberField label="事前確定届出給与(年)" value={c.fixedBonusAnnual} suffix="円" onChange={(v) => patch({ fixedBonusAnnual: v })} />
      <NumberField label="役員賞与回数(0-3)" value={c.fixedBonusCount} step={1} onChange={(v) => patch({ fixedBonusCount: v })} />
      <NumberField label="法人実効税率(%)" value={Math.round(c.corporateTaxRate * 100)} step={1} suffix="%" onChange={(v) => patch({ corporateTaxRate: v / 100 })} />
    </fieldset>
  );
}
