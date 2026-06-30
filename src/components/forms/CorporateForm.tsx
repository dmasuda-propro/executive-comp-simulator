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
      <legend className="px-1 text-sm font-semibold">法人</legend>
      <NumberField label="役員報酬支給前利益（年）" value={c.preSalaryProfit} suffix="円" onChange={(v) => patch({ preSalaryProfit: v })} />
      <NumberField label="法人実効税率(%)" value={Math.round(c.corporateTaxRate * 100)} step={1} suffix="%" onChange={(v) => patch({ corporateTaxRate: v / 100 })} />
      <p className="text-xs text-gray-400">
        売上−外注費−経費＝役員報酬支給前利益。実効税率は中小法人で概ね25〜35%（既定30%）。
      </p>
    </fieldset>
  );
}
