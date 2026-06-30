import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SimulationInput } from "@/types/input";
import { defaultInput } from "@/lib/validation/schema";

export const deriveCareInsurance = (age: number): boolean =>
  age >= 40 && age < 65;

type Store = {
  input: SimulationInput;
  setInput: (input: SimulationInput) => void;
  reset: () => void;
};

// 入力値は localStorage に自動保存され、次回アクセス時の初期値として復元される。
// 「初期値に戻す」を押すとサンプル既定値(defaultInput)に戻る。
export const useSimStore = create<Store>()(
  persist(
    (set) => ({
      input: defaultInput,
      setInput: (input) =>
        set({
          input: {
            ...input,
            basic: {
              ...input.basic,
              hasCareInsurance: deriveCareInsurance(input.basic.age),
            },
          },
        }),
      reset: () => set({ input: defaultInput }),
    }),
    {
      name: "executive-comp-simulator-input",
      storage: createJSONStorage(() => localStorage),
      version: 5,
    },
  ),
);
