import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

interface PersistedBattleProgress {
  completed: Record<number, boolean>;
  completedByGeneration: Record<number, Record<number, boolean>>;
}

interface BattleProgressContextValue {
  completed: Record<number, boolean>;
  completedByGeneration: Record<number, Record<number, boolean>>;
  markCompleted: (dresseurId: number, generation: number) => void;
  getCompletedCountForGeneration: (generation: number) => number;
}

const createEmptyProgress = (): PersistedBattleProgress => ({
  completed: {},
  completedByGeneration: {},
});

const getBattleProgressStorageKey = (userId?: number | null) =>
  `battleProgress:${userId ?? "guest"}`;

const readPersistedBattleProgress = (
  userId?: number | null,
): PersistedBattleProgress => {
  if (typeof window === "undefined") {
    return createEmptyProgress();
  }

  try {
    const storedValue = localStorage.getItem(getBattleProgressStorageKey(userId));
    if (!storedValue) {
      return createEmptyProgress();
    }

    const parsed = JSON.parse(storedValue) as Partial<PersistedBattleProgress>;
    return {
      completed: parsed.completed ?? {},
      completedByGeneration: parsed.completedByGeneration ?? {},
    };
  } catch {
    return createEmptyProgress();
  }
};

const BattleProgressContext = createContext<BattleProgressContextValue | null>(null);

export const useBattleProgress = () => {
  const ctx = useContext(BattleProgressContext);
  if (!ctx) {
    throw new Error("useBattleProgress must be used within a BattleProgressProvider");
  }
  return ctx;
};

export const BattleProgressProvider = ({
  children,
  userId,
}: {
  children: ReactNode;
  userId?: number | null;
}) => {
  const [completed, setCompleted] = useState<Record<number, boolean>>(() =>
    readPersistedBattleProgress(userId).completed,
  );
  const [completedByGeneration, setCompletedByGeneration] = useState<
    Record<number, Record<number, boolean>>
  >(() => readPersistedBattleProgress(userId).completedByGeneration);

  useEffect(() => {
    const persistedProgress = readPersistedBattleProgress(userId);
    setCompleted(persistedProgress.completed);
    setCompletedByGeneration(persistedProgress.completedByGeneration);
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.setItem(
      getBattleProgressStorageKey(userId),
      JSON.stringify({ completed, completedByGeneration }),
    );
  }, [completed, completedByGeneration, userId]);

  const markCompleted = (dresseurId: number, generation: number) => {
    setCompleted((prev) => ({ ...prev, [dresseurId]: true }));
    setCompletedByGeneration((prev) => ({
      ...prev,
      [generation]: {
        ...(prev[generation] || {}),
        [dresseurId]: true,
      },
    }));
  };

  const getCompletedCountForGeneration = (generation: number) => {
    return Object.keys(completedByGeneration[generation] || {}).length;
  };

  return (
    <BattleProgressContext.Provider
      value={{
        completed,
        completedByGeneration,
        markCompleted,
        getCompletedCountForGeneration,
      }}
    >
      {children}
    </BattleProgressContext.Provider>
  );
};
