import { Plus } from "lucide-react-native";
import { useStore, mealsDeHoje } from "../state/store";
import { useUi } from "../state/ui";
import TreinosPainel from "./historico/TreinosPainel";
import { daysAgoDM, fmtDec, fmtInt, isoToDM, metasDoEstado, roundedTotals } from "../lib/calc";
import { BRAND, useTheme } from "../theme";
import { B, BarChart, Button, Card, Col, Grid, LineChart, Muted, PageTitle, Row, SectionLabel, Stat, T, Tabs } from "../components/ui";

export default function Historico() {
  const { state } = useStore();
  const { openWeight, sub, setSub } = useUi();
  const t = useTheme();
  const aba = sub.historico === "corpo" ? "corpo" : "treinos";
  const p = state.profile;
  const m = metasDoEstado(state);
  const pesos = state.weights.length ? state.weights : [{ data: "hoje", peso: p.peso }];
  const atual = pesos[pesos.length - 1].peso;
  const diff = atual - pesos[0].peso;
  const falta = Math.abs(atual - p.pesoDesejado);
  const hoje = roundedTotals(mealsDeHoje(state));
  const dias = [...state.history.slice(-6).map((h) => ({ label: isoToDM(h.date), value: h.kcal })), { label: "Hoje", value: hoje.kcal }];
  const sem = state.workouts.filter((w) => daysAgoDM(w.data) < 7);
  const minSem = sem.reduce((s, w) => s + w.duracaoMin, 0);

  return (
    <>
      <PageTitle title="Histórico" subtitle="Como você está evoluindo" />
      <Tabs value={aba} onChange={(v) => setSub("historico", v)} items={[{ id: "treinos", label: "Treinos" }, { id: "corpo", label: "Peso e dieta" }]} />
      {aba === "treinos" ? <TreinosPainel /> : (
        <>
          <Card pad={20}>
            <Row between style={{ alignItems: "flex-start" }}>
              <Col gap={4}>
                <T size={12} w={600} color={t.mute}>Peso</T>
                <T size={36} mono>{fmtDec(atual)}<T size={14} mono color={t.mute}> kg</T></T>
              </Col>
              <Button size="sm" icon={<Plus size={15} color="#fff" />} onPress={openWeight}>Pesar</Button>
            </Row>
            <T size={13} color={t.soft}>
              <B color={diff <= 0 ? BRAND : undefined}>{diff <= 0 ? "−" : "+"}{fmtDec(Math.abs(diff))} kg</B> desde o início · faltam <B>{fmtDec(falta)} kg</B> para {fmtDec(p.pesoDesejado)} kg
            </T>
            {pesos.length > 1 ? <LineChart values={pesos.map((x) => x.peso)} height={120} /> : <Muted size={12} center style={{ paddingVertical: 12 }}>Pese-se uma vez por semana para ver o gráfico.</Muted>}
          </Card>
          <Grid cols={3}>
            <Stat label="Treinos" value={String(sem.length)} sub="últimos 7 dias" />
            <Stat label="Minutos" value={fmtInt(minSem)} sub="de treino" />
            <Stat label="Meta" value={fmtInt(m.meta)} sub="kcal/dia" />
          </Grid>
          <SectionLabel>Calorias dos últimos dias</SectionLabel>
          <Card pad={16} gap={8}>
            <BarChart data={dias} goal={m.meta} />
            <Muted size={11}>A linha tracejada é a sua meta ({fmtInt(m.meta)} kcal).</Muted>
          </Card>
        </>
      )}
    </>
  );
}
