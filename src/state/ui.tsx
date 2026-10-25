import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useStore } from "./store";

export type SheetKind = "food" | "weight" | "workout" | "dieta" | "onboarding" | null;

interface UiCtx {
  sheet: SheetKind;
  foodMealId: string | null;
  workoutMod: string | null;
  sub: Record<string, string>;
  openFood: (mealId?: string) => void;
  openWeight: () => void;
  openWorkout: (modalidade?: string) => void;
  openDieta: () => void;
  openOnboarding: () => void;
  close: () => void;
  /** navega para uma área (e opcionalmente uma sub-aba dela) */
  go: (screen: string, sub?: string) => void;
  setSub: (screen: string, sub: string) => void;
  toast: string;
  notify: (msg: string) => void;
}

const Ctx = createContext<UiCtx | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const { dispatch } = useStore();
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [foodMealId, setFoodMealId] = useState<string | null>(null);
  const [workoutMod, setWorkoutMod] = useState<string | null>(null);
  const [sub, setSubs] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");

  const setSub = useCallback((screen: string, s: string) => setSubs((x) => ({ ...x, [screen]: s })), []);
  const go = useCallback(
    (screen: string, s?: string) => {
      dispatch({ type: "SET_SCREEN", screen });
      if (s) setSub(screen, s);
      window.scrollTo({ top: 0 });
    },
    [dispatch, setSub],
  );
  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? "" : t)), 2600);
  }, []);

  const value = useMemo<UiCtx>(
    () => ({
      sheet, foodMealId, workoutMod, sub, toast, notify, go, setSub,
      openFood: (id) => { setFoodMealId(id ?? null); setSheet("food"); },
      openWeight: () => setSheet("weight"),
      openWorkout: (m) => { setWorkoutMod(m ?? null); setSheet("workout"); },
      openDieta: () => setSheet("dieta"),
      openOnboarding: () => setSheet("onboarding"),
      close: () => setSheet(null),
    }),
    [sheet, foodMealId, workoutMod, sub, toast, notify, go, setSub],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUi() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useUi fora do UiProvider");
  return c;
}
