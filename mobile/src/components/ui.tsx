import { Children, isValidElement, useState, type ReactNode } from "react";
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Polyline } from "react-native-svg";
import RNSlider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { Check, ChevronDown, ChevronUp, Info, PlayCircle, X } from "lucide-react-native";
import { DICAS, videoUrl } from "../data/exercises";
import { BRAND, DANGER, MONO, WARN, WATER, fonte, useTheme, type Peso } from "../theme";
import { Glass, GlassGroup } from "./Glass";

// ===== Texto =====
type TP = { children?: ReactNode; size?: number; w?: Peso; color?: string; mono?: boolean; italic?: boolean; style?: StyleProp<TextStyle>; lines?: number; center?: boolean; strike?: boolean; upper?: boolean; track?: number };
export function T({ children, size = 14, w = 500, color, mono, italic, style, lines, center, strike, upper, track }: TP) {
  const t = useTheme();
  return (
    <Text
      numberOfLines={lines}
      style={[
        { fontSize: size, fontFamily: mono ? MONO : fonte(w, italic), color: color ?? t.ink, lineHeight: Math.round(size * 1.35) },
        mono && w >= 700 && { fontWeight: "700" },
        center && { textAlign: "center" },
        strike && { textDecorationLine: "line-through", opacity: 0.5 },
        upper && { textTransform: "uppercase" },
        track != null && { letterSpacing: track },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export const B = ({ children, color }: { children: ReactNode; color?: string }) => <Text style={{ fontFamily: fonte(700), color }}>{children}</Text>;
export function Muted({ children, size = 12.5, style, center, lines }: { children: ReactNode; size?: number; style?: StyleProp<TextStyle>; center?: boolean; lines?: number }) {
  const t = useTheme();
  return <T size={size} color={t.soft} style={style} center={center} lines={lines}>{children}</T>;
}

// ===== Layout =====
export const Row = ({ children, gap = 8, style, between, wrap }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle>; between?: boolean; wrap?: boolean }) => (
  <View style={[{ flexDirection: "row", alignItems: "center", gap }, between && { justifyContent: "space-between" }, wrap && { flexWrap: "wrap" }, style]}>{children}</View>
);
export const Col = ({ children, gap = 8, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) => <View style={[{ gap }, style]}>{children}</View>;
/** grade de N colunas (substitui o grid do Tailwind) */
export function Grid({ cols = 2, gap = 10, children }: { cols?: number; gap?: number; children: ReactNode }) {
  const itens = Children.toArray(children).filter(isValidElement);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap }}>
      {itens.map((c, i) => <View key={i} style={{ width: `${100 / cols}%`, flexGrow: 1, flexBasis: 0, minWidth: `${100 / cols - 6}%` }}>{c}</View>)}
    </View>
  );
}
export function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.line, alignSelf: "stretch" }} />;
}

const tap = () => Haptics.selectionAsync().catch(() => {});

// ===== Card de vidro =====
export function Card({ children, style, onPress, tone = "default", pad = 18, gap = 12 }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; tone?: "default" | "soft" | "dark"; pad?: number; gap?: number }) {
  const t = useTheme();
  const inner = <View style={{ padding: pad, gap }}>{children}</View>;
  let body: ReactNode;
  if (tone === "dark") body = <View style={[{ borderRadius: 24, borderCurve: "continuous", backgroundColor: "#12241A" }, style]}>{inner}</View>;
  else body = <Glass radius={24} tint={tone === "soft" ? (t.dark ? "rgba(30,142,90,0.35)" : "rgba(30,142,90,0.18)") : undefined} interactive={!!onPress} style={style}>{inner}</Glass>;
  if (!onPress) return body;
  return <Pressable onPress={() => { tap(); onPress(); }} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.985 : 1 }] })}>{body}</Pressable>;
}

