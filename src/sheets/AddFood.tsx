import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { useStore } from "../state/store";
import { useUi } from "../state/ui";
import { foodById, searchFoods } from "../data/foods";
import { fmtInt, itemMacros, totals } from "../lib/calc";
import type { Food } from "../lib/types";
import { Button, Input, Sheet, cx } from "../components/ui";

const COMUNS = ["pao", "ovo", "cuscuz", "tapioca", "arroz", "feijao", "frango", "carne", "banana", "mamao_papaia", "tangerina", "pao_queijo", "cafe", "leite", "iogurte", "whey"];

export default function AddFood() {
  const { state, dispatch } = useStore();
  const { close, foodMealId, notify } = useUi();
  const [mealId, setMealId] = useState(foodMealId ?? state.meals[0]?.id);
  const [q, setQ] = useState("");
  const meal = state.meals.find((m) => m.id === mealId) ?? state.meals[0];

  // alimentos já usados (última quantidade usada de cada um)
  const recentes = useMemo(() => {
    const ult = new Map<string, number>();
    const todos = [...Object.values(state.dias ?? {}).flatMap((d) => d.meals), ...state.meals];
    for (const m of todos) for (const it of m.items) ult.set(it.foodId, it.qtdGramas);
    return [...ult.entries()].reverse().slice(0, 8).map(([id, g]) => ({ food: foodById(id), g }));
  }, [state.dias, state.meals]);

  const busca = useMemo(() => (q.trim() ? searchFoods(q).slice(0, 30) : []), [q]);
  const comuns = COMUNS.map(foodById).filter((f) => !recentes.some((r) => r.food.id === f.id));

  function add(f: Food, g: number) {
    dispatch({ type: "ADD_MEAL_ITEM", mealId: meal.id, foodId: f.id, qtdGramas: g });
    notify(`+ ${f.nome} (${g} g)`);
  }

  const t = totals([meal]);

  return (
    <Sheet title="Adicionar comida" onClose={close} footer={<Button size="lg" onClick={close}>Pronto</Button>}>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-5 px-5">
        {state.meals.map((m) => (
          <button key={m.id} type="button" onClick={() => setMealId(m.id)} className={cx("px-3 py-2 rounded-xl font-semibold text-[12px] whitespace-nowrap flex-none", meal.id === m.id ? "bg-ink text-white dark:bg-white dark:text-ink" : "bg-surface-raised dark:bg-surface-raisedDark text-ink-soft")}>
            {m.nome}
          </button>
        ))}
      </div>

      {meal.items.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[11.5px] font-bold text-ink-mute uppercase tracking-wide">
            <span>Nesta refeição</span><span className="font-mono normal-case">{fmtInt(t.kcal)} kcal</span>
          </div>
          {meal.items.map((it) => {
            const x = itemMacros(it);
            return (
              <div key={it.id} className="flex items-center justify-between gap-2 pl-3 pr-1 py-1.5 rounded-xl bg-brand-soft dark:bg-brand-softDark">
                <span className="text-[12.5px] font-semibold truncate">{x.nome} · {it.qtdGramas} g</span>
                <div className="flex items-center gap-1 flex-none">
                  <span className="font-mono text-[11.5px]">{fmtInt(x.kcal)} kcal</span>
                  <button type="button" aria-label="Remover" onClick={() => dispatch({ type: "REMOVE_MEAL_ITEM", mealId: meal.id, itemId: it.id })} className="w-8 h-8 flex items-center justify-center text-ink-mute"><X size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar alimento (ex.: pão de queijo)" className="pl-10" />
      </div>

      {q.trim() ? (
        <Lista titulo="Resultados" vazio="Nada encontrado. Tente outro nome." itens={busca.map((f) => ({ food: f }))} onAdd={add} />
      ) : (
        <>
          {recentes.length > 0 && <Lista titulo="Você costuma comer" itens={recentes} onAdd={add} />}
          <Lista titulo="Comuns" itens={comuns.map((f) => ({ food: f }))} onAdd={add} />
        </>
      )}
      <span className="text-[11px] text-ink-mute text-center">Toque no <b>+</b> para adicionar 1 porção. Toque no nome para escolher a quantidade.</span>
    </Sheet>
  );
}

function Lista({ titulo, itens, onAdd, vazio }: { titulo: string; itens: { food: Food; g?: number }[]; onAdd: (f: Food, g: number) => void; vazio?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11.5px] font-bold text-ink-mute uppercase tracking-wide mb-1">{titulo}</span>
      {itens.length === 0 && vazio && <span className="text-[12.5px] text-ink-mute py-3 text-center">{vazio}</span>}
      {itens.map(({ food, g }) => <Linha key={food.id} food={food} g={g} onAdd={onAdd} />)}
    </div>
  );
}

function Linha({ food, g, onAdd }: { food: Food; g?: number; onAdd: (f: Food, g: number) => void }) {
  const [aberto, setAberto] = useState(false);
  const [gramas, setGramas] = useState("");
  const porcao = g ?? food.porcao?.[0] ?? 100;
  const rotulo = g ? `${g} g (última vez)` : food.porcao ? `${food.porcao[1]} · ${food.porcao[0]} g` : "100 g";
  return (
    <div className="border-b last:border-0 border-line dark:border-line-dark">
      <div className="flex items-center gap-3 py-2.5">
        <button type="button" onClick={() => setAberto(!aberto)} className="flex-1 min-w-0 text-left">
          <div className="font-semibold text-[13.5px] truncate">{food.nome}</div>
          <div className="text-[11.5px] text-ink-mute">{rotulo} · {fmtInt((food.kcal * porcao) / 100)} kcal</div>
        </button>
        <button type="button" aria-label={`Adicionar ${food.nome}`} onClick={() => onAdd(food, porcao)} className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center flex-none active:scale-95 transition-transform">
          <Plus size={20} />
        </button>
      </div>
      {aberto && (
        <div className="pb-3 flex flex-col gap-2 anim-fade">
          {food.porcao && (
            <div className="flex gap-1.5 flex-wrap items-center">
              <span className="text-[11px] text-ink-mute font-semibold mr-1">Porção = {food.porcao[1]}</span>
              {[0.5, 1, 2, 3].map((x) => (
                <button key={x} type="button" onClick={() => { onAdd(food, Math.round(food.porcao![0] * x)); setAberto(false); }} className="px-3.5 py-2 rounded-lg bg-surface-raised dark:bg-surface-raisedDark text-[12.5px] font-bold">
                  {x === 0.5 ? "½" : x}×
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input inputMode="numeric" value={gramas} onChange={(e) => setGramas(e.target.value.replace(/\D/g, ""))} placeholder="Outra quantidade (g)" />
            <Button variant="secondary" onClick={() => { const v = Number(gramas); if (v) { onAdd(food, v); setAberto(false); setGramas(""); } }}>Adicionar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
