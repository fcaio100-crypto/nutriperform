import { Pressable, View } from "react-native";
import { ArrowLeft, CalendarDays, ChevronRight, Cloud, CloudOff, Dumbbell, Flame, LogOut, Pill as PillIcon, RefreshCcw, ShieldCheck, User, Utensils } from "lucide-react-native";
import { useStore } from "../state/store";
import { useUi } from "../state/ui";
import { supabase } from "../lib/supabase";
import { ATIVIDADES, OBJETIVOS, PERGUNTAS_SAUDE, fmtInt, metasDoEstado } from "../lib/calc";
import { AGENDA_PADRAO, DIAS_SEMANA, OPCOES_TREINO } from "../data/exercises";
import { BRAND, WARN, useTheme } from "../theme";
import { Button, Card, Chips, Col, Divider, Field, Grid, Input, Muted, Row, Segmented, T, Toggle } from "../components/ui";
import { SafetyCard } from "../components/shell";
import Musculacao from "./eu/Musculacao";
import Metas from "./eu/Metas";
import Plano from "./eu/Plano";
import Suplementos from "./eu/Suplementos";

const PAGINAS = {
  dados: { t: "Meus dados", icon: User, C: MeusDados },
  semana: { t: "Minha semana de treino", icon: CalendarDays, C: SemanaTreino },
  musc: { t: "Rotina de musculação", icon: Dumbbell, C: Musculacao },
  metas: { t: "Metas e calorias", icon: Flame, C: Metas },
  plano: { t: "Plano alimentar", icon: Utensils, C: Plano },
  supl: { t: "Suplementos", icon: PillIcon, C: Suplementos },
  saude: { t: "Saúde e segurança", icon: ShieldCheck, C: Saude },
} as const;
type Pag = keyof typeof PAGINAS;

export default function Eu() {
  const { state, dispatch, sync } = useStore();
  const { sub, setSub, notify } = useUi();
  const t = useTheme();
  const pag = sub.eu as Pag | "";
  const p = state.profile;
  const m = metasDoEstado(state);

  if (pag && PAGINAS[pag]) {
    const P = PAGINAS[pag];
    return (
      <>
        <Pressable onPress={() => setSub("eu", "")} hitSlop={10} style={{ alignSelf: "flex-start" }}>
          <Row gap={6}><ArrowLeft size={18} color={t.soft} /><T size={13.5} w={700} color={t.soft}>Eu</T></Row>
        </Pressable>
        <T size={26} w={800} style={{ letterSpacing: -0.5, lineHeight: 32, marginTop: -6 }}>{P.t}</T>
        <P.C />
      </>
    );
  }

  const iniciais = p.nome.split(" ").filter(Boolean).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "?";
  const resumo: Record<Pag, string> = {
    dados: `${p.peso} kg · ${p.altura} cm · ${p.objetivo}`,
    semana: DIAS_SEMANA.map((_, i) => (state.agenda ?? AGENDA_PADRAO)[String((i + 1) % 7)]).filter((x) => x !== "Descanso").length + " dias de treino",
    musc: state.treinoPersonalizadoAtivo ? "Rotina do meu personal" : "Sugestão do app",
    metas: `${fmtInt(m.meta)} kcal/dia`,
    plano: state.planoPersonalizadoAtivo ? "Meu plano" : "Sugestão do app",
    supl: `${state.supplements.length} cadastrados`,
    saude: "Triagem e avisos",
  };

  return (
    <>
      <Card pad={20}>
        <Row gap={16}>
          <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: BRAND, alignItems: "center", justifyContent: "center" }}><T size={19} w={800} color="#fff">{iniciais}</T></View>
          <Col gap={0} style={{ flex: 1 }}>
            <T size={19} w={800} lines={1}>{p.nome || "Sem nome"}</T>
            <T size={12.5} color={t.mute}>{p.peso} kg → meta {p.pesoDesejado} kg</T>
          </Col>
        </Row>
      </Card>

      <Card pad={0} gap={0}>
        {(Object.keys(PAGINAS) as Pag[]).map((k, i) => {
          const { t: titulo, icon: Icon } = PAGINAS[k];
          return (
            <View key={k}>
              {i > 0 ? <View style={{ marginLeft: 64 }}><Divider /></View> : null}
              <Pressable onPress={() => setSub("eu", k)} style={({ pressed }) => ({ backgroundColor: pressed ? t.raised : "transparent" })}>
                <Row gap={12} style={{ paddingHorizontal: 16, paddingVertical: 13 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: t.brandSoft, alignItems: "center", justifyContent: "center" }}><Icon size={18} color={BRAND} /></View>
                  <Col gap={0} style={{ flex: 1 }}>
                    <T size={14.5} w={600}>{titulo}</T>
                    <T size={11.5} color={t.mute} lines={1}>{resumo[k]}</T>
                  </Col>
                  <ChevronRight size={18} color={t.mute} />
                </Row>
              </Pressable>
            </View>
          );
        })}
      </Card>

      <Card pad={16}>
        <Row between>
          <T size={14.5} w={600}>Tema</T>
          <View style={{ width: 180 }}>
            <Segmented value={state.theme} onChange={(v) => dispatch({ type: "SET_THEME", theme: v })} options={[["Claro", "Claro"], ["Escuro", "Escuro"]]} />
          </View>
        </Row>
      </Card>

      <Row gap={8} style={{ paddingHorizontal: 4 }}>
        {sync === "synced" ? <Cloud size={15} color={BRAND} /> : <CloudOff size={15} color={WARN} />}
        <T size={12} color={t.mute}>{sync === "synced" ? "Dados salvos e sincronizados" : sync === "checking" ? "Verificando conexão…" : "Sem conexão — salvo neste aparelho"}</T>
      </Row>

      <Button variant="danger" size="lg" icon={<LogOut size={17} color="#C2455F" />} onPress={() => { supabase.auth.signOut(); dispatch({ type: "LOGOUT" }); notify("Você saiu da conta"); }}>Sair da conta</Button>
    </>
  );
}

