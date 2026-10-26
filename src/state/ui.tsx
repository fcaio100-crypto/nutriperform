import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useStore } from "./store";
import type { Workout } from "../lib/types";

export type SheetKind = "food" | "weight" | "workout" | "treino" | "dieta" | "onboarding" | "share" | null;

interface UiCtx {
  sheet: SheetKind;
  foodMealId: string | null;
  workoutMod: string | null;
  treino: { mod: string; date: string } | null;
  sub: Record<string, string>;
  openFood: (mealId?: string) => void;
  openWeight: () => void;
  /** registro livre de uma atividade */
  openWorkout: (modalidade?: string) => void;
  /** treino guiado (lista de exercícios / registro da modalidade) */
  openTreino: (mod: string, date: string) => void;
  openDieta: () => void;
  openOnboarding: () => void;
  /** card do treino para postar (estilo Strava) */
  openShare: (w: Workout) => void;
  shareWorkout: Workout | null;
  close: () => void;
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
  const [treino, setTreino] = useState<{ mod: string; date: string } | null>(null);
  const [sub, setSubs] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");
  const [shareWorkout, setShareWorkout] = useState<Workout | null>(null);

  const setSub = useCallback((screen: string, s: string) => {
    setSubs((x) => ({ ...x, [screen]: s }));
    window.scrollTo({ top: 0 });
  }, []);
  const go = useCallback(
    (screen: string, s?: string) => {
      dispatch({ type: "SET_SCREEN", screen });
      setSubs((x) => ({ ...x, [screen]: s ?? "" }));
      window.scrollTo({ top: 0 });
    },
    [dispatch],
  );
  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? "" : t)), 2600);
  }, []);

  const value = useMemo<UiCtx>(
    () => ({
      sheet, foodMealId, workoutMod, treino, sub, toast, notify, go, setSub, shareWorkout,
      openShare: (w) => { setShareWorkout(w); setSheet("share"); },
      openFood: (id) => { setFoodMealId(id ?? null); setSheet("food"); },
      openWeight: () => setSheet("weight"),
      openWorkout: (m) => { setWorkoutMod(m ?? null); setSheet("workout"); },
      openTreino: (mod, date) => { setTreino({ mod, date }); setSheet("treino"); },
      openDieta: () => setSheet("dieta"),
      openOnboarding: () => setSheet("onboarding"),
      close: () => setSheet(null),
    }),
    [sheet, foodMealId, workoutMod, treino, sub, toast, notify, go, setSub, shareWorkout],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUi() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useUi fora do UiProvider");
  return c;
}
