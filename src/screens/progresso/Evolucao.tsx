import { useStore, mealsDeHoje } from "../../state/store";
import { daysAgoDM, fmtInt, isoToDM, metasDoEstado, roundedTotals } from "../../lib/calc";
import { BarChart, Card, Muted, SectionLabel, Stat } from "../../components/ui";

export default function Evolucao() {
  const { state } = useStore();
  const m = metasDoEstado(state);
  const hoje = roundedTotals(mealsDeHoje(state));
  const dias = [...state.history.slice(-6).map((h) => ({ label: isoToDM(h.date), kcal: h.kcal, prot: h.proteina })), { label: "Hoje", kcal: hoje.kcal, prot: hoje.proteina }];
  const comDados = dias.filter((d) => d.kcal > 0);
  const mediaKcal = comDados.length ? comDados.reduce((s, d) => s + d.kcal, 0) / comDados.length : 0;
  const treinos = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dm = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { label: i === 6 ? "Hoje" : "DSTQQSS"[d.getDay()], value: state.workouts.filter((w) => w.data === dm).reduce((s, w) => s + w.duracaoMin, 0) };
  });
  const sessoes = state.workouts.filter((w) => daysAgoDM(w.data) < 7).length;

  return (
    <>
      <div className="grid grid-cols-3 gap-2.5">
        <Stat label="Média kcal" value={fmtInt(mediaKcal)} sub={`meta ${fmtInt(m.meta)}`} />
        <Stat label="Treinos" value={sessoes} sub="em 7 dias" />
        <Stat label="Pesagens" value={state.weights.length} sub="registradas" />
      </div>
      <SectionLabel>Calorias por dia</SectionLabel>
      <Card className="p-4"><BarChart data={dias.map((d) => ({ label: d.label, value: d.kcal }))} goal={m.meta} /></Card>
      <SectionLabel>Proteína por dia (g)</SectionLabel>
      <Card className="p-4"><BarChart data={dias.map((d) => ({ label: d.label, value: d.prot }))} goal={m.proteina} color="#7A6CC4" /></Card>
      <SectionLabel>Minutos de treino</SectionLabel>
      <Card className="p-4"><BarChart data={treinos} color="#C2852B" /></Card>
      {state.history.length === 0 && <Muted className="text-[11.5px] text-center">O histórico começa a encher a partir de amanhã.</Muted>}
    </>
  );
}
