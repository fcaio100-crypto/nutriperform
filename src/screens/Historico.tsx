import { Plus } from "lucide-react";
import { useStore, mealsDeHoje } from "../state/store";
import { useUi } from "../state/ui";
import TreinosPainel from "./historico/TreinosPainel";
import { daysAgoDM, fmtDec, fmtInt, isoToDM, metasDoEstado, roundedTotals } from "../lib/calc";
import { BarChart, Button, Card, LineChart, Muted, PageTitle, SectionLabel, Tabs } from "../components/ui";

export default function Historico() {
  const { state } = useStore();
  const { openWeight, sub, setSub } = useUi();
  const aba = sub.historico === "corpo" ? "corpo" : "treinos";
  const p = state.profile;
  const m = metasDoEstado(state);
  const pesos = state.weights.length ? state.weights : [{ data: "hoje", peso: p.peso }];
  const atual = pesos[pesos.length - 1].peso;
  const inicial = pesos[0].peso;
  const diff = atual - inicial;
  const falta = Math.abs(atual - p.pesoDesejado);

  const hoje = roundedTotals(mealsDeHoje(state));
  const dias = [...state.history.slice(-6).map((h) => ({ label: isoToDM(h.date), value: h.kcal })), { label: "Hoje", value: hoje.kcal }];
  const sem = state.workouts.filter((w) => daysAgoDM(w.data) < 7);
  const minSem = sem.reduce((s, w) => s + w.duracaoMin, 0);

  return (
    <>
      <PageTitle title="Histórico" subtitle="Como você está evoluindo" />
      <Tabs value={aba} onChange={(v) => setSub("historico", v)} items={[{ id: "treinos", label: "Treinos" }, { id: "corpo", label: "Peso e dieta" }]} />
      {aba === "treinos" ? <TreinosPainel /> : <>

      <Card className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[12px] font-semibold text-ink-mute">Peso</div>
            <div className="font-mono text-[34px] leading-none mt-1">{fmtDec(atual)}<span className="text-[14px] text-ink-mute"> kg</span></div>
          </div>
          <Button size="sm" onClick={openWeight}><Plus size={15} /> Pesar</Button>
        </div>
        <span className="text-[13px] text-ink-soft">
          <b className={diff <= 0 ? "text-brand" : ""}>{diff <= 0 ? "−" : "+"}{fmtDec(Math.abs(diff))} kg</b> desde o início · faltam <b>{fmtDec(falta)} kg</b> para {fmtDec(p.pesoDesejado)} kg
        </span>
        {pesos.length > 1 ? <LineChart values={pesos.map((x) => x.peso)} height={120} /> : <Muted className="text-[12px] py-3 text-center">Pese-se uma vez por semana para ver o gráfico.</Muted>}
      </Card>

      <div className="grid grid-cols-3 gap-2.5">
        <Mini l="Treinos" v={String(sem.length)} s="últimos 7 dias" />
        <Mini l="Minutos" v={fmtInt(minSem)} s="de treino" />
        <Mini l="Meta" v={fmtInt(m.meta)} s="kcal/dia" />
      </div>

      <SectionLabel>Calorias dos últimos dias</SectionLabel>
      <Card className="p-4 flex flex-col gap-2">
        <BarChart data={dias} goal={m.meta} />
        <Muted className="text-[11px]">A linha tracejada é a sua meta ({fmtInt(m.meta)} kcal).</Muted>
      </Card>
      </>}

    </>
  );
}

function Mini({ l, v, s }: { l: string; v: string; s: string }) {
  return (
    <Card className="p-3.5 flex flex-col">
      <span className="text-[11px] font-semibold text-ink-mute">{l}</span>
      <span className="font-mono text-[20px] leading-tight">{v}</span>
      <span className="text-[10.5px] text-ink-mute">{s}</span>
    </Card>
  );
}
