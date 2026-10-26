import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useStore } from "../state/store";
import { useUi } from "../state/ui";
import { COM_DISTANCIA, DURACAO_PADRAO, FUNC_META, FUNC_MOD, MOBILIDADE, NIVEIS, blocosFuncional, progressoFuncional, type Item } from "../data/exercises";
import { diaMusculacao } from "../lib/plan";
import { intensidade, isoToDM, kcalEstimada, nowHM } from "../lib/calc";
import type { Workout } from "../lib/types";
import { Bar, Button, Chips, ExerciseRow, Field, Input, Muted, cx } from "../components/ui";

/** Tela cheia: o treino do dia, passo a passo. */
export default function TreinoGuiado() {
  const { treino, close } = useUi();
  if (!treino) return null;
  const { mod, date } = treino;
  const lista = mod === FUNC_MOD || mod === "Mobilidade" || mod === "Musculação";
  return (
    <div className="fixed inset-0 z-50 bg-surface dark:bg-surface-dark overflow-y-auto anim-fade">
      <div className="max-w-[560px] mx-auto px-4 pb-10 flex flex-col gap-4" style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}>
        <button type="button" onClick={close} className="self-start flex items-center gap-1.5 text-[13px] font-bold text-ink-soft py-1">
          <ArrowLeft size={18} /> Voltar
        </button>
        {lista ? <ComLista mod={mod} date={date} /> : <Atividade mod={mod} date={date} />}
      </div>
    </div>
  );
}

function ComLista({ mod, date }: { mod: string; date: string }) {
  const { state, dispatch } = useStore();
  const { notify, openShare } = useUi();
  const [feito, setFeito] = useState<Record<string, boolean>>({});
  const [diaIdx, setDiaIdx] = useState<number | undefined>(undefined);

  let titulo = mod;
  let sub = "";
  let min = 10;
  let secoes: { titulo: string; dica?: string; itens: Item[] }[] = [];
  let topo: React.ReactNode = null;
  let nivel: number | undefined;

  if (mod === FUNC_MOD) {
    const P = progressoFuncional(state.workouts);
    const N = NIVEIS[P.nivel - 1];
    titulo = "Funcional em casa";
    sub = `Nível ${N.n} · ${N.nome} · ~${N.min} min`;
    min = N.min;
    nivel = N.n;
    secoes = blocosFuncional(N).map((b, i) => ({ titulo: `${i + 1}. ${b.titulo} · ${b.tempo}`, dica: b.dica, itens: b.itens }));
    topo = (
      <div className="flex flex-col gap-1.5">
        <Bar pct={P.max ? 100 : (P.pts / FUNC_META) * 100} />
        <Muted className="text-[11.5px]">{P.max ? "Nível máximo." : `${P.pts} de ${FUNC_META} treinos para subir de nível`}</Muted>
      </div>
    );
  } else if (mod === "Mobilidade") {
    titulo = "Mobilidade";
    sub = "~10 min · movimentos lentos, sem dor";
    secoes = [{ titulo: "Rotina", itens: MOBILIDADE }];
  } else {
    const d = diaMusculacao(state, diaIdx);
    titulo = "Musculação";
    min = state.profile.minutosPorTreino || 60;
    if (d) {
      sub = `${d.titulo} · ${d.exercicios.length} exercícios`;
      secoes = [{ titulo: d.foco || d.titulo, itens: d.exercicios.map((e) => [e.nome, `${e.series}×${e.repeticoes}`] as Item) }];
      if (d.total > 1)
        topo = <Chips small value={d.indice} onChange={(v) => { setDiaIdx(v); setFeito({}); }} options={d.todos.map((_, i) => ({ v: i, label: `Treino ${String.fromCharCode(65 + i)}` }))} />;
    } else {
      sub = "Sem rotina cadastrada";
    }
  }

  const total = secoes.reduce((s, x) => s + x.itens.length, 0);
  const marcados = Object.values(feito).filter(Boolean).length;

  function concluir(sensacao: string) {
    const pse = sensacao === "Fácil" ? 4 : sensacao === "Na medida" ? 6 : 8;
    const w: Workout = {
      id: Date.now(), modalidade: mod, data: isoToDM(date), dataISO: date, hora: nowHM(), duracaoMin: min, intensidade: intensidade(pse),
      distancia: "—", kcal: mod === FUNC_MOD ? Math.round(min * 7.6) : kcalEstimada(min, pse), pse, sensacao, nivel,
    };
    dispatch({ type: "ADD_WORKOUT", workout: w });
    if (mod === FUNC_MOD) {
      const depois = progressoFuncional([w, ...state.workouts]);
      notify(
        depois.ultimo === "subiu" ? `Subiu para o Nível ${depois.nivel} — ${NIVEIS[depois.nivel - 1].nome}! 🎉`
        : depois.ultimo === "desceu" ? `Voltamos ao Nível ${depois.nivel} para consolidar.`
        : depois.max ? "Treino feito! Nível máximo." : `Treino feito! Faltam ${FUNC_META - depois.pts} para subir de nível.`,
      );
    } else notify(`${titulo} feito ✓`);
    openShare(w);
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-extrabold text-[26px] tracking-tight leading-tight">{titulo}</h1>
        <Muted className="text-[13px] font-semibold">{sub}</Muted>
      </div>
      {topo}
      <Muted className="text-[12px]">Marque cada exercício ao terminar. Toque no nome para ver como fazer e o vídeo.</Muted>

      {secoes.map((s) => (
        <div key={s.titulo} className="flex flex-col gap-1">
          <span className="font-bold text-[12px] tracking-wide uppercase text-ink-mute mt-1">{s.titulo}</span>
          <div className="px-4 py-1 rounded-2xl bg-surface-card dark:bg-surface-cardDark border border-line dark:border-line-dark">
            {s.itens.map(([nome, qtd], j) => {
              const k = s.titulo + j;
              return <ExerciseRow key={k} nome={nome} qtd={qtd} done={!!feito[k]} onToggle={() => setFeito((x) => ({ ...x, [k]: !x[k] }))} />;
            })}
          </div>
        </div>
      ))}

      <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-4 bg-surface/95 dark:bg-surface-dark/95 backdrop-blur border-t border-line dark:border-line-dark flex flex-col gap-2.5" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
        <div className="flex items-center justify-between">
          <span className="font-bold text-[14px]">Terminou? Como foi?</span>
          <span className="font-mono text-[12px] text-ink-mute">{marcados}/{total}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["Fácil", "Na medida", "Difícil"].map((s) => (
            <button key={s} type="button" onClick={() => concluir(s)} disabled={total === 0} className={cx("py-3.5 rounded-xl font-bold text-[13.5px]", s === "Na medida" ? "bg-brand text-white" : "bg-surface-card dark:bg-surface-cardDark border border-line dark:border-line-dark")}>{s}</button>
          ))}
        </div>
        {mod === FUNC_MOD && <Muted className="text-[11px]">Fácil ou Na medida contam ponto para subir de nível. Dois Difícil seguidos voltam um nível.</Muted>}
      </div>
    </>
  );
}

