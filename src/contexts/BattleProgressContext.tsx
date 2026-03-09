import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface BattleProgressContextValue {
  completed: Record<number, boolean>;
  markCompleted: (dresseurId: number) => void;
}

const BattleProgressContext = createContext<BattleProgressContextValue | null>(null);

export const useBattleProgress = () => {
  const ctx = useContext(BattleProgressContext);
  if (!ctx) {
    throw new Error("useBattleProgress must be used within a BattleProgressProvider");
  }
  return ctx;
};

export const BattleProgressProvider = ({ children }: { children: ReactNode }) => {
  const [completed, setCompleted] = useState<Record<number, boolean>>({});

  const markCompleted = (dresseurId: number) => {
    setCompleted((prev) => ({ ...prev, [dresseurId]: true }));
  };

  return (
    <BattleProgressContext.Provider value={{ completed, markCompleted }}>
      {children}
    </BattleProgressContext.Provider>
  );
};
