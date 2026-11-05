import { Platform } from "react-native";
import { useStore } from "./state/store";

export const BRAND = "#1E8E5A";
export const LIMA = "#A3E635";
export const PRETO = "#0B0F0C";
export const WATER = "#3B82C4";
export const WARN = "#C2852B";
export const DANGER = "#C2455F";

const claro = {
  dark: false,
  bg: "#EEF4F0",
  bg2: "#F8FBF9",
  ink: "#14211A",
  soft: "#5B6B62",
  mute: "#8A978F",
  line: "rgba(20,33,26,0.08)",
  card: "#FFFFFF",
  raised: "rgba(20,33,26,0.05)",
  raisedSolid: "#F0F4F1",
  brandSoft: "#E7F5EE",
  warnSoft: "#FBF1DE",
  dangerSoft: "#FBE6EA",
  waterSoft: "#E6F0FA",
  /** cor de fundo quando o vidro não está disponível (Android / iOS antigo) */
  glassFallback: "rgba(255,255,255,0.78)",
  glassBorder: "rgba(255,255,255,0.9)",
  glassTint: "rgba(255,255,255,0.35)",
  inverse: "#14211A",
  onInverse: "#FFFFFF",
};
const escuro: typeof claro = {
  dark: true,
  bg: "#07100B",
  bg2: "#0D1611",
  ink: "#EAF2ED",
  soft: "#9DB0A5",
  mute: "#7D8D84",
  line: "rgba(255,255,255,0.08)",
  card: "#161F1A",
  raised: "rgba(255,255,255,0.07)",
  raisedSolid: "#1D2822",
  brandSoft: "#16301F",
  warnSoft: "#33280F",
  dangerSoft: "#33141B",
  waterSoft: "#132433",
  glassFallback: "rgba(22,31,26,0.82)",
  glassBorder: "rgba(255,255,255,0.12)",
  glassTint: "rgba(10,18,13,0.25)",
  inverse: "#FFFFFF",
  onInverse: "#14211A",
};
export type Pal = typeof claro;

export function useTheme(): Pal {
  const { state } = useStore();
  return state.theme === "Escuro" ? escuro : claro;
}

export type Peso = 400 | 500 | 600 | 700 | 800;
const FAMILIA: Record<Peso, string> = {
  400: "PlusJakartaSans_400Regular",
  500: "PlusJakartaSans_500Medium",
  600: "PlusJakartaSans_600SemiBold",
  700: "PlusJakartaSans_700Bold",
  800: "PlusJakartaSans_800ExtraBold",
};
export const fonte = (w: Peso = 500, italic = false) => (italic && w === 800 ? "PlusJakartaSans_800ExtraBold_Italic" : FAMILIA[w]);
export const MONO = Platform.select({ ios: "Menlo", default: "monospace" });