function Atividade({ mod, date }: { mod: string; date: string }) {
  const { dispatch } = useStore();
  const { openShare, notify } = useUi();
  const [min, setMin] = useState(DURACAO_PADRAO[mod] ?? 45);
  const [pse, setPse] = useState(6);
  const [dist, setDist] = useState("");
  const temDist = COM_DISTANCIA.includes(mod);

  function salvar() {
    const w: Workout = { id: Date.now(), modalidade: mod, data: isoToDM(date), dataISO: date, hora: nowHM(), duracaoMin: min, intensidade: intensidade(pse), distancia: temDist && dist.trim() ? dist.trim() : "—", kcal: kcalEstimada(min, pse), pse };
    dispatch({ type: "ADD_WORKOUT", workout: w });
    notify(`${mod} registrado ✓`);
    openShare(w);
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-extrabold text-[26px] tracking-tight leading-tight">{mod}</h1>
        <Muted className="text-[13px] font-semibold">Quando terminar, registre aqui.</Muted>
      </div>
      {mod === "Corrida" && (
        <div className="p-4 rounded-2xl bg-brand-soft dark:bg-brand-softDark text-[12.5px] leading-relaxed">
          Corra num ritmo em que dá para conversar. Aumente no máximo 10% do volume por semana e intercale com caminhada se precisar.
        </div>
      )}
      {(mod === "Futebol" || mod === "Beach tennis") && (
        <div className="p-4 rounded-2xl bg-brand-soft dark:bg-brand-softDark text-[12.5px] leading-relaxed">
          Antes do jogo: 8–10 min de aquecimento (trote, skipping, afundos andando, deslocamento lateral). Leve água: +500 a 750 ml por hora.
        </div>
      )}
      <Field label="Quanto tempo durou?">
        <Chips value={min} onChange={setMin} options={[20, 30, 45, 60, 90].map((n) => ({ v: n, label: `${n} min` }))} />
      </Field>
      {temDist && (
        <Field label="Distância (opcional)"><Input value={dist} onChange={(e) => setDist(e.target.value)} placeholder="Ex.: 5 km" /></Field>
      )}
      <Field label={`Esforço: ${pse}/10 · ${intensidade(pse)}`}>
        <input type="range" min={1} max={10} value={pse} onChange={(e) => setPse(Number(e.target.value))} />
      </Field>
      <Button size="lg" onClick={salvar}>Registrar {mod.toLowerCase()} · ≈ {kcalEstimada(min, pse)} kcal</Button>
    </>
  );
}
