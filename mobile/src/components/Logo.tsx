import Svg, { G, Line, Rect } from "react-native-svg";
import { Text } from "react-native";
import { fonte, useTheme } from "../theme";

/** Logomarca NutriPerform — haltere em ascensão. */
export function LogoMark({ size = 44, accent = "#A3E635", bg = "#0B0F0C" }: { size?: number; accent?: string; bg?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="NutriPerform">
      <Rect width="64" height="64" rx="15" fill={bg} />
      <G transform="rotate(-35 34 32)" fill={accent}>
        <Rect x="20" y="29.5" width="28" height="5" rx="2.5" />
        <Rect x="15" y="20" width="7" height="24" rx="2.5" />
        <Rect x="10" y="24.5" width="5" height="15" rx="2" />
        <Rect x="46" y="20" width="7" height="24" rx="2.5" />
        <Rect x="53" y="24.5" width="5" height="15" rx="2" />
      </G>
      {size >= 40 ? (
        <G stroke={accent} strokeWidth="2.6" strokeLinecap="round" opacity={0.55}>
          <Line x1="7" y1="50" x2="15" y2="50" />
          <Line x1="9" y1="56" x2="20" y2="56" />
        </G>
      ) : null}
    </Svg>
  );
}

export function Wordmark({ size = 20 }: { size?: number }) {
  const t = useTheme();
  return (
    <Text style={{ fontFamily: fonte(800, true), fontSize: size, color: t.ink, letterSpacing: -0.3 }}>
      NUTRI<Text style={{ color: t.dark ? "#A3E635" : "#2E6B0C" }}>PERFORM</Text>
    </Text>
  );
}
