"use client";
import { useSimStore } from "@/lib/state/store";
import { NumberField, CheckField } from "./Field";

export function TaxSavingForm() {
  const { input, setInput } = useSimStore();
  const t = input.taxSaving;
  const patch = (p: Partial<typeof t>) =>
    setInput({ ...input, taxSaving: { ...t, ...p } });
  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 text-sm font-semibold">節税施策</legend>
      <CheckField label="社宅を利用" checked={t.companyHousingEnabled} onChange={(v) => patch({ companyHousingEnabled: v })} />
      <NumberField label="家賃(月)" value={t.monthlyRent} suffix="円" onChange={(v) => patch({ monthlyRent: v })} />
      <NumberField label="会社負担率(%)" value={Math.round(t.companyRentShareRate * 100)} step={5} suffix="%" onChange={(v) => patch({ companyRentShareRate: v / 100 })} />
      <CheckField label="iDeCo+を利用" checked={t.idecoPlusEnabled} onChange={(v) => patch({ idecoPlusEnabled: v })} />
      {t.idecoPlusEnabled && (
        <p className="rounded bg-amber-50 p-2 text-xs text-amber-800">
          iDeCo+（中小事業主掛金納付制度）は本来「iDeCoに加入する従業員」向けで、労使合意が必要です。従業員ゼロの一人社長（役員のみ）が利用できるかは公式に明確でなくグレーです。一人社長は「企業型DC」の方が一般的です。利用前に必ず専門家へ確認してください。
        </p>
      )}
      <NumberField label="iDeCo+会社分(月)" value={t.idecoPlusCompanyMonthly} onChange={(v) => patch({ idecoPlusCompanyMonthly: v })} />
      <NumberField label="iDeCo+個人分(月)" value={t.idecoPlusPersonalMonthly} onChange={(v) => patch({ idecoPlusPersonalMonthly: v })} />
      <NumberField label="小規模企業共済(月)" value={t.smallBusinessMutualMonthly} onChange={(v) => patch({ smallBusinessMutualMonthly: v })} />
      <NumberField label="経営セーフティ共済(年)" value={t.businessSafetyMutualAnnual} onChange={(v) => patch({ businessSafetyMutualAnnual: v })} />
      <CheckField label="出張旅費を利用" checked={t.travelAllowanceEnabled} onChange={(v) => patch({ travelAllowanceEnabled: v })} />
      <NumberField label="出張日数(月)" value={t.travelDaysPerMonth} step={1} onChange={(v) => patch({ travelDaysPerMonth: v })} />
      <NumberField label="日当(円/日)" value={t.travelAllowancePerDay} onChange={(v) => patch({ travelAllowancePerDay: v })} />
      <p className="text-xs text-gray-400">
        社宅・出張旅費メリットは概算です。役員社宅の賃貸料相当額は固定資産税評価額等で変わります。
      </p>
    </fieldset>
  );
}
