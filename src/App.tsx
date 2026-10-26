import { useEffect } from "react";
import { useStore } from "./state/store";
import { useUi } from "./state/ui";
import Auth from "./screens/Auth";
import Hoje from "./screens/Hoje";
import Historico from "./screens/Historico";
import Eu from "./screens/Eu";
import Assistente from "./screens/Assistente";
import Onboarding from "./sheets/Onboarding";
import AddFood from "./sheets/AddFood";
import Weight from "./sheets/Weight";
import WorkoutLog from "./sheets/WorkoutLog";
import Dieta from "./sheets/Dieta";
import TreinoGuiado from "./sheets/TreinoGuiado";
import { BottomNav, Toast } from "./components/shell";
import { supabase } from "./lib/supabase";
import { LogoMark } from "./components/Logo";

const SCREENS: Record<string, () => JSX.Element> = { hoje: Hoje, assistente: Assistente, historico: Historico, eu: Eu };

export default function App() {
  const { state, sync } = useStore();
  const { sheet, openOnboarding } = useUi();
  const logado = !!state.auth.currentUserEmail;

  useEffect(() => {
    if (logado && !state.onboardingDone) openOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logado, state.onboardingDone]);

  if (supabase && sync === "checking")
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="animate-pulse"><LogoMark size={64} /></div>
        <span className="text-[13px] text-ink-mute font-semibold">Carregando seus dados…</span>
      </div>
    );
  if (!logado) return <Auth />;
  const Screen = SCREENS[state.screen] ?? Hoje;

  return (
    <div className="min-h-screen">
      <main key={state.screen} className="max-w-[560px] mx-auto px-4 pt-5 pb-28 flex flex-col gap-4 anim-fade" style={{ paddingTop: "max(20px, env(safe-area-inset-top))" }}>
        <Screen />
      </main>
      <BottomNav />
      <Toast />
      {sheet === "onboarding" && <Onboarding />}
      {sheet === "food" && <AddFood />}
      {sheet === "weight" && <Weight />}
      {sheet === "workout" && <WorkoutLog />}
      {sheet === "dieta" && <Dieta />}
      {sheet === "treino" && <TreinoGuiado />}
    </div>
  );
}
