"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useSimStore } from "@/lib/state/store";
import { simulate } from "@/lib/calc/simulator";
import { simulationSchema } from "@/lib/validation/schema";
import { BasicInfoForm } from "@/components/forms/BasicInfoForm";
import { EmployeeForm } from "@/components/forms/EmployeeForm";
import { CorporateForm } from "@/components/forms/CorporateForm";
import { TaxSavingForm } from "@/components/forms/TaxSavingForm";
import { SummaryCards } from "@/components/results/SummaryCards";
import { ComparisonTable } from "@/components/results/ComparisonTable";
import { CashflowChart } from "@/components/results/CashflowChart";
import { TaxBreakdown } from "@/components/results/TaxBreakdown";
import { TakeHomeTiers, SavingsEffect } from "@/components/results/SavingsEffect";
import { OptimizationRanking } from "@/components/results/OptimizationRanking";
import { ReverseSolver } from "@/components/results/ReverseSolver";
import { Disclaimer } from "@/components/Disclaimer";

const TABS = [
  { key: "basic", label: "基本情報" },
  { key: "employee", label: "会社員" },
  { key: "corporate", label: "法人" },
  { key: "taxSaving", label: "節税施策" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SimulatorPage() {
  const { input, reset } = useSimStore();
  const [tab, setTab] = useState<TabKey>("basic");

  const { result, error } = useMemo(() => {
    const parsed = simulationSchema.safeParse(input);
    if (!parsed.success)
      return { result: null, error: parsed.error.issues[0]?.message ?? "入力エラー" };
    try {
      return { result: simulate(input), error: null };
    } catch (e) {
      return { result: null, error: (e as Error).message };
    }
  }, [input]);

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">役員報酬・会社員 比較シミュレーター</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← トップ
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        {/* 入力パネル(タブ) */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                    tab === t.key
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {tab === "basic" && <BasicInfoForm />}
            {tab === "employee" && <EmployeeForm />}
            {tab === "corporate" && <CorporateForm />}
            {tab === "taxSaving" && <TaxSavingForm />}
            <button
              onClick={reset}
              className="mt-3 w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              入力を初期値に戻す
            </button>
          </div>
        </div>

        {/* 結果 */}
        <div className="space-y-6">
          {error && (
            <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}
          {result && (
            <>
              <SummaryCards result={result} />

              <section className="rounded-xl border border-gray-200 bg-white p-4">
                <h2 className="mb-2 font-semibold">比較表</h2>
                <ComparisonTable result={result} />
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <TakeHomeTiers result={result.corporate} />
                <SavingsEffect result={result.corporate} />
              </section>

              <section className="grid gap-6 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-2">
                <div>
                  <h2 className="mb-2 font-semibold">会社員 vs 法人（合計の構成）</h2>
                  <CashflowChart result={result} />
                </div>
                <div>
                  <h2 className="mb-2 font-semibold">法人役員の負担内訳</h2>
                  <TaxBreakdown result={result.corporate} />
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-4">
                <h2 className="mb-2 font-semibold">
                  逆算：会社員と同じ実質手取りに必要な役員報酬（節税フル活用）
                </h2>
                <ReverseSolver />
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-4">
                <h2 className="mb-2 font-semibold">最適報酬パターン（総当たり上位20）</h2>
                <OptimizationRanking />
              </section>
            </>
          )}
          <Disclaimer />
        </div>
      </div>
    </main>
  );
}
