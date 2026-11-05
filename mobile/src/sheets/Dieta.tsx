import { useState } from "react";
import { View } from "react-native";
import { useStore } from "../state/store";
import { useUi } from "../state/ui";
import { fmtDec, fmtInt, gerarPlano, metas, ritmoPeso, triagem } from "../lib/calc";
import type { PlanMeal } from "../lib/types";
import { DANGER, useTheme } from "../theme";
import { B, Box, Button, Chips, Col, Field, Grid, Input, Row, Sheet, T } from "../components/ui";
import { SafetyCard } from "../components/shell";

export default function Dieta() {
  const { state, dispatch } = useStore();
  const { close, notify } = useUi();
  const t = useTheme();
  const p = state.profile;
  const [ritmo, setRitmo] = useState(0.5);
  const calc = metas(p, 0, state.protPerKg, state.fatPct);
  const [gasto, setGasto] = useState(String(state.gastoManualKcal || Math.round(calc.getCalculado)));
  const [plano, setPlano] = useState<PlanMeal[] | null>(null);
  const r = ritmoPeso(p.peso, p.pesoDesejado, ritmo);
  const g = Math.round(Number(gasto));
  const meta = g - r.kcalPorDia;
  const invalido = g > 0 && r.direcao === "deficit" && meta <= 0;
  const bloqueado = triagem(state.healthScreening, calc.imc, p.idade).nivel === "vermelho";
  const pode = g > 0 && !invalido && !bloqueado;

  function aplicar() {
    if (!plano) return;
    dispatch({ type: "APLICAR_DIETA_GERADA", gastoManualKcal: g, deficit: r.kcalPorDia, refeicoes: plano });
    notify("Plano aplicado às suas metas");
    close();
  }

  return (
    <Sheet title="Montar meu plano" onClose={close} footer={plano ? <Button size="lg" onPress={aplicar}>Usar este plano</Button> : <Button size="lg" disabled={!pode} onPress={() => setPlano(gerarPlano(meta))}>Montar plano</Button>}>
      {bloqueado ? <SafetyCard compact /> : null}
      <T size={12.5} color={t.soft}>A partir do seu gasto diário e do objetivo de chegar a <B>{fmtDec(p.pesoDesejado)} kg</B>, o app monta um cardápio com as calorias certas.</T>
      <Field label="Quanto você gasta por dia (kcal)" hint={`Use a média do relógio (7–14 dias). Pela fórmula: ≈ ${fmtInt(calc.getCalculado)} kcal.`}>
        <Input keyboardType="number-pad" value={gasto} onChangeText={(v) => { setGasto(v); setPlano(null); }} />
      </Field>
      {r.direcao !== "manutencao" ? (
        <Field label="Ritmo por semana">
          <Chips value={ritmo} onChange={(v) => { setRitmo(v); setPlano(null); }} options={[0.25, 0.5, 0.75].map((x) => ({ v: x, label: `${String(x).replace(".", ",")}%` }))} />
        </Field>
      ) : null}
      <Grid cols={2}>
        <Box l={r.direcao === "superavit" ? "Superávit" : "Déficit"} v={`${fmtInt(Math.abs(r.kcalPorDia))} kcal/dia`} />
        <Box l="Você vai comer" v={g > 0 ? `${fmtInt(meta)} kcal/dia` : "—"} />
      </Grid>
      {r.semanas > 0 ? <T size={11.5} color={t.mute}>Estimativa: ~{Math.ceil(r.semanas)} semanas ({fmtDec(r.kgPorSemana, 2)} kg/semana).</T> : null}
      {invalido ? <T size={12} color={DANGER}>Esse ritmo pede um déficit maior que o seu gasto. Escolha um ritmo mais lento.</T> : null}
      {plano ? (
        <Col gap={8}>
          {plano.map((m) => (
            <View key={m.id} style={{ padding: 12, borderRadius: 14, backgroundColor: t.raised }}>
              <Row between><T size={12.5} w={700}>{m.hora} · {m.nome}</T><T size={12.5} mono w={700}>{m.kcal} kcal</T></Row>
              <T size={11.5} color={t.soft} style={{ marginTop: 2 }}>{m.descricao}</T>
            </View>
          ))}
          <T size={11} color={t.mute}>Total: {fmtInt(plano.reduce((s, m) => s + m.kcal, 0))} kcal. Usar este plano substitui o plano atual e ajusta suas metas.</T>
        </Col>
      ) : null}
    </Sheet>
  );
}
