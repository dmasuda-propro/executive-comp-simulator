import type { RateMaster } from "./types";
import { rateMaster2026 } from "./2026";

const REGISTRY: Record<number, RateMaster> = { 2026: rateMaster2026 };

export function getRateMaster(year: number): RateMaster {
  const m = REGISTRY[year];
  if (!m) throw new Error(`料率マスタが未登録の年度です: ${year}`);
  return m;
}

export type { RateMaster, StandardRemunerationGrade } from "./types";
