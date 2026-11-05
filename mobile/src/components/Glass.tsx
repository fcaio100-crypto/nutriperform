import { useEffect, useState, type ReactNode } from "react";
import { AccessibilityInfo, Platform, StyleSheet, View, type ColorValue, type StyleProp, type ViewStyle } from "react-native";
import { GlassContainer, GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme";

/** Liquid Glass nativo (iOS 26+). Checagem dupla: algumas betas do iOS 26 não têm a API e travam. */
export const LIQUID_GLASS = Platform.OS === "ios" && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

/** Respeita "Reduzir transparência" do iOS: aí o vidro vira superfície sólida. */
function useReduzTransparencia() {
  const [v, setV] = useState(false);
  useEffect(() => {
    if (Platform.OS !== "ios") return; // configuração só existe no iOS
    AccessibilityInfo.isReduceTransparencyEnabled().then(setV).catch(() => {});
    const s = AccessibilityInfo.addEventListener("reduceTransparencyChanged", setV);
    return () => s.remove();
  }, []);
  return v;
}

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** raio dos cantos (o vidro acompanha a forma) */
  radius?: number;
  /** cor da tinta do vidro (ex.: verde da marca no item selecionado) */
  tint?: ColorValue;
  /** reage ao toque com o "brilho" do Liquid Glass */
  interactive?: boolean;
  /** "regular" é mais fosco e legível; "clear" é mais transparente */
  variant?: "regular" | "clear";
};

/**
 * Superfície de vidro do app.
 * - iOS 26+: GlassView do expo-glass-effect (Liquid Glass de verdade).
 * - iOS antigo: BlurView com material do sistema.
 * - Android / reduzir transparência: superfície translúcida com borda clara.
 */
export function Glass({ children, style, radius = 22, tint, interactive, variant = "regular" }: Props) {
  const t = useTheme();
  const solido = useReduzTransparencia();
  const forma: ViewStyle = { borderRadius: radius, borderCurve: "continuous" };

  if (LIQUID_GLASS && !solido)
    return (
      <GlassView glassEffectStyle={variant} tintColor={tint} isInteractive={interactive} colorScheme={t.dark ? "dark" : "light"} style={[forma, style]}>
        {children}
      </GlassView>
    );

  const borda = { borderWidth: StyleSheet.hairlineWidth, borderColor: t.glassBorder };
  // tinta "sólida" (#hex): sem vidro nativo, vira a própria cor para o texto branco continuar legível
  if (typeof tint === "string" && tint.startsWith("#"))
    return <View style={[forma, { backgroundColor: tint }, style]}>{children}</View>;
  if (Platform.OS === "ios" && !solido)
    return (
      <View style={[forma, borda, { overflow: "hidden" }, style]}>
        <BlurView intensity={variant === "clear" ? 30 : 60} tint={t.dark ? "systemMaterialDark" : "systemMaterialLight"} style={StyleSheet.absoluteFill} />
        {tint ? <View style={[StyleSheet.absoluteFill, { backgroundColor: tint, opacity: 0.35 }]} /> : null}
        {children}
      </View>
    );

  return (
    <View style={[forma, borda, { backgroundColor: solido ? t.card : t.glassFallback }, Platform.OS === "android" && { elevation: 0 }, style]}>
      {tint ? <View style={[StyleSheet.absoluteFill, forma, { backgroundColor: tint, opacity: 0.22 }]} /> : null}
      {children}
    </View>
  );
}

/** Agrupa vidros próximos para que se fundam (barra de abas, chips). */
export function GlassGroup({ children, spacing = 10, style }: { children: ReactNode; spacing?: number; style?: StyleProp<ViewStyle> }) {
  if (LIQUID_GLASS) return <GlassContainer spacing={spacing} style={style}>{children}</GlassContainer>;
  return <View style={style}>{children}</View>;
}

/** Fundo do app: gradiente com manchas de cor para o vidro ter o que refratar. */
export function FundoVivo() {
  const t = useTheme();
  const a = t.dark ? 0.32 : 0.22;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={[t.bg2, t.bg]} style={StyleSheet.absoluteFill} />
      <View style={[s.blob, { top: -120, right: -100, width: 340, height: 340, backgroundColor: "#A3E635", opacity: a }]} />
      <View style={[s.blob, { top: 260, left: -140, width: 320, height: 320, backgroundColor: "#1E8E5A", opacity: a * 0.9 }]} />
      <View style={[s.blob, { bottom: -80, right: -60, width: 300, height: 300, backgroundColor: "#3B82C4", opacity: a * 0.6 }]} />
      {Platform.OS === "ios" ? <BlurView intensity={80} tint={t.dark ? "dark" : "light"} style={StyleSheet.absoluteFill} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: t.bg, opacity: 0.55 }]} />}
    </View>
  );
}

const s = StyleSheet.create({ blob: { position: "absolute", borderRadius: 999 } });
