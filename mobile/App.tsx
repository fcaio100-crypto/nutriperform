import { useEffect, useRef } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans/400Regular";
import { PlusJakartaSans_500Medium } from "@expo-google-fonts/plus-jakarta-sans/500Medium";
import { PlusJakartaSans_600SemiBold } from "@expo-google-fonts/plus-jakarta-sans/600SemiBold";
import { PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans/700Bold";
import { PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans/800ExtraBold";
import { PlusJakartaSans_800ExtraBold_Italic } from "@expo-google-fonts/plus-jakarta-sans/800ExtraBold_Italic";
import { StoreProvider, useStore } from "./src/state/store";
import { UiProvider, useUi } from "./src/state/ui";
import { useTheme } from "./src/theme";
import { FundoVivo } from "./src/components/Glass";
import { TabBar, Toast } from "./src/components/shell";
import { LogoMark } from "./src/components/Logo";
import { T } from "./src/components/ui";
import Auth from "./src/screens/Auth";
import Hoje from "./src/screens/Hoje";
import Historico from "./src/screens/Historico";
import Eu from "./src/screens/Eu";
import Assistente from "./src/screens/Assistente";
import Onboarding from "./src/sheets/Onboarding";
import AddFood from "./src/sheets/AddFood";
import Weight from "./src/sheets/Weight";
import WorkoutLog from "./src/sheets/WorkoutLog";
import Dieta from "./src/sheets/Dieta";
import TreinoGuiado from "./src/sheets/TreinoGuiado";
import ShareTreino from "./src/sheets/ShareTreino";

const SCREENS: Record<string, () => React.JSX.Element> = { hoje: Hoje, historico: Historico, eu: Eu };

export default function App() {
  const [fontes] = useFonts({ PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold, PlusJakartaSans_800ExtraBold_Italic });
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <UiProvider>{fontes ? <Main /> : <View style={{ flex: 1, backgroundColor: "#EEF4F0" }} />}</UiProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function Main() {
  const { state, sync } = useStore();
  const { sheet, openOnboarding, scrollTop } = useUi();
  const t = useTheme();
  const ins = useSafeAreaInsets();
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const logado = !!state.auth.currentUserEmail;

  useEffect(() => { SystemUI.setBackgroundColorAsync(t.bg).catch(() => {}); }, [t.bg]);
  useEffect(() => {
    if (logado && sync !== "checking" && !state.onboardingDone) openOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logado, sync, state.onboardingDone]);
  useEffect(() => { scrollTop.current = () => scroll.current?.scrollTo({ y: 0, animated: false }); }, [scrollTop]);

  const status = <StatusBar style={t.dark ? "light" : "dark"} />;
  if (sync === "checking")
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}>
        <FundoVivo />
        {status}
        <LogoMark size={68} />
        <ActivityIndicator color="#1E8E5A" />
        <T size={13} w={600} color={t.mute}>Carregando seus dados…</T>
      </View>
    );
  if (!logado) return (<View style={{ flex: 1 }}><FundoVivo />{status}<Auth /></View>);

  const Screen = SCREENS[state.screen];
  return (
    <View style={{ flex: 1 }}>
      <FundoVivo />
      {status}
      {state.screen === "assistente" ? (
        <Assistente />
      ) : (
        <ScrollView
          ref={scroll}
          key={state.screen}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={{ paddingTop: ins.top + 12, paddingBottom: ins.bottom + 120, paddingHorizontal: 16, gap: 16, maxWidth: 600, width: "100%", alignSelf: "center" }}
        >
          {Screen ? <Screen /> : <Hoje />}
        </ScrollView>
      )}
      <TabBar />
      <Toast />
      {sheet === "onboarding" && <Onboarding />}
      {sheet === "food" && <AddFood />}
      {sheet === "weight" && <Weight />}
      {sheet === "workout" && <WorkoutLog />}
      {sheet === "dieta" && <Dieta />}
      {sheet === "treino" && <TreinoGuiado />}
      {sheet === "share" && <ShareTreino />}
    </View>
  );
}
