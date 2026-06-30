import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">役員報酬・会社員比較シミュレーター</h1>
      <p className="mt-3 text-sm text-gray-600">
        会社員として働く場合と、法人化して役員報酬・節税施策（iDeCo+・小規模企業共済・社宅・出張旅費）を使う場合の手取り・法人残・合計キャッシュを比較します。
      </p>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-gray-600">
        <li>会社員比較モード：給与・賞与・社会保険・所得税・住民税の手取り</li>
        <li>法人役員モード：役員報酬・事前確定届出給与・法人税・法人残</li>
        <li>最適化モード：役員報酬と賞与を総当たりし合計キャッシュ上位を表示</li>
      </ul>
      <div className="mt-6 flex gap-3">
        <Link
          href="/simulator"
          className="rounded bg-blue-600 px-5 py-2 text-white"
        >
          シミュレーターを開く
        </Link>
      </div>
      <Disclaimer />
    </main>
  );
}
