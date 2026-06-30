"use client";
import { useState } from "react";
import { fmtMan } from "@/lib/utils/format";

export function NumberField({
  label,
  value,
  onChange,
  step = 1000,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  suffix?: string;
  hint?: string;
}) {
  // フォーカス中は入力中の文字列(空欄や途中入力)をそのまま表示し、0が消せない問題を解消する
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");
  // 非フォーカス時: 0は空欄(placeholder)で表示し、頭の0を消しやすくする
  const display = focused ? draft : value === 0 ? "" : String(value);

  // 円単位の項目は 1万円以上で 万円換算をヒント表示
  const autoHint =
    hint ?? (suffix === "円" && Math.abs(value) >= 10000 ? `= ${fmtMan(value)}` : undefined);

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-700">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          inputMode="numeric"
          placeholder="0"
          className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-right tabular-nums focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={display}
          step={step}
          onFocus={() => {
            setDraft(value === 0 ? "" : String(value));
            setFocused(true);
          }}
          onChange={(e) => {
            const t = e.target.value;
            setDraft(t);
            const n = t === "" ? 0 : Number(t);
            if (!Number.isNaN(n)) onChange(n);
          }}
          onBlur={() => setFocused(false)}
        />
        {suffix && (
          <span className="w-6 shrink-0 text-xs text-gray-400">{suffix}</span>
        )}
      </div>
      {autoHint && (
        <span className="text-[11px] tabular-nums text-gray-400">{autoHint}</span>
      )}
    </label>
  );
}

export function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-gray-700">{label}</span>
    </label>
  );
}
