"use client";
import { useMemo } from "react";
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
import { OptimizationRanking } from "@/components/results/OptimizationRanking";
import { Disclaimer } from "@/components/Disclaimer";

export default function SimulatorPage() {
  const { input } = useSimStore();
  const { result, error } = useMemo(() => {
    const parsed = simulationSchema.safeParse(input);
    if (!parsed.success)
      return {
        result: null,
        error: parsed.error.issues[0]?.message ?? "入力エラー",
      };
    try {
      return { result: simulate(input), error: null };
    } catch (e) {
      return { result: null, error: (e as Error).message };
    }
  }, [input]);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-xl font-bold">シミュレーター</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <BasicInfoForm />
          <EmployeeForm />
          <CorporateForm />
          <TaxSavingForm />
        </div>
        <div className="space-y-6">
          {error && (
            <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}
          {result && (
            <>
              <SummaryCards result={result} />
              <section>
                <h2 className="mb-2 font-semibold">比較表</h2>
                <ComparisonTable result={result} />
              </section>
              <section className="grid gap-6 md:grid-cols-2">
                <div>
                  <h2 className="mb-2 font-semibold">会社員 vs 法人</h2>
                  <CashflowChart result={result} />
                </div>
                <div>
                  <h2 className="mb-2 font-semibold">法人役員の負担内訳</h2>
                  <TaxBreakdown result={result.corporate} />
                </div>
              </section>
              <section>
                <h2 className="mb-2 font-semibold">最適報酬パターン</h2>
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
