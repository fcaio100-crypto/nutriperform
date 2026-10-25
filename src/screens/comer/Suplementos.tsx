import { useState } from "react";
import { Pill as PillIcon, Trash2 } from "lucide-react";
import { useStore } from "../../state/store";
import { Button, Card, Collapse, Empty, Field, Input, Muted } from "../../components/ui";

export default function Suplementos() {
  const { state, dispatch } = useStore();
  const [f, setF] = useState({ nome: "", dose: "", hora: "", frequencia: "Todos os dias", objetivo: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  function salvar() {
    if (!f.nome.trim()) return;
    dispatch({ type: "ADD_SUPPLEMENT", supplement: { id: Date.now(), ...f, nome: f.nome.trim() } });
    setF({ nome: "", dose: "", hora: "", frequencia: "Todos os dias", objetivo: "" });
  }
  return (
    <>
      {state.supplements.length === 0 && <Empty icon={<PillIcon size={20} />} title="Nenhum suplemento" text="Cadastre o que você usa para não esquecer horário e dose." />}
      {state.supplements.map((s) => (
        <Card key={s.id} className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-brand-soft dark:bg-brand-softDark text-brand flex items-center justify-center flex-none"><PillIcon size={18} /></span>
            <div className="min-w-0">
              <div className="font-bold text-[13.5px]">{s.nome} <span className="font-mono font-medium text-ink-mute text-[12px]">{s.dose}</span></div>
              <div className="text-[11.5px] text-ink-mute">{[s.hora, s.frequencia, s.objetivo].filter(Boolean).join(" · ")}</div>
            </div>
          </div>
          <button type="button" aria-label="Remover" onClick={() => dispatch({ type: "REMOVE_SUPPLEMENT", id: s.id })} className="text-ink-mute hover:text-danger flex-none"><Trash2 size={16} /></button>
        </Card>
      ))}
      <Collapse title="Adicionar suplemento">
        <Field label="Nome"><Input value={f.nome} onChange={set("nome")} placeholder="Ex.: Creatina" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dose"><Input value={f.dose} onChange={set("dose")} placeholder="5 g" /></Field>
          <Field label="Horário"><Input value={f.hora} onChange={set("hora")} placeholder="Pós-treino" /></Field>
          <Field label="Frequência"><Input value={f.frequencia} onChange={set("frequencia")} /></Field>
          <Field label="Objetivo"><Input value={f.objetivo} onChange={set("objetivo")} placeholder="Força" /></Field>
        </div>
        <Button onClick={salvar} disabled={!f.nome.trim()}>Salvar suplemento</Button>
      </Collapse>
      <Muted className="text-[11px] text-center">Registro pessoal. Dose e indicação devem ser definidas com médico ou nutricionista.</Muted>
    </>
  );
}
