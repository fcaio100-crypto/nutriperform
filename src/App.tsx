import { useEffect } from "react";
import { useStore } from "./state/store";
import { useUi } from "./state/ui";
import Auth from "./screens/Auth";
import Hoje from "./screens/Hoje";
import Comer from "./screens/comer/Comer";
import Treinar from "./screens/treinar/Treinar";
import Progresso from "./screens/progresso/Progresso";
import Perfil from "./screens/perfil/Perfil";
import Onboarding from "./sheets/Onboarding";
import AddFood from "./sheets/AddFood";
import Weight from "./sheets/Weight";
import WorkoutLog from "./sheets/WorkoutLog";
import Dieta from "./sheets/Dieta";
import { BottomNav, Toast } from "./components/shell";

const SCREENS: Record<string, () => JSX.Element> = { hoje: Hoje, comer: Comer, treinar: Treinar, progresso: Progresso, perfil: Perfil };

export default function App() {
  const { state } = useStore();
  const { sheet, openOnboarding } = useUi();
  const logado = !!state.auth.currentUserEmail;

  useEffect(() => {
    if (logado && !state.onboardingDone) openOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logado, state.onboardingDone]);

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
    </div>
  );
}
