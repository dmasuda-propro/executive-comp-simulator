"use client";
import { useSimStore } from "@/lib/state/store";
import { NumberField } from "./Field";

export function EmployeeForm() {
  const { input, setInput } = useSimStore();
  const e = input.employee;
  const patch = (p: Partial<typeof e>) =>
    setInput({ ...input, employee: { ...e, ...p } });
  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 text-sm font-semibold">会社員ケース</legend>
      <NumberField label="月給" value={e.monthlySalary} suffix="円" onChange={(v) => patch({ monthlySalary: v })} />
      <NumberField label="年間賞与" value={e.annualBonus} suffix="円" onChange={(v) => patch({ annualBonus: v })} />
      <NumberField label="賞与回数" value={e.bonusCount} step={1} onChange={(v) => patch({ bonusCount: v })} />
      <NumberField label="家賃補助(年・課税)" value={e.rentSubsidyAnnual} suffix="円" onChange={(v) => patch({ rentSubsidyAnnual: v })} hint="現金給付は課税給与・社保対象として計算" />
      <NumberField label="iDeCo 個人掛金(月)" value={e.employeeIdecoMonthly} hint="会社員も加入可。掛金は全額所得控除（小規模企業共済等掛金控除）" onChange={(v) => patch({ employeeIdecoMonthly: v })} />
    </fieldset>
  );
}
