import { useState } from "react";
import { useStore } from "../../state/store";
import { useUi } from "../../state/ui";
import { FUNC_META, FUNC_MOD, NIVEIS, blocosFuncional, progressoFuncional } from "../../data/exercises";
import { intensidade, isoToDM, nowHM, todayISO } from "../../lib/calc";
import { Bar, Card, Collapse, ExerciseRow, Muted, SectionLabel, cx } from "../../components/ui";

export default function Funcional() {
  const { state, dispatch } = useStore();
  const { notify } = useUi();
  const [feito, setFeito] = useState<Record<string, boolean>>({});
  const P = progressoFuncional(state.workouts);
  const N = NIVEIS[P.nivel - 1];
  const blocos = blocosFuncional(N);
  const total = blocos.reduce((s, b) => s + b.itens.length, 0);
  const marcados = Object.values(feito).filter(Boolean).length;

  function concluir(sensacao: string) {
    const pse = sensacao === "Fácil" ? 4 : sensacao === "Na medida" ? 6 : 8;
    const w = { id: Date.now(), modalidade: FUNC_MOD, data: isoToDM(todayISO()), hora: nowHM(), duracaoMin: N.min, intensidade: intensidade(pse), distancia: `Nível ${N.n}`, kcal: Math.round(N.min * 7.6), pse, nivel: N.n, sensacao };
    const depois = progressoFuncional([w, ...state.workouts]);
    dispatch({ type: "ADD_WORKOUT", workout: w });
    setFeito({});
    notify(
      depois.ultimo === "subiu" ? `Subiu para o Nível ${depois.nivel} — ${NIVEIS[depois.nivel - 1].nome}! 🎉`
      : depois.ultimo === "desceu" ? `Voltamos ao Nível ${depois.nivel} para consolidar.`
      : sensacao === "Difícil" ? "Registrado. O nível se mantém até ficar confortável."
      : depois.max ? "Registrado. Você está no nível máximo!"
      : `Registrado. Faltam ${FUNC_META - depois.pts} para subir de nível.`,
    );
  }

  return (
    <>
      <Card tone="dark" className="p-5 flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-bold text-[#8FD3AE] tracking-wide uppercase">Em casa · ~{N.min} min</span>
          <span className="font-mono text-[11px] text-[#B9CFC2]">{P.total} sessões</span>
        </div>
        <span className="font-extrabold text-[22px] leading-tight">Nível {N.n} · {N.nome}</span>
        <div className="flex flex-col gap-1.5">
          <Bar pct={P.max ? 100 : (P.pts / FUNC_META) * 100} color="#8FD3AE" />
          <span className="text-[11.5px] text-[#B9CFC2]">{P.max ? "Nível máximo — mantenha a constância." : `${P.pts} de ${FUNC_META} sessões para subir de nível`}</span>
        </div>
        <span className="text-[11px] text-[#9DB7A9] leading-relaxed">Ao terminar, diga como foi: “Fácil” ou “Na medida” contam ponto; dois “Difícil” seguidos voltam um nível.</span>
      </Card>

      <SectionLabel action={<span className="font-mono text-[11.5px] text-ink-mute">{marcados}/{total}</span>}>Treino de hoje</SectionLabel>
      {blocos.map((b, i) => {
        const feitos = b.itens.filter((_, j) => feito[b.id + j]).length;
        return (
          <Collapse key={b.id} defaultOpen={b.id === "circ"} title={`${i + 1}. ${b.titulo}`} subtitle={`${b.tempo} · ${feitos}/${b.itens.length} feitos`}>
            <Muted className="text-[11.5px]">{b.dica} Toque no nome para ver como fazer.</Muted>
            <div>
              {b.itens.map(([nome, qtd], j) => (
                <ExerciseRow key={b.id + j} nome={nome} qtd={qtd} done={!!feito[b.id + j]} onToggle={() => setFeito((x) => ({ ...x, [b.id + j]: !x[b.id + j] }))} />
              ))}
            </div>
          </Collapse>
        );
      })}

      <Card className="p-4 flex flex-col gap-3">
        <span className="font-bold text-[14px]">Terminou? Como foi?</span>
        <div className="grid grid-cols-3 gap-2">
          {["Fácil", "Na medida", "Difícil"].map((s) => (
            <button key={s} type="button" onClick={() => concluir(s)} className={cx("py-3 rounded-xl font-bold text-[13px]", s === "Na medida" ? "bg-brand text-white" : "bg-surface-raised dark:bg-surface-raisedDark")}>{s}</button>
          ))}
        </div>
        <Muted className="text-[11px]">Com dor articular, troque saltos por versões lentas e o mountain climber por prancha.</Muted>
      </Card>
    </>
  );
}