// ===== Botões =====
type BtnP = { children: ReactNode; onPress?: () => void; variant?: "primary" | "secondary" | "ghost" | "danger" | "white"; disabled?: boolean; size?: "sm" | "md" | "lg"; style?: StyleProp<ViewStyle>; icon?: ReactNode; flex?: number };
export function Button({ children, onPress, variant = "primary", disabled, size = "md", style, icon, flex }: BtnP) {
  const t = useTheme();
  const pad = { sm: { paddingHorizontal: 12, paddingVertical: 8 }, md: { paddingHorizontal: 16, paddingVertical: 12 }, lg: { paddingHorizontal: 20, paddingVertical: 16 } }[size];
  const fs = { sm: 12, md: 13.5, lg: 15 }[size];
  const r = size === "lg" ? 18 : 14;
  const cor = variant === "primary" ? "#fff" : variant === "white" ? "#14211A" : variant === "danger" ? DANGER : t.ink;
  const conteudo = (
    <Row gap={7} style={[{ justifyContent: "center" }, pad]}>
      {icon}
      {typeof children === "string" ? <T size={fs} w={700} color={cor}>{children}</T> : children}
    </Row>
  );
  const fundo: ViewStyle | null = variant === "primary" ? { backgroundColor: BRAND } : variant === "white" ? { backgroundColor: "#fff" } : variant === "ghost" ? { backgroundColor: t.raised } : null;
  return (
    <Pressable
      disabled={disabled}
      onPress={() => { tap(); onPress?.(); }}
      style={({ pressed }) => [{ opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }, size === "lg" && { alignSelf: "stretch" }, flex != null && { flex }, style]}
    >
      {fundo ? (
        <View style={[{ borderRadius: r, borderCurve: "continuous" }, fundo, variant === "primary" && { shadowColor: BRAND, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }]}>{conteudo}</View>
      ) : (
        <Glass radius={r} interactive tint={variant === "danger" ? "rgba(194,69,95,0.12)" : undefined}>{conteudo}</Glass>
      )}
    </Pressable>
  );
}
/** link de texto */
export function Link({ children, onPress, color = BRAND, size = 12.5 }: { children: ReactNode; onPress: () => void; color?: string; size?: number }) {
  return (
    <Pressable onPress={() => { tap(); onPress(); }} hitSlop={8} style={{ alignSelf: "flex-start" }}>
      <T size={size} w={700} color={color}>{children}</T>
    </Pressable>
  );
}
/** botão redondo de vidro só com ícone */
export function IconButton({ onPress, children, size = 38, label }: { onPress: () => void; children: ReactNode; size?: number; label: string }) {
  return (
    <Pressable onPress={() => { tap(); onPress(); }} accessibilityLabel={label} hitSlop={6}>
      <Glass radius={size / 2} interactive style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>{children}</Glass>
    </Pressable>
  );
}

// ===== Títulos =====
export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  const t = useTheme();
  return (
    <Row between style={{ alignItems: "flex-end" }}>
      <Col gap={2} style={{ flex: 1 }}>
        {subtitle ? <T size={13} w={600} color={t.mute}>{subtitle}</T> : null}
        <T size={30} w={800} style={{ letterSpacing: -0.6, lineHeight: 36 }}>{title}</T>
      </Col>
      {action}
    </Row>
  );
}
export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  const t = useTheme();
  return (
    <Row between style={{ marginTop: 4, paddingHorizontal: 4 }}>
      <T size={11} w={700} color={t.mute} upper track={0.9}>{children}</T>
      {action}
    </Row>
  );
}

// ===== Seletores =====
/** abas de segundo nível em pílulas de vidro */
export function Tabs<V extends string>({ value, onChange, items }: { value: V; onChange: (v: V) => void; items: { id: V; label: string }[] }) {
  const t = useTheme();
  return (
    <GlassGroup spacing={6}>
      <Glass radius={999} style={{ padding: 4, flexDirection: "row", gap: 4 }}>
        {items.map((it) => {
          const sel = it.id === value;
          return (
            <Pressable key={it.id} style={{ flex: 1 }} onPress={() => { tap(); onChange(it.id); }}>
              {sel ? (
                <Glass radius={999} interactive tint={BRAND} style={{ paddingVertical: 9, alignItems: "center" }}>
                  <T size={13} w={700} color="#fff">{it.label}</T>
                </Glass>
              ) : (
                <View style={{ paddingVertical: 9, alignItems: "center" }}><T size={13} w={600} color={t.soft}>{it.label}</T></View>
              )}
            </Pressable>
          );
        })}
      </Glass>
    </GlassGroup>
  );
}

