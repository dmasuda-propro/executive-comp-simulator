"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSimStore } from "@/lib/state/store";
import { simulate } from "@/lib/calc/simulator";
import { ComparisonTable } from "@/components/results/ComparisonTable";
import { TaxBreakdown } from "@/components/results/TaxBreakdown";
import { Disclaimer } from "@/components/Disclaimer";

export default function ResultPage() {
  const { input } = useSimStore();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const result = useMemo(() => simulate(input), [input]);
  if (!hydrated)
    return (
      <main className="mx-auto max-w-4xl p-6">
        <p className="text-sm text-gray-400">読み込み中…</p>
      </main>
    );
  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link href="/simulator" className="text-sm text-blue-600">
        ← 入力に戻る
      </Link>
      <h1 className="my-4 text-xl font-bold">結果詳細</h1>
      <ComparisonTable result={result} />
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-2 font-semibold">会社員 負担内訳</h2>
          <TaxBreakdown result={result.employee} />
        </div>
        <div>
          <h2 className="mb-2 font-semibold">法人役員 負担内訳</h2>
          <TaxBreakdown result={result.corporate} />
        </div>
      </div>
      <Disclaimer />
    </main>
  );
}
