import { useStore } from "../../state/store";
import { daysAgoDM, fmtDec, fmtInt } from "../../lib/calc";
import { BarChart, Card, Muted, SectionLabel, Stat } from "../../components/ui";
import { filtrar } from "./Treinar";

const km = (d: string) => {
  const m = String(d || "").replace(",", ".").match(/[\d.]+/);
  return m ? parseFloat(m[0]) || 0 : 0;
};

export default function Corrida() {
  const { state } = useStore();
  const ws = filtrar(state.workouts, "corr");
  const sem = ws.filter((w) => daysAgoDM(w.data) < 7);
  const kmSem = sem.reduce((s, w) => s + km(w.distancia), 0);
  const minSem = sem.reduce((s, w) => s + w.duracaoMin, 0);
  const comKm = ws.filter((w) => km(w.distancia) > 0);
  const kmT = comKm.reduce((s, w) => s + km(w.distancia), 0);
  const minT = comKm.reduce((s, w) => s + w.duracaoMin, 0);
  const pace = kmT > 0 ? minT / kmT : 0;
  const paceTxt = pace ? `${Math.floor(pace)}:${String(Math.round((pace % 1) * 60)).padStart(2, "0")}` : "—";
  // km por semana nas últimas 6 semanas
  const semanas = Array.from({ length: 6 }, (_, i) => {
    const ini = (5 - i) * 7;
    const v = ws.filter((w) => { const d = daysAgoDM(w.data); return d >= ini && d < ini + 7; }).reduce((s, w) => s + km(w.distancia), 0);
    return { label: i === 5 ? "Atual" : `-${5 - i}`, value: v };
  });

  return (
    <>
      <div className="grid grid-cols-3 gap-2.5">
        <Stat label="Km na semana" value={fmtDec(kmSem)} />
        <Stat label="Corridas" value={sem.length} sub="últimos 7 dias" />
        <Stat label="Ritmo médio" value={paceTxt} unit="/km" />
      </div>
      <SectionLabel>Km por semana</SectionLabel>
      <Card className="p-4">
        <BarChart data={semanas} fmt={(n) => fmtDec(n)} />
      </Card>
      <Card className="p-4 flex flex-col gap-2">
        <span className="font-bold text-[14px]">Como evoluir</span>
        <Muted className="text-[12.5px] leading-relaxed">
          Comece com 2 corridas leves por semana de 20–30 min, num ritmo em que dá para conversar. Aumente no máximo 10% do volume por semana e intercale com caminhada se precisar.
        </Muted>
        <Muted className="text-[12px]">{fmtInt(minSem)} min corridos nos últimos 7 dias. Registre a distância para o app calcular seu ritmo.</Muted>
      </Card>
    </>
  );
}
