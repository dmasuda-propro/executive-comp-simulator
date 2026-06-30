"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SimulationResult } from "@/types/result";

export function CashflowChart({ result }: { result: SimulationResult }) {
  const data = [
    {
      name: "会社員",
      実質手取り: result.employee.effectiveNet,
      法人残: 0,
    },
    {
      name: "法人役員",
      実質手取り: result.corporate.effectiveNet,
      法人残: result.corporate.corporate?.remainingCash ?? 0,
    },
  ];
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} />
        <Tooltip formatter={(v) => `${Number(v).toLocaleString()}円`} />
        <Legend />
        <Bar dataKey="実質手取り" stackId="a" fill="#3b82f6" />
        <Bar dataKey="法人残" stackId="a" fill="#10b981" />
      </BarChart>
    </ResponsiveContainer>
  );
}
