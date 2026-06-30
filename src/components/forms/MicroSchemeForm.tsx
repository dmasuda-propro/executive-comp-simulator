"use client";
import { useSimStore } from "@/lib/state/store";
import { NumberField, CheckField } from "./Field";

export function MicroSchemeForm() {
  const { input, setInput } = useSimStore();
  const m = input.microScheme;
  const patch = (p: Partial<typeof m>) =>
    setInput({ ...input, microScheme: { ...m, ...p } });
  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 text-sm font-semibold">業務委託（マイクロ法人スキーム）</legend>
      <NumberField label="業務委託 年間報酬（本業・税抜）" value={m.contractRevenueAnnual} suffix="円" onChange={(v) => patch({ contractRevenueAnnual: v })} />
      <NumberField label="経費（年）" value={m.contractExpensesAnnual} suffix="円" onChange={(v) => patch({ contractExpensesAnnual: v })} />
      <NumberField label="マイクロ法人 役員報酬(月)" value={m.microMonthlySalary} suffix="円" onChange={(v) => patch({ microMonthlySalary: v })} hint="社保を最低等級にするため5.5万円程度。標準報酬5.8万(厚年は下限8.8万)で算定" />
      <NumberField label="小規模企業共済(月)" value={m.smallBusinessMutualMonthly} suffix="円" onChange={(v) => patch({ smallBusinessMutualMonthly: v })} hint="全額所得控除。上限7万円。マイクロ法人役員/個人事業主として加入可" />
      <NumberField label="iDeCo 個人掛金(月)" value={m.idecoMonthly} suffix="円" onChange={(v) => patch({ idecoMonthly: v })} hint="全額所得控除。第2号(企業年金なし)上限6.2万円" />
      <CheckField label="消費税を課す（個人事業主・簡易課税）" checked={m.consumptionTaxEnabled} onChange={(v) => patch({ consumptionTaxEnabled: v })} />
      <NumberField label="消費税 対売上率(%)" value={Math.round(m.consumptionTaxRate * 100)} step={1} suffix="%" onChange={(v) => patch({ consumptionTaxRate: v / 100 })} hint="簡易課税サービス業(第5種・みなし仕入率50%)＝売上の5%" />
      <CheckField label="個人事業税を課す" checked={m.businessTaxEnabled} onChange={(v) => patch({ businessTaxEnabled: v })} />
      <NumberField label="個人事業税率(%)" value={Math.round(m.businessTaxRate * 100)} step={1} suffix="%" onChange={(v) => patch({ businessTaxRate: v / 100 })} hint="標準5%(請負業・コンサル等)。事業主控除290万円を差し引いて課税" />
      <p className="text-xs text-gray-400">
        別会社（マイクロ法人・売上80万円は別管理）から役員報酬5.5万円を受け、社会保険を最低額で固定。本業は業務委託（事業所得・青色65万）で受け取り社保対象外。本人は簡易課税で消費税5%を納付、自社は本則課税で消費税10%を仕入税額控除できます。
      </p>
    </fieldset>
  );
}
