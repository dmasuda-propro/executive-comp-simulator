"use client";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CaseResult } from "@/types/result";

const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6"];

export function TaxBreakdown({ result }: { result: CaseResult }) {
  const data = [
    { name: "社会保険(本人)", value: result.social.annualEmployee },
    { name: "所得税", value: result.incomeTax.total },
    { name: "住民税", value: result.residentTax.total },
    { name: "法人税等", value: result.corporate?.corporateTax ?? 0 },
  ].filter((d) => d.value > 0);
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} label>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => `${Number(v).toLocaleString()}円`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
