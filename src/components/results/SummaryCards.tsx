import type { SimulationResult } from "@/types/result";
import { fmtYen } from "@/lib/utils/format";

function Card({
  title,
  value,
  accent,
}: {
  title: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${accent ? "border-blue-300 bg-blue-50" : "bg-white"}`}
    >
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-1 text-lg font-bold">{fmtYen(value)}</div>
    </div>
  );
}

export function SummaryCards({ result }: { result: SimulationResult }) {
  const { employee, corporate, difference } = result;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      <Card title="会社員 実質手取り" value={employee.effectiveNet} />
      <Card title="法人 実質手取り" value={corporate.effectiveNet} />
      <Card title="法人残キャッシュ" value={corporate.corporate?.remainingCash ?? 0} />
      <Card title="法人 個人＋法人合計" value={corporate.totalOwnerCash} accent />
      <Card title="会社員との合計差額" value={difference.totalOwnerCash} accent />
      <Card title="法人税等" value={corporate.corporate?.corporateTax ?? 0} />
    </div>
  );
}
