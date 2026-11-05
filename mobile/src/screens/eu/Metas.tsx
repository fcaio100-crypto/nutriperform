import { useState } from "react";
import { View } from "react-native";
import { useStore } from "../../state/store";
import { useUi } from "../../state/ui";
import { ATIVIDADES, fmtDec, fmtInt, metasDoEstado, ritmoPeso, triagem } from "../../lib/calc";
import type { AppState } from "../../lib/types";
import { BRAND, DANGER, WARN, useTheme } from "../../theme";
import { B, Box, Button, Card, Chips, Col, Collapse, Field, Grid, Input, Muted, Row, SectionLabel, Slider, T } from "../../components/ui";
import { SafetyCard } from "../../components/shell";

export default function Metas() {
  const { state, dispatch } = useStore();
  const { notify } = useUi();
  const t = useTheme();
  const p = state.profile;
  const m = metasDoEstado(state);
  const [ritmo, setRitmo] = useState(0.5);
  const [gasto, setGasto] = useState(state.gastoManualKcal ? String(state.gastoManualKcal) : "");
  const r = ritmoPeso(p.peso, p.pesoDesejado, ritmo);
  const consumo = m.get - r.kcalPorDia;
  const impossivel = r.direcao === "deficit" && consumo <= 0;
  const baixo = r.direcao === "deficit" && !impossivel && consumo < m.get * 0.5;
  const vermelho = triagem(state.healthScreening, m.imc, p.idade).nivel === "vermelho";
  const set = (patch: Partial<AppState>) => dispatch({ type: "SET_GOALS", patch });
  const macros = [
    { l: "Proteína", g: m.proteina, k: m.proteina * 4, c: BRAND },
    { l: "Carboidrato", g: m.carboidrato, k: m.carboidrato * 4, c: WARN },
    { l: "Gordura", g: m.gordura, k: m.gordura * 9, c: "#7A6CC4" },
  ];

  return (
    <>
      <Card tone="dark" pad={20}>
        <Grid cols={2} gap={16}>
          <Col gap={2}>
            <T size={11} w={700} color="#8FD3AE" upper track={0.5}>Você gasta</T>
            <T size={22} mono color="#fff">{fmtInt(m.get)}</T>
            <T size={11} color="#B9CFC2">{m.usandoGastoManual ? "informado por você" : "pela fórmula"}</T>
          </Col>
          <Col gap={2}>
            <T size={11} w={700} color="#8FD3AE" upper track={0.5}>Você deve comer</T>
            <T size={22} mono color="#fff">{fmtInt(m.meta)}</T>
            <T size={11} color="#B9CFC2">{state.deficit > 0 ? `déficit de ${fmtInt(state.deficit)}` : state.deficit < 0 ? `superávit de ${fmtInt(-state.deficit)}` : "manutenção"} kcal</T>
          </Col>
        </Grid>
      </Card>

      <SectionLabel>Macros do dia</SectionLabel>
      <Card pad={16}>
        <View style={{ flexDirection: "row", height: 12, borderRadius: 6, overflow: "hidden" }}>
          {macros.map((x) => <View key={x.l} style={{ width: `${(x.k / Math.max(1, m.meta)) * 100}%`, backgroundColor: x.c }} />)}
        </View>
        {macros.map((x) => (
          <Row key={x.l} between>
            <Row gap={8}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: x.c }} /><T size={13}>{x.l}</T></Row>
            <T size={13} mono>{fmtInt(x.g)} g · {fmtInt(x.k)} kcal</T>
          </Row>
        ))}
        <Field label={`Proteína: ${fmtDec(state.protPerKg)} g por kg`}><Slider min={1.2} max={2.6} step={0.1} value={state.protPerKg} onChange={(v) => set({ protPerKg: Math.round(v * 10) / 10 })} /></Field>
        <Field label={`Gorduras: ${state.fatPct}% das calorias`}><Slider min={15} max={40} value={state.fatPct} onChange={(v) => set({ fatPct: v })} /></Field>
      </Card>

      <SectionLabel>Planejar o ritmo</SectionLabel>
      {vermelho ? <SafetyCard compact /> : null}
      <Card pad={16}>
        {r.direcao === "manutencao" ? (
          <Muted>Seu peso atual já é o desejado ({fmtDec(p.pesoDesejado)} kg). Mantenha o ajuste perto de zero.</Muted>
        ) : (
          <>
            <T size={13}>{fmtDec(p.peso)} kg → <B>{fmtDec(p.pesoDesejado)} kg</B> ({r.direcao === "deficit" ? "perder" : "ganhar"} {fmtDec(r.kgAlvo)} kg)</T>
            <Chips value={ritmo} onChange={setRitmo} options={[0.25, 0.5, 0.75].map((x) => ({ v: x, label: `${String(x).replace(".", ",")}% /sem` }))} />
            <Grid cols={2}>
              <Box l={r.direcao === "deficit" ? "Déficit" : "Superávit"} v={`${fmtInt(Math.abs(r.kcalPorDia))} kcal/dia`} />
              <Box l="Tempo estimado" v={`~${Math.ceil(r.semanas)} semanas`} />
            </Grid>
            {impossivel ? <T size={12} color={DANGER}>Esse ritmo pede um déficit maior que o seu gasto. Escolha um mais lento.</T> : null}
            {baixo ? <T size={12} color={WARN}>Consumo bem abaixo do gasto — um ritmo mais lento é mais sustentável.</T> : null}
            <Button disabled={impossivel || vermelho} onPress={() => { set({ deficit: r.kcalPorDia }); notify("Meta atualizada"); }}>{`Aplicar: comer ≈ ${fmtInt(consumo)} kcal/dia`}</Button>
            <Muted size={11}>Referência de ~7.700 kcal por kg. Ritmos acima de 1% por semana aumentam a perda de massa magra.</Muted>
          </>
        )}
      </Card>

      <Collapse title="Ajuste fino do déficit" subtitle={`${state.deficit >= 0 ? "Déficit" : "Superávit"} atual: ${fmtInt(Math.abs(state.deficit))} kcal`}>
        <Slider min={-800} max={1000} step={50} value={state.deficit} onChange={(v) => set({ deficit: v })} />
        <Muted size={11.5}>Direita: comer menos que o gasto. Esquerda: comer mais.</Muted>
      </Collapse>

      <Collapse title="Seu gasto calórico" subtitle={m.usandoGastoManual ? "Usando o valor do seu relógio" : "Calculado pela fórmula"}>
        <Chips value={state.gastoManualAtivo ? "m" : "c"} onChange={(v) => set({ gastoManualAtivo: v === "m" })} options={[{ v: "c", label: "Fórmula" }, { v: "m", label: "Informar (relógio)" }]} />
        {state.gastoManualAtivo ? (
          <Row gap={8}>
            <Input keyboardType="number-pad" value={gasto} onChangeText={setGasto} placeholder="Ex.: 2800" style={{ flex: 1 }} />
            <Button variant="secondary" onPress={() => { const v = Math.round(Number(gasto)); if (v > 0) { set({ gastoManualKcal: v }); notify("Gasto atualizado"); } }}>Salvar</Button>
          </Row>
        ) : null}
        <Grid cols={2}>
          <Box l="TMB (Mifflin-St Jeor)" v={`${fmtInt(m.tmb)} kcal`} />
          <Box l="Fator de atividade" v={`× ${m.fator}`} />
        </Grid>
        <Field label="Nível de atividade">
          <Chips small value={p.atividade} onChange={(v) => dispatch({ type: "UPDATE_PROFILE", patch: { atividade: v } })} options={ATIVIDADES.map(([a]) => ({ v: a, label: a }))} />
        </Field>
        <T size={11} color={t.mute}>Pela fórmula: {fmtInt(m.getCalculado)} kcal/dia. Quem pesa mais gasta mais, mesmo parado.</T>
      </Collapse>
    </>
  );
}