function MeusDados() {
  const { state, dispatch } = useStore();
  const { openOnboarding } = useUi();
  const t = useTheme();
  const p = state.profile;
  const num = (v: string) => parseFloat(v.replace(",", ".")) || 0;
  const up = (patch: Partial<typeof p>) => dispatch({ type: "UPDATE_PROFILE", patch });
  return (
    <Card pad={16}>
      <Field label="Nome"><Input value={p.nome} onChangeText={(v) => up({ nome: v })} /></Field>
      <Field label="Sexo"><Chips small value={p.sexo} onChange={(v) => up({ sexo: v })} options={[{ v: "Masculino", label: "Masculino" }, { v: "Feminino", label: "Feminino" }]} /></Field>
      <Grid cols={2} gap={12}>
        <Field label="Idade"><Input keyboardType="number-pad" defaultValue={String(p.idade || "")} onChangeText={(v) => up({ idade: Math.round(num(v)) })} /></Field>
        <Field label="Peso (kg)"><Input keyboardType="decimal-pad" defaultValue={String(p.peso || "")} onChangeText={(v) => up({ peso: num(v) })} /></Field>
        <Field label="Altura (cm)"><Input keyboardType="number-pad" defaultValue={String(p.altura || "")} onChangeText={(v) => up({ altura: num(v) })} /></Field>
        <Field label="Peso desejado (kg)"><Input keyboardType="decimal-pad" defaultValue={String(p.pesoDesejado || "")} onChangeText={(v) => up({ pesoDesejado: num(v) })} /></Field>
        <Field label="% de gordura"><Input keyboardType="decimal-pad" defaultValue={p.gordura ? String(p.gordura) : ""} onChangeText={(v) => up({ gordura: num(v) })} /></Field>
      </Grid>
      <Field label="Objetivo"><Chips small value={p.objetivo} onChange={(v) => up({ objetivo: v })} options={OBJETIVOS.map((o) => ({ v: o, label: o }))} /></Field>
      <Field label="Nível de atividade"><Chips small value={p.atividade} onChange={(v) => up({ atividade: v })} options={ATIVIDADES.map(([a]) => ({ v: a, label: a }))} /></Field>
      <Button variant="secondary" icon={<RefreshCcw size={15} color={t.ink} />} onPress={openOnboarding}>Refazer cadastro guiado</Button>
    </Card>
  );
}

function SemanaTreino() {
  const { state, dispatch } = useStore();
  const ag = state.agenda ?? AGENDA_PADRAO;
  return (
    <>
      <Muted>Escolha o treino de cada dia. A tela Hoje mostra o treino do dia automaticamente.</Muted>
      {[1, 2, 3, 4, 5, 6, 0].map((d) => (
        <Card key={d} pad={14} gap={10}>
          <T size={14.5} w={700}>{DIAS_SEMANA[d]}</T>
          <Chips small scroll value={ag[String(d)]} onChange={(v) => dispatch({ type: "SET_AGENDA", dia: String(d), mod: v })} options={OPCOES_TREINO.map((o) => ({ v: o, label: o }))} />
        </Card>
      ))}
      <Muted size={11.5}>Dica: alterne treinos fortes com dias leves (mobilidade ou descanso). Antes de jogo, prefira mobilidade.</Muted>
    </>
  );
}

function Saude() {
  const { state, dispatch } = useStore();
  return (
    <>
      <SafetyCard />
      {PERGUNTAS_SAUDE.map((q) => (
        <Toggle key={q.key} on={!!state.healthScreening[q.key]} onChange={(v) => dispatch({ type: "UPDATE_HEALTH_SCREENING", patch: { [q.key]: v } })} label={q.pergunta} />
      ))}
      <Muted size={11}>O app não diagnostica, não prescreve e não incentiva dietas extremas.</Muted>
    </>
  );
}
