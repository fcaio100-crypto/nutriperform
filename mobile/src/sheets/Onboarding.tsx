import { useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "../state/store";
import { useUi } from "../state/ui";
import { ATIVIDADES, OBJETIVOS, PERGUNTAS_SAUDE, fmtInt, metas } from "../lib/calc";
import { MODALIDADES } from "../data/exercises";
import { BRAND, useTheme } from "../theme";
import { FundoVivo, Glass } from "../components/Glass";
import { Button, Chips, Col, Field, Grid, Input, Link, Row, T, Toggle } from "../components/ui";

const ETAPAS = ["Você", "Medidas", "Objetivo", "Saúde", "Rotina", "Pronto"];

export default function Onboarding() {
  const { state, dispatch } = useStore();
  const { close } = useUi();
  const t = useTheme();
  const ins = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const p = state.profile;
  const up = (patch: Partial<typeof p>) => dispatch({ type: "UPDATE_PROFILE", patch });
  const num = (v: string) => parseFloat(v.replace(",", ".")) || 0;
  const m = metas(p, state.deficit, state.protPerKg, state.fatPct, state.gastoManualAtivo ? state.gastoManualKcal : undefined);

  function concluir() {
    dispatch({ type: "SET_ONBOARDING_DONE", done: true });
    close();
  }

  const opcao = (sel: boolean, onPress: () => void, children: ReactNode) => (
    <Pressable onPress={onPress}>
      <Glass radius={16} interactive tint={sel ? "rgba(30,142,90,0.22)" : undefined} style={{ padding: 14, borderWidth: 2, borderColor: sel ? BRAND : "transparent" }}>{children}</Glass>
    </Pressable>
  );

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={() => { if (state.onboardingDone) close(); }}>
      <View style={{ flex: 1 }}>
        <FundoVivo />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: ins.top + 16, paddingBottom: ins.bottom + 20, gap: 20, maxWidth: 540, width: "100%", alignSelf: "center" }}>
            <Row between>
              <T size={12} w={700} color={BRAND} upper track={0.5}>Etapa {i + 1} de {ETAPAS.length}</T>
              {state.onboardingDone ? <Link color={t.mute} onPress={close}>Fechar</Link> : null}
            </Row>
            <Row gap={6}>{ETAPAS.map((_, k) => <View key={k} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: k <= i ? BRAND : t.line }} />)}</Row>

            {i === 0 ? (
              <Step title="Vamos nos conhecer" text="Com isso o app calcula suas metas.">
                <Field label="Nome"><Input value={p.nome} onChangeText={(v) => up({ nome: v })} /></Field>
                <Field label="Idade"><Input keyboardType="number-pad" value={p.idade ? String(p.idade) : ""} onChangeText={(v) => up({ idade: Math.round(num(v)) })} /></Field>
                <Field label="Sexo"><Chips value={p.sexo} onChange={(v) => up({ sexo: v })} options={[{ v: "Masculino", label: "Masculino" }, { v: "Feminino", label: "Feminino" }]} /></Field>
              </Step>
            ) : null}
            {i === 1 ? (
              <Step title="Medidas de hoje" text="Só peso e altura são obrigatórios.">
                <Grid cols={2} gap={12}>
                  <Field label="Peso (kg)"><Input keyboardType="decimal-pad" defaultValue={p.peso ? String(p.peso) : ""} onChangeText={(v) => up({ peso: num(v) })} /></Field>
                  <Field label="Altura (cm)"><Input keyboardType="number-pad" defaultValue={p.altura ? String(p.altura) : ""} onChangeText={(v) => up({ altura: num(v) })} /></Field>
                  <Field label="Abdômen (cm)"><Input keyboardType="decimal-pad" defaultValue={p.abdomen ? String(p.abdomen) : ""} onChangeText={(v) => up({ abdomen: num(v) })} /></Field>
                  <Field label="% de gordura"><Input keyboardType="decimal-pad" defaultValue={p.gordura ? String(p.gordura) : ""} onChangeText={(v) => up({ gordura: num(v) })} /></Field>
                </Grid>
              </Step>
            ) : null}
            {i === 2 ? (
              <Step title="Qual é o seu objetivo?">
                <Col gap={8}>{OBJETIVOS.map((o) => <View key={o}>{opcao(p.objetivo === o, () => up({ objetivo: o }), <T size={13.5} w={600}>{o}</T>)}</View>)}</Col>
                <Field label="Peso desejado (kg)" hint="Ritmo seguro: 0,25 a 0,75% do peso por semana. O app não incentiva perda rápida.">
                  <Input keyboardType="decimal-pad" defaultValue={p.pesoDesejado ? String(p.pesoDesejado) : ""} onChangeText={(v) => up({ pesoDesejado: num(v) })} />
                </Field>
              </Step>
            ) : null}
            {i === 3 ? (
              <Step title="Saúde e segurança" text="Só para deixar as sugestões mais seguras. Nada aqui é diagnóstico, e você pode rever em Eu.">
                {PERGUNTAS_SAUDE.map((q) => <Toggle key={q.key} on={!!state.healthScreening[q.key]} onChange={(v) => dispatch({ type: "UPDATE_HEALTH_SCREENING", patch: { [q.key]: v } })} label={q.pergunta} />)}
              </Step>
            ) : null}
            {i === 4 ? (
              <Step title="Sua rotina">
                <Field label="Modalidade principal"><Chips small value={p.modalidadePrincipal ?? "Musculação"} onChange={(v) => up({ modalidadePrincipal: v })} options={MODALIDADES.map((x) => ({ v: x, label: x }))} /></Field>
                <Field label="Nível de atividade">
                  <Col gap={8}>
                    {ATIVIDADES.map(([a, , d]) => (
                      <View key={a}>{opcao(p.atividade === a, () => up({ atividade: a }), <><T size={13.5} w={600}>{a}</T><T size={11.5} color={t.mute}>{d}</T></>)}</View>
                    ))}
                  </Col>
                </Field>
                <Field label="Dias de treino de força por semana"><Chips value={p.diasTreinoSemana} onChange={(v) => up({ diasTreinoSemana: v })} options={[1, 2, 3, 4, 5, 6].map((n) => ({ v: n, label: String(n) }))} /></Field>
                <Field label="Minutos por sessão"><Chips value={p.minutosPorTreino} onChange={(v) => up({ minutosPorTreino: v })} options={[30, 45, 60, 75, 90].map((n) => ({ v: n, label: `${n}` }))} /></Field>
              </Step>
            ) : null}
            {i === 5 ? (
              <Step title={`Tudo pronto${p.nome ? `, ${p.nome.split(" ")[0]}` : ""}!`} text="Suas metas diárias de partida (dá para ajustar em Eu › Metas):">
                <Grid cols={2}>
                  <Res l="Meta de calorias" v={`${fmtInt(m.meta)} kcal`} />
                  <Res l="Gasto estimado" v={`${fmtInt(m.get)} kcal`} />
                  <Res l="Proteína" v={`${fmtInt(m.proteina)} g`} />
                  <Res l="Carboidrato" v={`${fmtInt(m.carboidrato)} g`} />
                </Grid>
              </Step>
            ) : null}

            <Row gap={12} style={{ marginTop: "auto", paddingTop: 8 }}>
              {i > 0 ? <Button variant="secondary" flex={1} onPress={() => setI(i - 1)}>Voltar</Button> : null}
              {i < ETAPAS.length - 1 ? <Button flex={2} onPress={() => setI(i + 1)}>Continuar</Button> : <Button flex={2} onPress={concluir}>Começar</Button>}
            </Row>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Step({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <Col gap={16}>
      <Col gap={4}>
        <T size={26} w={800} style={{ letterSpacing: -0.5, lineHeight: 32 }}>{title}</T>
        {text ? <T size={13.5} color={t.soft}>{text}</T> : null}
      </Col>
      {children}
    </Col>
  );
}

function Res({ l, v }: { l: string; v: string }) {
  const t = useTheme();
  return (
    <Glass radius={18} style={{ padding: 16 }}>
      <T size={11.5} w={600} color={t.mute}>{l}</T>
      <T size={18} mono style={{ marginTop: 2 }}>{v}</T>
    </Glass>
  );
}
