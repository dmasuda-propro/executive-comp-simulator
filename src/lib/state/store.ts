import { create } from "zustand";
import type { SimulationInput } from "@/types/input";
import { defaultInput } from "@/lib/validation/schema";

export const deriveCareInsurance = (age: number): boolean =>
  age >= 40 && age < 65;

type Store = {
  input: SimulationInput;
  setInput: (input: SimulationInput) => void;
  reset: () => void;
};

export const useSimStore = create<Store>((set) => ({
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
}));
