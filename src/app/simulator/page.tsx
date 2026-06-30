"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSimStore } from "@/lib/state/store";
import { simulate, simulateMicroSchemeCase } from "@/lib/calc/simulator";
import { simulateCorporateFullTaxSaving } from "@/lib/calc/reverseSolver";
import { simulationSchema } from "@/lib/validation/schema";
import { IncomeBreakdown } from "@/components/results/IncomeBreakdown";
import { CompanyCostComparison } from "@/components/results/CompanyCostComparison";
import { BasicInfoForm } from "@/components/forms/BasicInfoForm";
import { EmployeeForm } from "@/components/forms/EmployeeForm";
import { DirectorPayForm } from "@/components/forms/DirectorPayForm";
import { TaxSavingForm } from "@/components/forms/TaxSavingForm";
import { MicroSchemeForm } from "@/components/forms/MicroSchemeForm";
import { Disclaimer } from "@/components/Disclaimer";

const TABS = [
  { key: "basic", label: "基本情報" },
  { key: "employee", label: "会社員" },
  { key: "director", label: "役員報酬" },
  { key: "micro", label: "業務委託" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SimulatorPage() {
  const { input, reset } = useSimStore();
  const [tab, setTab] = useState<TabKey>("basic");
  // localStorageから復元した入力でSSRと不整合が出ないよう、ハイドレーション後に描画
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const { cases, error } = useMemo(() => {
    const parsed = simulationSchema.safeParse(input);
    if (!parsed.success)
      return { cases: null, error: parsed.error.issues[0]?.message ?? "入力エラー" };
    try {
      const result = simulate(input);
      return {
        cases: [
          { header: "会社員（給与・賞与）", result: result.employee },
          { header: "法人役員（節税フル活用）", result: simulateCorporateFullTaxSaving(input) },
          { header: "業務委託（マイクロ法人）", result: simulateMicroSchemeCase(input) },
        ],
        error: null,
      };
    } catch (e) {
      return { cases: null, error: (e as Error).message };
    }
  }, [input]);

  if (!hydrated) {
    return (
      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        <p className="text-sm text-gray-400">読み込み中…</p>
      </main>
    );
  }

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
            {tab === "director" && (
              <div className="space-y-4">
                <DirectorPayForm />
                <TaxSavingForm />
              </div>
            )}
            {tab === "micro" && <MicroSchemeForm />}
            <button
              onClick={reset}
              className="mt-3 w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              サンプル値に戻す
            </button>
            <p className="mt-1 text-[11px] text-gray-400">
              入力した金額は自動保存され、次回アクセス時の初期値として復元されます。
            </p>
          </div>
        </div>

        {/* 結果 */}
        <div className="space-y-6">
          {error && (
            <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}
          {cases && (
            <>
              <IncomeBreakdown cases={cases} />
              <CompanyCostComparison cases={cases} />
            </>
          )}
          <Disclaimer />
        </div>
      </div>
    </main>
  );
}