/** seleção única em chips */
export function Chips<V extends string | number>({ value, onChange, options, small, scroll, color = BRAND }: { value: V; onChange: (v: V) => void; options: { v: V; label: string }[]; small?: boolean; scroll?: boolean; color?: string }) {
  const t = useTheme();
  const itens = options.map((o) => {
    const sel = o.v === value;
    return (
      <Pressable key={String(o.v)} onPress={() => { tap(); onChange(o.v); }}>
        <View style={{ paddingHorizontal: small ? 12 : 14, paddingVertical: small ? 7 : 9, borderRadius: 12, borderCurve: "continuous", backgroundColor: sel ? color : t.raised }}>
          <T size={small ? 11.5 : 12.5} w={sel ? 700 : 600} color={sel ? "#fff" : t.soft}>{o.label}</T>
        </View>
      </Pressable>
    );
  });
  if (scroll) return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 2 }}>{itens}</ScrollView>;
  return <Row gap={6} wrap>{itens}</Row>;
}

/** controle segmentado (mesma largura) */
export function Segmented<V extends string>({ value, onChange, options }: { value: V; onChange: (v: V) => void; options: [V, string][] }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 4, padding: 4, borderRadius: 14, backgroundColor: t.raised }}>
      {options.map(([k, l]) => {
        const sel = v(k);
        function v(x: V) { return x === value; }
        return (
          <Pressable key={k} style={{ flex: 1 }} onPress={() => { tap(); onChange(k); }}>
            {sel ? (
              <Glass radius={10} interactive style={{ paddingVertical: 8, alignItems: "center" }}><T size={12.5} w={700}>{l}</T></Glass>
            ) : (
              <View style={{ paddingVertical: 8, alignItems: "center" }}><T size={12.5} w={700} color={t.mute}>{l}</T></View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ===== Formulário =====
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  const t = useTheme();
  return (
    <Col gap={6}>
      <T size={11.5} w={600} color={t.soft}>{label}</T>
      {children}
      {hint ? <T size={10.5} color={t.mute}>{hint}</T> : null}
    </Col>
  );
}
export function Input({ style, big, ...p }: TextInputProps & { big?: boolean }) {
  const t = useTheme();
  const [foco, setFoco] = useState(false);
  return (
    <TextInput
      placeholderTextColor={t.mute}
      {...p}
      onFocus={(e) => { setFoco(true); p.onFocus?.(e); }}
      onBlur={(e) => { setFoco(false); p.onBlur?.(e); }}
      style={[
        { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderCurve: "continuous", borderWidth: 1, borderColor: foco ? BRAND : t.line, backgroundColor: t.raised, color: t.ink, fontSize: 14, fontFamily: fonte(500) },
        big && { fontSize: 24, fontFamily: MONO, textAlign: "center", paddingVertical: 16 },
        style,
      ]}
    />
  );
}
export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  const t = useTheme();
  return (
    <Pressable onPress={() => { tap(); onChange(!on); }}>
      <Row gap={12} between style={{ padding: 14, borderRadius: 14, backgroundColor: t.raised }}>
        <T size={12.5} style={{ flex: 1 }}>{label}</T>
        <View style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: on ? BRAND : t.dark ? "#33423A" : "#CFD8D2", justifyContent: "center" }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", marginLeft: on ? 21 : 3 }} />
        </View>
      </Row>
    </Pressable>
  );
}
export function Checkbox({ on, size = 22, round }: { on: boolean; size?: number; round?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: round ? size / 2 : 7, borderWidth: on ? 0 : 2, borderColor: t.dark ? "#3A4A41" : "#C5D1CA", backgroundColor: on ? BRAND : "transparent", alignItems: "center", justifyContent: "center" }}>
      {on ? <Check size={size * 0.62} color="#fff" strokeWidth={3} /> : null}
    </View>
  );
}
export function Slider({ value, onChange, min, max, step = 1 }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number }) {
  const t = useTheme();
  return <RNSlider value={value} minimumValue={min} maximumValue={max} step={step} onValueChange={(v) => onChange(Math.round(v / step) * step)} minimumTrackTintColor={BRAND} maximumTrackTintColor={t.dark ? "#33423A" : "#CFD8D2"} thumbTintColor={Platform.OS === "android" ? BRAND : undefined} style={{ height: 36 }} />;
}

