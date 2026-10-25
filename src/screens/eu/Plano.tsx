import { useMemo, useState } from "react";
import { Printer, Sparkles, Trash2 } from "lucide-react";
import { useStore } from "../../state/store";
import { useUi } from "../../state/ui";
import { LISTA_COMPRAS, TIPOS_DIA, ajusteTipoDia, carboTipoDia, fmtInt, gerarPlano, metasDoEstado } from "../../lib/calc";
import type { PlanMeal } from "../../lib/types";
import { Button, Card, Chips, Collapse, Field, Input, Muted, SectionLabel, cx } from "../../components/ui";
import { printDoc } from "../../lib/print";

export default function Plano() {
  const { state, dispatch } = useStore();
  const { openDieta, notify } = useUi();
  const m = metasDoEstado(state);
  const meta = Math.round(m.meta + ajusteTipoDia(state.dayType));
  const sugerido = useMemo(() => gerarPlano(meta), [meta]);
  const proprio = state.planoPersonalizadoAtivo;
  const lista = proprio ? [...state.planoPersonalizado].sort((a, b) => a.hora.localeCompare(b.hora)) : sugerido;
  const totalLista = lista.reduce((s, x) => s + (x.kcal || 0), 0);

  function registrar(r: PlanMeal) {
    if (!r.itens?.length) return;
    const alvo = state.meals.find((x) => x.nome.toLowerCase().includes(r.nome.toLowerCase()) || r.nome.toLowerCase().includes(x.nome.toLowerCase()));
    dispatch({ type: "ADD_MEAL_ITEMS_BULK", mealId: alvo?.id ?? state.meals[0].id, itens: r.itens });
    notify(`${r.nome} registrado no diário`);
  }

  function imprimir() {
    const html = lista
      .map((r) => `<h2>${r.hora} · ${r.nome}${r.kcal ? ` — ${fmtInt(r.kcal)} kcal` : ""}</h2>${r.descricao ? `<div class="desc">${r.descricao}</div>` : ""}${r.substituicao ? `<div class="sub-box"><b>Substituição:</b> ${r.substituicao}</div>` : ""}`)
      .join("");
    printDoc(`Plano alimentar — ${state.profile.nome || "NutriPerform"}`, html);
  }

  return (
    <>
      <Card tone="dark" className="p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[#8FD3AE]"><Sparkles size={16} /><span className="font-bold text-[11px] tracking-wide uppercase">Montado para você</span></div>
        <span className="font-bold text-[17px] leading-snug">Gere um cardápio com as calorias certas para chegar a {state.profile.pesoDesejado} kg</span>
        <Button onClick={openDieta} className="self-start bg-white !text-ink hover:bg-white">Montar meu plano</Button>
      </Card>

      <Card className="p-4 flex flex-col gap-3">
        <Field label="De onde vem o seu plano">
          <Chips value={proprio ? "p" : "a"} onChange={(v) => dispatch({ type: "SET_PLANO_PERSONALIZADO_ATIVO", ativo: v === "p" })} options={[{ v: "a", label: "Sugestão do app" }, { v: "p", label: "Meu plano / nutricionista" }]} />
        </Field>
        {!proprio && (
          <Field label="Como é o seu dia hoje?">
            <Chips value={state.dayType} onChange={(v) => dispatch({ type: "SET_DAY_TYPE", dayType: v })} options={TIPOS_DIA.map((t) => ({ v: t, label: t }))} />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-surface-raised dark:bg-surface-raisedDark">
            <div className="text-[11px] text-ink-mute font-semibold">{proprio ? "Total do plano" : "Energia do dia"}</div>
            <div className="font-mono text-[16px]">{fmtInt(proprio ? totalLista : meta)} kcal</div>
          </div>
          <div className="p-3 rounded-xl bg-surface-raised dark:bg-surface-raisedDark">
            <div className="text-[11px] text-ink-mute font-semibold">{proprio ? "Sua meta" : "Carboidrato"}</div>
            <div className="font-mono text-[16px]">{proprio ? `${fmtInt(m.meta)} kcal` : `${carboTipoDia(state.dayType, state.profile.peso)} g`}</div>
          </div>
        </div>
      </Card>

      <SectionLabel action={<button type="button" onClick={imprimir} className="text-[12px] font-bold text-brand flex items-center gap-1"><Printer size={14} /> Imprimir</button>}>
        {proprio ? "Meu plano" : "Cardápio sugerido"}
      </SectionLabel>

      {lista.length === 0 && <Muted className="text-[12.5px] text-center py-3">Nenhuma refeição cadastrada. Adicione abaixo o plano do seu nutricionista.</Muted>}
      {lista.map((r) => (
        <Card key={r.id} className="p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[11px] text-ink-mute">{r.hora}</span>
              <span className="font-bold text-[14px]">{r.nome}</span>
            </div>
            <div className="flex items-center gap-2">
              {r.kcal > 0 && <span className="font-mono text-[12.5px]">{fmtInt(r.kcal)} kcal</span>}
              {proprio && (
                <button type="button" aria-label="Remover" onClick={() => dispatch({ type: "REMOVE_REFEICAO_PERSONALIZADA", id: r.id })} className="text-ink-mute hover:text-danger"><Trash2 size={15} /></button>
              )}
            </div>
          </div>
          {r.descricao && <span className="text-[12.5px] leading-relaxed">{r.descricao}</span>}
          {r.substituicao && <span className="text-[11.5px] text-ink-soft px-3 py-2 rounded-lg bg-surface-raised dark:bg-surface-raisedDark"><b>Troca:</b> {r.substituicao}</span>}
          {r.itens && r.itens.length > 0 && (
            <button type="button" onClick={() => registrar(r)} className="self-start text-[12px] font-bold text-brand">+ Registrar no diário</button>
          )}
        </Card>
      ))}

      {proprio && <NovaRefeicao />}

      <ListaCompras />
    </>
  );
}

function NovaRefeicao() {
  const { dispatch } = useStore();
  const [hora, setHora] = useState("12:00");
  const [nome, setNome] = useState("");
  const [desc, setDesc] = useState("");
  const [kcal, setKcal] = useState("");
  const [sub, setSub] = useState("");
  function add() {
    if (!nome.trim()) return;
    dispatch({ type: "ADD_REFEICAO_PERSONALIZADA", refeicao: { id: Date.now(), hora, nome: nome.trim(), descricao: desc.trim(), kcal: Number(kcal) || 0, substituicao: sub.trim() } });
    setNome(""); setDesc(""); setKcal(""); setSub("");
  }
  return (
    <Collapse title="Adicionar refeição ao meu plano" subtitle="Copie aqui o que o seu nutricionista passou">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Horário"><Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} /></Field>
        <Field label="kcal (opcional)"><Input inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} /></Field>
      </div>
      <Field label="Nome"><Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Café da manhã" /></Field>
      <Field label="Alimentos e quantidades"><Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex.: 2 ovos + 1 pão + café" /></Field>
      <Field label="Substituição (opcional)"><Input value={sub} onChange={(e) => setSub(e.target.value)} /></Field>
      <Button onClick={add} disabled={!nome.trim()}>Adicionar refeição</Button>
    </Collapse>
  );
}

function ListaCompras() {
  const { state, dispatch } = useStore();
  const total = LISTA_COMPRAS.reduce((s, g) => s + g.items.length, 0);
  const marcados = LISTA_COMPRAS.reduce((s, g) => s + g.items.filter((it) => state.shoppingChecks[`${g.id}-${it}`]).length, 0);
  return (
    <Collapse title="Lista de compras da semana" subtitle={`${marcados} de ${total} itens no carrinho`}>
      {LISTA_COMPRAS.map((g) => (
        <div key={g.id} className="flex flex-col gap-1">
          <span className="text-[11px] font-bold text-ink-mute uppercase tracking-wide">{g.l}</span>
          {g.items.map((it) => {
            const k = `${g.id}-${it}`;
            const on = !!state.shoppingChecks[k];
            return (
              <button key={k} type="button" onClick={() => dispatch({ type: "TOGGLE_SHOPPING_ITEM", key: k })} className="flex items-center gap-2.5 py-1.5 text-left">
                <span className={cx("w-5 h-5 rounded-md border-2 flex items-center justify-center text-[11px] text-white flex-none", on ? "bg-brand border-brand" : "border-[#C5D1CA]")}>{on ? "✓" : ""}</span>
                <span className={cx("text-[13px]", on && "line-through text-ink-mute")}>{it}</span>
              </button>
            );
          })}
        </div>
      ))}
    </Collapse>
  );
}
