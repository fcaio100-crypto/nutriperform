import { useState } from "react";
import { useStore } from "../../state/store";
import { useUi } from "../../state/ui";
import { MOBILIDADE } from "../../data/exercises";
import { daysAgoDM, isoToDM, nowHM, todayISO } from "../../lib/calc";
import { Button, Card, ExerciseRow, Muted, SectionLabel, cx } from "../../components/ui";
import { filtrar } from "./Treinar";

export default function Mobilidade() {
  const { state, dispatch } = useStore();
  const { notify } = useUi();
  const [feito, setFeito] = useState<Record<number, boolean>>({});
  const ws = filtrar(state.workouts, "mob");
  const hoje = isoToDM(todayISO());
  const feitoHoje = ws.some((w) => w.data === hoje);
  // últimos 7 dias, do mais antigo para hoje
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dm = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { dm, letra: "DSTQQSS"[d.getDay()], ok: ws.some((w) => w.data === dm) };
  });
  const naSemana = new Set(ws.filter((w) => daysAgoDM(w.data) < 7).map((w) => w.data)).size;

  function concluir() {
    dispatch({ type: "ADD_WORKOUT", workout: { id: Date.now(), modalidade: "Mobilidade", data: hoje, hora: nowHM(), duracaoMin: 10, intensidade: "Leve", distancia: "—", kcal: 30, pse: 3 } });
    setFeito({});
    notify("Mobilidade de hoje registrada ✓");
  }

  return (
    <>
      <Card className="p-4 flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="font-bold text-[14px]">{naSemana} de 7 dias nesta semana</span>
          <span className={cx("text-[11.5px] font-bold", feitoHoje ? "text-brand" : "text-ink-mute")}>{feitoHoje ? "Hoje ✓" : "Hoje pendente"}</span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {dias.map((d) => (
            <div key={d.dm} className="flex flex-col items-center gap-1">
              <div className={cx("w-full aspect-square rounded-xl flex items-center justify-center text-[12px] font-bold", d.ok ? "bg-brand text-white" : "bg-surface-raised dark:bg-surface-raisedDark text-ink-mute")}>{d.ok ? "✓" : ""}</div>
              <span className="text-[10px] font-semibold text-ink-mute">{d.letra}</span>
            </div>
          ))}
        </div>
      </Card>

      <SectionLabel>Rotina · ~10 min</SectionLabel>
      <Card className="px-4 py-1">
        {MOBILIDADE.map(([nome, qtd], i) => (
          <ExerciseRow key={i} nome={nome} qtd={qtd} done={!!feito[i]} onToggle={() => setFeito((x) => ({ ...x, [i]: !x[i] }))} />
        ))}
      </Card>
      <Muted className="text-[11.5px] -mt-1">Toque no nome do exercício para ver como fazer e o vídeo.</Muted>
      <Button size="lg" onClick={concluir}>Concluí a mobilidade de hoje</Button>
    </>
  );
}