// ===== Dados =====
export function Bar({ pct, color = BRAND, h = 8 }: { pct: number; color?: string; h?: number }) {
  const t = useTheme();
  return (
    <View style={{ height: h, borderRadius: h, backgroundColor: t.raised, overflow: "hidden" }}>
      <View style={{ height: "100%", width: `${Math.min(100, Math.max(0, pct))}%`, borderRadius: h, backgroundColor: color }} />
    </View>
  );
}
export function Ring({ pct, size = 128, stroke = 12, color = BRAND, children }: { pct: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, pct / 100));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke={t.raised} />
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke={color} strokeLinecap="round" strokeDasharray={`${c}`} strokeDashoffset={c * (1 - p)} />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>{children}</View>
    </View>
  );
}
export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  const t = useTheme();
  return (
    <Card pad={14} gap={2}>
      <T size={11} w={600} color={t.mute}>{label}</T>
      <T size={20} mono>{value}</T>
      {sub ? <T size={10.5} color={t.mute} lines={1}>{sub}</T> : null}
    </Card>
  );
}
export function Box({ l, v }: { l: string; v: string }) {
  const t = useTheme();
  return (
    <View style={{ padding: 12, borderRadius: 14, backgroundColor: t.raised }}>
      <T size={11} w={600} color={t.mute}>{l}</T>
      <T size={14.5} mono style={{ marginTop: 2 }}>{v}</T>
    </View>
  );
}
export function Empty({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  const t = useTheme();
  return (
    <Col gap={8} style={{ alignItems: "center", paddingVertical: 20, paddingHorizontal: 12 }}>
      {icon ? <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: t.brandSoft, alignItems: "center", justifyContent: "center" }}>{icon}</View> : null}
      <T size={14} w={700} center>{title}</T>
      {text ? <Muted size={12} center>{text}</Muted> : null}
      {action}
    </Col>
  );
}
export function Pill({ children, tone = "brand" }: { children: ReactNode; tone?: "brand" | "mute" | "warn" | "danger" | "water" }) {
  const t = useTheme();
  const c = { brand: [t.brandSoft, BRAND], mute: [t.raised, t.soft], warn: [t.warnSoft, WARN], danger: [t.dangerSoft, DANGER], water: [t.waterSoft, WATER] }[tone];
  return <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: c[0] }}><T size={10.5} w={700} color={c[1]}>{children}</T></View>;
}
export function Aviso({ children, tone = "brand" }: { children: ReactNode; tone?: "brand" | "danger" }) {
  const t = useTheme();
  return (
    <View style={{ padding: 13, borderRadius: 14, backgroundColor: tone === "brand" ? t.brandSoft : t.dangerSoft }}>
      <T size={12.5} w={500} color={tone === "brand" ? (t.dark ? "#8FD3AE" : BRAND) : DANGER}>{children}</T>
    </View>
  );
}

// ===== Folhas (modais) =====
export function Sheet({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const t = useTheme();
  const ins = useSafeAreaInsets();
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.35)" }]} onPress={onClose} />
        <Glass radius={34} style={{ maxHeight: "90%", marginHorizontal: 8, marginBottom: Math.max(8, ins.bottom - 8), overflow: "hidden" }}>
          <View style={{ alignItems: "center", paddingTop: 8 }}><View style={{ width: 38, height: 5, borderRadius: 3, backgroundColor: t.line }} /></View>
          <Row between style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6 }}>
            <T size={18} w={800}>{title}</T>
            <IconButton label="Fechar" onPress={onClose} size={32}><X size={16} color={t.soft} /></IconButton>
          </Row>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 16 }}>{children}</ScrollView>
          {footer ? <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }}>{footer}</View> : null}
        </Glass>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Collapse({ title, subtitle, children, defaultOpen = false, right }: { title: ReactNode; subtitle?: ReactNode; children: ReactNode; defaultOpen?: boolean; right?: ReactNode }) {
  const t = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card pad={0} gap={0}>
      <Pressable onPress={() => { tap(); setOpen(!open); }}>
        <Row between gap={12} style={{ padding: 16 }}>
          <Col gap={2} style={{ flex: 1 }}>
            <T size={14} w={700}>{title}</T>
            {subtitle ? <Muted size={11.5}>{subtitle}</Muted> : null}
          </Col>
          <Row gap={8}>
            {right}
            {open ? <ChevronUp size={18} color={t.mute} /> : <ChevronDown size={18} color={t.mute} />}
          </Row>
        </Row>
      </Pressable>
      {open ? <Col gap={12} style={{ paddingHorizontal: 16, paddingBottom: 16 }}>{children}</Col> : null}
    </Card>
  );
}

