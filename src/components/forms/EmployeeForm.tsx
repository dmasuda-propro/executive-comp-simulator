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
      <NumberField label="家賃補助(年)" value={e.rentSubsidyAnnual} suffix="円" onChange={(v) => patch({ rentSubsidyAnnual: v })} />
      <NumberField label="iDeCo(月)" value={e.employeeIdecoMonthly} onChange={(v) => patch({ employeeIdecoMonthly: v })} />
    </fieldset>
  );
}
