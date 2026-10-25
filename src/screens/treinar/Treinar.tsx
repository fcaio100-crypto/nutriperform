import { Plus, Trash2 } from "lucide-react";
import { useStore } from "../../state/store";
import { useUi } from "../../state/ui";
import { ABAS_TREINO, type AbaTreino } from "../../data/exercises";
import { daysAgoDM, fmtInt } from "../../lib/calc";
import type { Workout } from "../../lib/types";
import { Button, Card, Collapse, Empty, Muted, PageTitle, SectionLabel, Tabs, Pill } from "../../components/ui";
import { SafetyCard } from "../../components/shell";
import Musculacao from "./Musculacao";
import Funcional from "./Funcional";
import Corrida from "./Corrida";
import Mobilidade from "./Mobilidade";

const INTRO: Record<AbaTreino, string> = {
  musc: "Sua rotina de academia: a divisão sugerida pelo app ou a do seu personal.",
  func: "Treino em casa, sem equipamento, que sobe de nível com você.",
  corr: "Volume da semana, ritmo e dicas para evoluir na corrida.",
  mob: "Rotina curta para soltar quadril, tornozelo e coluna. O ideal é todo dia.",
  esp: "Futebol, beach tennis, ciclismo e natação.",
};

export const filtrar = (ws: Workout[], aba: AbaTreino) => {
  const a = ABAS_TREINO.find((x) => x.id === aba)!;
  return ws.filter((w) => (a.mods as readonly string[]).includes(w.modalidade));
};

export default function Treinar() {
  const { state } = useStore();
  const { sub, setSub, openWorkout } = useUi();
  const aba = (sub.treinar as AbaTreino) || "musc";
  const def = ABAS_TREINO.find((a) => a.id === aba)!;
  const semana = state.workouts.filter((w) => daysAgoDM(w.data) < 7);
  const kcalSemana = semana.reduce((s, w) => s + w.kcal, 0);

  return (
    <>
      <PageTitle
        title="Treinar"
        subtitle={`${semana.length} ${semana.length === 1 ? "sessão" : "sessões"} nos últimos 7 dias · ${fmtInt(kcalSemana)} kcal`}
        action={<Button size="sm" onClick={() => openWorkout(def.reg)}><Plus size={15} /> Registrar</Button>}
      />
      <Tabs value={aba} onChange={(v) => setSub("treinar", v)} items={ABAS_TREINO.map((a) => ({ id: a.id, label: a.label, badge: filtrar(state.workouts, a.id).length }))} />
      <Muted className="text-[12.5px] -mt-1">{INTRO[aba]}</Muted>
      <SafetyCard compact />

      {aba === "musc" && <Musculacao />}
      {aba === "func" && <Funcional />}
      {aba === "corr" && <Corrida />}
      {aba === "mob" && <Mobilidade />}

      <Historico aba={aba} />
      <AlimentacaoTreino />
    </>
  );
}

function Historico({ aba }: { aba: AbaTreino }) {
  const { state, dispatch } = useStore();
  const { openWorkout } = useUi();
  const def = ABAS_TREINO.find((a) => a.id === aba)!;
  const lista = filtrar(state.workouts, aba);
  return (
    <>
      <SectionLabel>Histórico · {def.label}</SectionLabel>
      {lista.length === 0 ? (
        <Card className="p-2">
          <Empty title="Nenhum treino registrado" text="Quando registrar, ele aparece aqui." action={<Button size="sm" variant="secondary" onClick={() => openWorkout(def.reg)}>Registrar {aba === "esp" ? "esporte" : def.label.toLowerCase()}</Button>} />
        </Card>
      ) : (
        <Card className="divide-y divide-line dark:divide-line-dark">
          {lista.slice(0, 30).map((w) => (
            <div key={w.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[13px]">{w.modalidade}</span>
                  {w.nivel && <Pill>Nível {w.nivel}</Pill>}
                  {w.sensacao && <Pill tone="mute">{w.sensacao}</Pill>}
                  {w.origem && <Pill tone="water">{w.origem}</Pill>}
                </div>
                <span className="font-mono text-[11px] text-ink-mute">
                  {w.data} · {w.duracaoMin} min · {w.intensidade}{w.distancia && w.distancia !== "—" && !w.distancia.startsWith("Nível") ? ` · ${w.distancia}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-none">
                <span className="font-mono text-[12.5px]">{fmtInt(w.kcal)} kcal</span>
                <button type="button" aria-label="Apagar" onClick={() => { if (confirm("Apagar este treino?")) dispatch({ type: "REMOVE_WORKOUT", id: w.id }); }} className="text-ink-mute hover:text-danger"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

function AlimentacaoTreino() {
  const { state } = useStore();
  const p = state.profile.peso;
  return (
    <Collapse title="Alimentação do treino" subtitle="Pré, durante e pós-treino">
      <Linha t="Pré-treino · 1 a 4 h antes" v={`${Math.round(p * 1.5)} g de carboidrato`} d="Ex.: cuscuz + ovos + banana." />
      <Linha t="Durante · acima de 60 min" v="30–60 g de carboidrato/hora" d="Água, eletrólitos, gel ou bebida esportiva." />
      <Linha t="Pós-treino · recuperação" v={`${Math.round(p * 0.3)} g de proteína + ${Math.round(p)} g de carboidrato`} d="Mais carboidrato se treinar de novo em menos de 24 h." />
    </Collapse>
  );
}
function Linha({ t, v, d }: { t: string; v: string; d: string }) {
  return (
    <div className="p-3 rounded-xl bg-surface-raised dark:bg-surface-raisedDark">
      <div className="text-[11px] font-bold text-brand uppercase tracking-wide">{t}</div>
      <div className="font-mono text-[14px] mt-0.5">{v}</div>
      <div className="text-[11.5px] text-ink-mute mt-0.5">{d}</div>
    </div>
  );
}