/** linha de exercício: marcar feito, ver explicação e vídeo */
export function ExerciseRow({ nome, qtd, done, onToggle, last }: { nome: string; qtd: string; done: boolean; onToggle: () => void; last?: boolean }) {
  const t = useTheme();
  const [info, setInfo] = useState(false);
  const d = DICAS[nome];
  return (
    <Col gap={8} style={{ paddingVertical: 11, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: t.line }}>
      <Row gap={12}>
        <Pressable onPress={() => { tap(); onToggle(); }} accessibilityLabel="Marcar como feito" hitSlop={8}><Checkbox on={done} size={24} /></Pressable>
        <Pressable onPress={() => setInfo(!info)} style={{ flex: 1 }}>
          <Row gap={6}>
            <T size={13.5} w={600} strike={done} style={{ flexShrink: 1 }}>{nome}</T>
            <Info size={14} color={BRAND} />
          </Row>
        </Pressable>
        <T size={11.5} mono color={t.mute}>{qtd}</T>
      </Row>
      {info ? (
        <Col gap={10} style={{ marginLeft: 36, padding: 12, borderRadius: 14, backgroundColor: t.raised }}>
          <T size={12.5}>{d ? d[0] : "Execute com controle e sem dor. Na dúvida, peça orientação a um profissional."}</T>
          <Button size="sm" icon={<PlayCircle size={15} color="#fff" />} onPress={() => Linking.openURL(videoUrl(nome))} style={{ alignSelf: "flex-start" }}>Ver vídeo</Button>
        </Col>
      ) : null}
    </Col>
  );
}

// ===== Gráficos =====
export function BarChart({ data, color = BRAND, height = 130, fmt = (n: number) => String(Math.round(n)), goal }: { data: { label: string; value: number }[]; color?: string; height?: number; fmt?: (n: number) => string; goal?: number }) {
  const t = useTheme();
  const max = Math.max(1, goal ?? 0, ...data.map((d) => d.value));
  return (
    <Col gap={6}>
      <View style={{ height, flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
        {goal ? <View style={{ position: "absolute", left: 0, right: 0, bottom: (goal / max) * (height - 18), borderTopWidth: 1, borderStyle: "dashed", borderColor: t.mute, opacity: 0.6 }} /> : null}
        {data.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", height: "100%", gap: 3 }}>
            <T size={9} mono color={t.mute}>{d.value > 0 ? fmt(d.value) : ""}</T>
            <View style={{ width: "100%", maxWidth: 34, height: (d.value / max) * (height - 18), minHeight: d.value > 0 ? 3 : 0, borderTopLeftRadius: 8, borderTopRightRadius: 8, backgroundColor: color, opacity: i === data.length - 1 ? 1 : 0.55 }} />
          </View>
        ))}
      </View>
      <Row gap={8}>{data.map((d, i) => <T key={i} size={10} w={600} color={t.mute} center lines={1} style={{ flex: 1 }}>{d.label}</T>)}</Row>
    </Col>
  );
}
export function LineChart({ values, height = 120, color = BRAND }: { values: number[]; height?: number; color?: string }) {
  const [w, setW] = useState(300);
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const x = (i: number) => (values.length > 1 ? (i / (values.length - 1)) * (w - 8) + 4 : w / 2);
  const y = (v: number) => height - ((v - min) / span) * (height * 0.8) - height * 0.1;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height }}>
      <Svg width={w} height={height}>
        <Polyline points={values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        {values.map((v, i) => <Circle key={i} cx={x(i)} cy={y(v)} r={3} fill={color} />)}
      </Svg>
    </View>
  );
}
