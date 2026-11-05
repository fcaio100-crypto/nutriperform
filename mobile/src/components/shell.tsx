import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { CalendarDays, ChartLine, ChevronLeft, ChevronRight, House, ShieldAlert, ShieldCheck, Sparkles, User } from "lucide-react-native";
import { useStore, hojeDe, vistoDe } from "../state/store";
import { useUi } from "../state/ui";
import { longDate, metasDoEstado, parseISO, addDays, triagem } from "../lib/calc";
import { BRAND, DANGER, WARN, useTheme } from "../theme";
import { Glass, GlassGroup } from "./Glass";
import { Button, Card, Col, IconButton, Row, T } from "./ui";

export const NAV = [
  { id: "hoje", label: "Hoje", icon: House },
  { id: "assistente", label: "Assistente", icon: Sparkles },
  { id: "historico", label: "Histórico", icon: ChartLine },
  { id: "eu", label: "Eu", icon: User },
] as const;

/** Barra de abas flutuante em Liquid Glass; o item ativo é uma gota de vidro verde. */
export function TabBar() {
  const { state } = useStore();
  const { go } = useUi();
  const t = useTheme();
  const ins = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: Math.max(ins.bottom - 6, 12), alignItems: "center" }}>
      <GlassGroup spacing={8}>
        <Glass radius={999} style={{ flexDirection: "row", padding: 5, gap: 2, shadowColor: "#000", shadowOpacity: t.dark ? 0.4 : 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } }}>
          {NAV.map(({ id, label, icon: Icon }) => {
            const sel = state.screen === id;
            const conteudo = (
              <Col gap={2} style={{ alignItems: "center", paddingHorizontal: 14, paddingVertical: 7, minWidth: 74 }}>
                <Icon size={21} strokeWidth={sel ? 2.4 : 1.9} color={sel ? (t.dark ? "#A3E635" : BRAND) : t.soft} />
                <T size={10.5} w={700} color={sel ? (t.dark ? "#A3E635" : BRAND) : t.soft}>{label}</T>
              </Col>
            );
            return (
              <Pressable key={id} onPress={() => go(id)} accessibilityRole="tab" accessibilityState={{ selected: sel }}>
                {sel ? <Glass radius={999} interactive tint={t.dark ? "rgba(163,230,53,0.18)" : "rgba(30,142,90,0.16)"}>{conteudo}</Glass> : conteudo}
              </Pressable>
            );
          })}
        </Glass>
      </GlassGroup>
    </View>
  );
}

/** Seletor de dia (passados e futuros) com botões de vidro */
export function DayNav() {
  const { state, dispatch } = useStore();
  const t = useTheme();
  const v = vistoDe(state);
  const h = hojeDe(state);
  const dif = Math.round((parseISO(v).getTime() - parseISO(h).getTime()) / 864e5);
  const rel = dif === 0 ? "Hoje" : dif === -1 ? "Ontem" : dif === 1 ? "Amanhã" : dif < 0 ? `${-dif} dias atrás` : `Daqui a ${dif} dias`;
  const ir = (d: string) => { Haptics.selectionAsync().catch(() => {}); dispatch({ type: "SET_DIA_VISTO", date: d }); };
  const antigo = state.history.find((x) => x.date === v);
  const vazio = !state.meals.some((m) => m.items.length);
  return (
    <Col gap={8}>
      <GlassGroup spacing={12}>
        <Row gap={8}>
          <IconButton label="Dia anterior" onPress={() => ir(addDays(v, -1))}><ChevronLeft size={18} color={t.soft} /></IconButton>
          <Pressable style={{ flex: 1 }} onPress={() => dif !== 0 && ir(h)}>
            <Glass radius={999} interactive style={{ height: 38, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 12 }}>
              <CalendarDays size={15} color={BRAND} />
              <T size={12.5} w={700} lines={1}>{rel === "Hoje" ? `Hoje · ${longDate(parseISO(v)).split(",")[1]?.trim()}` : `${rel} · ${longDate(parseISO(v))}`}</T>
            </Glass>
          </Pressable>
          <IconButton label="Próximo dia" onPress={() => ir(addDays(v, 1))}><ChevronRight size={18} color={t.soft} /></IconButton>
        </Row>
      </GlassGroup>
      {dif !== 0 ? (
        <Row gap={12} between style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: t.brandSoft }}>
          <T size={11.5} style={{ flex: 1 }}>{dif < 0 ? "Vendo um dia passado — o que adicionar fica neste dia." : "Planejando um dia futuro — quando chegar, já estará preenchido."}</T>
          <Button size="sm" onPress={() => ir(h)}>Hoje</Button>
        </Row>
      ) : null}
      {dif < 0 && antigo && vazio ? (
        <T size={11} color={t.mute} style={{ paddingHorizontal: 4 }}>Antes do diário por data só os totais eram guardados: {antigo.kcal} kcal · P {antigo.proteina} g · C {antigo.carbo} g · G {antigo.gordura} g.</T>
      ) : null}
    </Col>
  );
}

export function SafetyCard({ compact }: { compact?: boolean }) {
  const { state } = useStore();
  const t = useTheme();
  const m = metasDoEstado(state);
  const tri = triagem(state.healthScreening, m.imc, state.profile.idade);
  const ui = {
    verde: { label: "Tudo certo", cor: BRAND, bg: t.brandSoft, Icon: ShieldCheck },
    amarelo: { label: "Atenção", cor: WARN, bg: t.warnSoft, Icon: ShieldAlert },
    vermelho: { label: "Procure orientação profissional", cor: DANGER, bg: t.dangerSoft, Icon: ShieldAlert },
  }[tri.nivel];
  if (compact && tri.nivel === "verde") return null;
  return (
    <View style={{ padding: 16, borderRadius: 22, backgroundColor: ui.bg, gap: 8 }}>
      <Row gap={8}><ui.Icon size={18} color={ui.cor} /><T size={13} w={700} color={ui.cor} style={{ flex: 1 }}>Central de segurança · {ui.label}</T></Row>
      <Col gap={4}>{tri.motivos.map((x, i) => <T key={i} size={12}>• {x}</T>)}</Col>
      {!compact ? <T size={10.5} color={t.mute}>A triagem é só uma bússola de cautela — o app nunca diagnostica.</T> : null}
    </View>
  );
}

export function Toast() {
  const { toast } = useUi();
  const ins = useSafeAreaInsets();
  if (!toast) return null;
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 16, right: 16, bottom: Math.max(ins.bottom, 12) + 84, alignItems: "center" }}>
      <Glass radius={18} tint="rgba(20,33,26,0.75)" style={{ paddingHorizontal: 16, paddingVertical: 12, maxWidth: 420 }}>
        <T size={13} w={600} color="#fff" center>{toast}</T>
      </Glass>
    </View>
  );
}

export { Card };
