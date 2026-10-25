import { useState } from "react";
import { Printer, Trash2, X } from "lucide-react";
import { useStore } from "../../state/store";
import { treinoSugerido } from "../../data/exercises";
import { Button, Card, Chips, Collapse, Field, Input, Muted, SectionLabel } from "../../components/ui";
import { printDoc } from "../../lib/print";

export default function Musculacao() {
  const { state, dispatch } = useStore();
  const p = state.profile;
  const proprio = state.treinoPersonalizadoAtivo;
  const sugerido = treinoSugerido(p.objetivo, p.diasTreinoSemana, p.minutosPorTreino);

  function imprimir() {
    const dias = proprio ? state.treinoPersonalizado : sugerido;
    const html = dias
      .map((d) => `<h2>${d.dia}</h2>${d.foco ? `<div class="foco">${d.foco}</div>` : ""}<table>${d.exercicios.map((e) => `<tr><td>${e.nome}</td><td class="qtd">${e.series}x${e.repeticoes}</td></tr>`).join("")}</table>`)
      .join("");
    printDoc(`Rotina de treino — ${p.nome || "NutriPerform"}`, html);
  }

  return (
    <>
      <Card className="p-4 flex flex-col gap-3">
        <Field label="De onde vem a sua rotina">
          <Chips value={proprio ? "p" : "a"} onChange={(v) => dispatch({ type: "SET_TREINO_PERSONALIZADO_ATIVO", ativo: v === "p" })} options={[{ v: "a", label: "Sugestão do app" }, { v: "p", label: "Meu personal" }]} />
        </Field>
        {!proprio && (
          <>
            <Field label="Dias por semana">
              <Chips small value={p.diasTreinoSemana} onChange={(v) => dispatch({ type: "UPDATE_PROFILE", patch: { diasTreinoSemana: v } })} options={[1, 2, 3, 4, 5, 6].map((n) => ({ v: n, label: String(n) }))} />
            </Field>
            <Field label="Minutos por sessão">
              <Chips small value={p.minutosPorTreino} onChange={(v) => dispatch({ type: "UPDATE_PROFILE", patch: { minutosPorTreino: v } })} options={[30, 45, 60, 75, 90, 120].map((n) => ({ v: n, label: String(n) }))} />
            </Field>
          </>
        )}
      </Card>

      <SectionLabel action={<button type="button" onClick={imprimir} className="text-[12px] font-bold text-brand flex items-center gap-1"><Printer size={14} /> Imprimir</button>}>
        {proprio ? "Rotina do meu personal" : `Divisão sugerida · ${p.objetivo}`}
      </SectionLabel>

      {proprio ? <RotinaPropria /> : sugerido.map((d, i) => (
        <Collapse key={i} title={`${d.dia} · ${d.foco}`} subtitle={`${d.exercicios.length} exercícios`} defaultOpen={i === 0}>
          {d.exercicios.map((e, j) => (
            <div key={j} className="flex justify-between gap-3 py-1.5 border-b last:border-0 border-line dark:border-line-dark">
              <span className="text-[13px] font-medium">{e.nome}</span>
              <span className="font-mono text-[12px] text-ink-mute flex-none">{e.series}×{e.repeticoes}</span>
            </div>
          ))}
        </Collapse>
      ))}
      {!proprio && <Muted className="text-[11px]">Sugestão de referência. Não substitui a orientação de um profissional de educação física.</Muted>}
    </>
  );
}

function RotinaPropria() {
  const { state, dispatch } = useStore();
  const [dia, setDia] = useState("");
  const [foco, setFoco] = useState("");
  const [novo, setNovo] = useState<Record<number, { nome: string; series: string; reps: string }>>({});
  const get = (id: number) => novo[id] ?? { nome: "", series: "3", reps: "10-12" };
  const set = (id: number, patch: Partial<{ nome: string; series: string; reps: string }>) => setNovo((x) => ({ ...x, [id]: { ...get(id), ...patch } }));

  return (
    <>
      {state.treinoPersonalizado.length === 0 && <Muted className="text-[12.5px] text-center py-2">Nenhum dia cadastrado. Adicione abaixo o que o seu personal passou.</Muted>}
      {state.treinoPersonalizado.map((d) => {
        const n = get(d.id);
        return (
          <Card key={d.id} className="p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-[14px]">{d.dia}</div>
                {d.foco && <div className="text-[11.5px] text-ink-mute">{d.foco}</div>}
              </div>
              <button type="button" aria-label="Remover dia" onClick={() => dispatch({ type: "REMOVE_DIA_TREINO_PERSONALIZADO", id: d.id })} className="text-ink-mute hover:text-danger"><Trash2 size={15} /></button>
            </div>
            {d.exercicios.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-line dark:border-line-dark">
                <span className="text-[13px]">{e.nome}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[12px] text-ink-mute">{e.series}×{e.repeticoes}</span>
                  <button type="button" aria-label="Remover exercício" onClick={() => dispatch({ type: "REMOVE_EXERCICIO_PERSONALIZADO", diaId: d.id, exercicioId: e.id })} className="text-ink-mute"><X size={14} /></button>
                </div>
              </div>
            ))}
            <div className="flex gap-2 items-center pt-1">
              <Input value={n.nome} onChange={(e) => set(d.id, { nome: e.target.value })} placeholder="Exercício" className="flex-1 min-w-0 py-2.5" />
              <Input value={n.series} onChange={(e) => set(d.id, { series: e.target.value.replace(/\D/g, "") })} className="w-12 text-center py-2.5" aria-label="Séries" />
              <Input value={n.reps} onChange={(e) => set(d.id, { reps: e.target.value })} className="w-16 text-center py-2.5" aria-label="Repetições" />
              <Button size="sm" onClick={() => {
                if (!n.nome.trim()) return;
                dispatch({ type: "ADD_EXERCICIO_PERSONALIZADO", diaId: d.id, exercicio: { id: Date.now(), nome: n.nome.trim(), series: Number(n.series) || 3, repeticoes: n.reps.trim() || "10-12" } });
                setNovo((x) => ({ ...x, [d.id]: { nome: "", series: n.series, reps: n.reps } }));
              }}>+</Button>
            </div>
          </Card>
        );
      })}
      <Collapse title="Adicionar dia de treino" defaultOpen={state.treinoPersonalizado.length === 0}>
        <Field label="Nome do dia"><Input value={dia} onChange={(e) => setDia(e.target.value)} placeholder="Ex.: Treino A — Segunda" /></Field>
        <Field label="Foco (opcional)"><Input value={foco} onChange={(e) => setFoco(e.target.value)} placeholder="Ex.: Peito e tríceps" /></Field>
        <Button disabled={!dia.trim()} onClick={() => { dispatch({ type: "ADD_DIA_TREINO_PERSONALIZADO", dia: { id: Date.now(), dia: dia.trim(), foco: foco.trim(), exercicios: [] } }); setDia(""); setFoco(""); }}>Adicionar dia</Button>
      </Collapse>
    </>
  );
}
