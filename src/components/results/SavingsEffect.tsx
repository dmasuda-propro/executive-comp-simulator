import type { CaseResult } from "@/types/result";
import { fmtYen } from "@/lib/utils/format";

function Row({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-gray-100 py-1.5 text-sm">
      <span className="text-gray-600">
        {label}
        {note && <span className="ml-1 text-[11px] text-gray-400">{note}</span>}
      </span>
      <span className="tabular-nums font-medium">{fmtYen(value)}</span>
    </div>
  );
}

export function TakeHomeTiers({ result }: { result: CaseResult }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-1 text-sm font-semibold">手取りの3区分（{result.label}）</h3>
      <Row label="現金手取り" value={result.cashNet} note="実際に手元に残る現金" />
      <Row label="実質手取り" value={result.effectiveNet} note="社宅・旅費等の経済的メリット込み" />
      <Row label="将来資産込み" value={result.futureAssetNet} note="iDeCo・共済の積立を加算" />
    </div>
  );
}

export function SavingsEffect({ result }: { result: CaseResult }) {
  const ts = result.taxSaving;
  const items: { label: string; value: number; note: string }[] = [
    { label: "社宅（会社負担家賃）", value: ts.housingBenefit, note: "法人損金＋個人メリット" },
    { label: "出張旅費・日当", value: ts.travelAllowanceAnnual, note: "法人損金＋非課税受取" },
    { label: "iDeCo+（会社掛金）", value: result.ideco.companyAnnual, note: "全額損金・個人非課税" },
    { label: "iDeCo+（個人掛金）", value: result.ideco.personalAnnual, note: "所得控除" },
    { label: "小規模企業共済", value: ts.smallBusinessMutualAnnual, note: "所得控除" },
    { label: "経営セーフティ共済", value: ts.businessSafetyMutualAnnual, note: "法人損金" },
  ].filter((i) => i.value > 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-1 text-sm font-semibold">節税施策の内訳（年額）</h3>
      {items.length === 0 ? (
        <p className="py-2 text-sm text-gray-400">節税施策が選択されていません。</p>
      ) : (
        items.map((i) => <Row key={i.label} label={i.label} value={i.value} note={i.note} />)
      )}
    </div>
  );
}
