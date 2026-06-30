"use client";
import { useSimStore } from "@/lib/state/store";
import { NumberField, CheckField } from "./Field";

export function BasicInfoForm() {
  const { input, setInput } = useSimStore();
  const b = input.basic;
  const patch = (p: Partial<typeof b>) =>
    setInput({ ...input, basic: { ...b, ...p } });
  const dep = b.dependents;
  const patchDep = (p: Partial<typeof dep>) =>
    patch({ dependents: { ...dep, ...p } });
  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 text-sm font-semibold">基本情報</legend>
      <NumberField label="年齢" value={b.age} step={1} onChange={(v) => patch({ age: v })} />
      <NumberField label="計算年度" value={b.simulationYear} step={1} onChange={(v) => patch({ simulationYear: v })} />
      <CheckField label="配偶者控除を適用（一般）" checked={b.spouseDeduction} onChange={(v) => patch({ spouseDeduction: v })} />
      <p className="pt-1 text-xs font-medium text-gray-500">扶養親族（区分別人数）</p>
      <NumberField label="一般扶養(16-18,23-69)" value={dep.general} step={1} onChange={(v) => patchDep({ general: v })} />
      <NumberField label="特定扶養(19-22)" value={dep.specific} step={1} onChange={(v) => patchDep({ specific: v })} />
      <NumberField label="老人扶養(70+,非同居)" value={dep.elderly} step={1} onChange={(v) => patchDep({ elderly: v })} />
      <NumberField label="同居老親等(70+,同居)" value={dep.coresidentElderly} step={1} onChange={(v) => patchDep({ coresidentElderly: v })} />
      <p className="pt-1 text-xs font-medium text-gray-500">その他の控除</p>
      <NumberField label="一般障害者(人数)" value={b.disabilityGeneral} step={1} onChange={(v) => patch({ disabilityGeneral: v })} hint="本人・配偶者・扶養親族の該当人数。所得税27万/住民税26万/人" />
      <NumberField label="特別障害者(人数)" value={b.disabilitySpecial} step={1} onChange={(v) => patch({ disabilitySpecial: v })} hint="所得税40万/住民税30万/人(非同居)" />
      <NumberField label="年間医療費(自己負担)" value={b.medicalExpenseAnnual} suffix="円" onChange={(v) => patch({ medicalExpenseAnnual: v })} hint="医療費 −10万円(または所得5%)が控除に。上限200万円" />
      <p className="text-xs text-gray-400">
        介護保険は40〜65歳で自動適用（現在: {b.hasCareInsurance ? "適用" : "なし"}）
      </p>
    </fieldset>
  );
}
