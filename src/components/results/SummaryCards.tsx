import type { SimulationResult } from "@/types/result";
import { fmtYen, fmtMan, fmtYenSigned } from "@/lib/utils/format";

function BigCard({
  title,
  value,
  win,
  sub,
}: {
  title: string;
  value: number;
  win?: boolean;
  sub?: string;
}) {
  return (
    <div
      className={`relative rounded-xl border p-4 ${
        win ? "border-blue-400 bg-blue-50 ring-1 ring-blue-300" : "border-gray-200 bg-white"
      }`}
    >
      {win && (
        <span className="absolute -top-2 right-3 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
          有利
        </span>
      )}
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{fmtMan(value)}</div>
      <div className="text-[11px] tabular-nums text-gray-400">{fmtYen(value)}</div>
      {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

function MiniCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-0.5 text-base font-semibold tabular-nums">{fmtYen(value)}</div>
    </div>
  );
}

export function SummaryCards({ result }: { result: SimulationResult }) {
  const { employee, corporate, difference } = result;
  const corpWins = difference.totalOwnerCash >= 0;
  const diff = difference.totalOwnerCash;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <BigCard
          title="会社員：個人＋法人合計"
          value={employee.totalOwnerCash}
          win={!corpWins}
        />
        <BigCard
          title="法人役員：個人＋法人合計"
          value={corporate.totalOwnerCash}
          win={corpWins}
        />
      </div>
      <div
        className={`rounded-lg p-3 text-center text-sm font-semibold ${
          corpWins ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"
        }`}
      >
        {corpWins ? "法人化が有利" : "会社員が有利"}：合計差額 {fmtYenSigned(diff)}
        <span className="ml-1 font-normal text-gray-500">（{fmtMan(Math.abs(diff))}）</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniCard title="法人 実質手取り" value={corporate.effectiveNet} />
        <MiniCard title="会社員 実質手取り" value={employee.effectiveNet} />
        <MiniCard title="法人残キャッシュ" value={corporate.corporate?.remainingCash ?? 0} />
        <MiniCard title="法人税等" value={corporate.corporate?.corporateTax ?? 0} />
      </div>
    </div>
  );
}
