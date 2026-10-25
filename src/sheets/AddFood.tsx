import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useStore } from "../state/store";
import { useUi } from "../state/ui";
import { FOOD_CATEGORIES, foodById, searchFoods } from "../data/foods";
import { fmtDec, fmtInt } from "../lib/calc";
import { Button, Chips, Input, Sheet, cx } from "../components/ui";

export default function AddFood() {
  const { state, dispatch } = useStore();
  const { close, foodMealId, notify } = useUi();
  const [meal, setMeal] = useState(foodMealId ?? state.meals[0]?.id);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("");
  const [sel, setSel] = useState<string | null>(null);
  const [g, setG] = useState(100);
  const lista = useMemo(() => searchFoods(q, cat || undefined), [q, cat]);
  const f = sel ? foodById(sel) : null;
  const k = g / 100;

  function escolher(id: string) {
    setSel(id);
    const food = foodById(id);
    setG(food.porcao ? food.porcao[0] : 100);
  }
  function adicionar() {
    if (!f || !meal) return;
    dispatch({ type: "ADD_MEAL_ITEM", mealId: meal, foodId: f.id, qtdGramas: g || 100 });
    notify(`${f.nome} adicionado`);
    close();
  }

  return (
    <Sheet
      title="Adicionar alimento"
      onClose={close}
      footer={
        f ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold text-[13.5px] truncate">{f.nome}</div>
                <div className="font-mono text-[11.5px] text-ink-mute">
                  {fmtInt(f.kcal * k)} kcal · P {fmtDec(f.proteina * k)} · C {fmtDec(f.carbo * k)} · G {fmtDec(f.gordura * k)}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-none">
                <Input inputMode="numeric" value={g} onChange={(e) => setG(Number(e.target.value.replace(/\D/g, "")) || 0)} className="w-20 text-center font-mono" />
                <span className="text-[12px] text-ink-mute">g</span>
              </div>
            </div>
            {f.porcao && (
              <div className="flex gap-1.5 flex-wrap items-center">
                <span className="text-[11px] text-ink-mute font-semibold mr-1">1 = {f.porcao[1]}</span>
                {[0.5, 1, 2, 3].map((x) => {
                  const v = Math.round(f.porcao![0] * x);
                  return (
                    <button key={x} type="button" onClick={() => setG(v)} className={cx("px-3 py-1.5 rounded-lg text-[11.5px] font-bold", g === v ? "bg-brand text-white" : "bg-surface-raised dark:bg-surface-raisedDark text-ink-soft")}>
                      {x === 0.5 ? "½" : x}×
                    </button>
                  );
                })}
              </div>
            )}
            <Button size="lg" onClick={adicionar}>Adicionar</Button>
          </div>
        ) : undefined
      }
    >
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-5 px-5">
        {state.meals.map((m) => (
          <button key={m.id} type="button" onClick={() => setMeal(m.id)} className={cx("px-3 py-2 rounded-xl font-semibold text-[12px] whitespace-nowrap flex-none", meal === m.id ? "bg-ink text-white dark:bg-white dark:text-ink" : "bg-surface-raised dark:bg-surface-raisedDark text-ink-soft")}>
            {m.nome}
          </button>
        ))}
      </div>
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
        <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar: pão de queijo, mamão…" className="pl-10" />
      </div>
      <Chips small value={cat} onChange={setCat} options={[{ v: "", label: "Todos" }, ...FOOD_CATEGORIES.map((c) => ({ v: c, label: c }))]} />
      <div className="flex flex-col">
        {lista.length === 0 && <span className="text-[12.5px] text-ink-mute py-4 text-center">Nada encontrado. Tente outro nome.</span>}
        {lista.map((it) => (
          <button key={it.id} type="button" onClick={() => escolher(it.id)} className={cx("text-left px-3 py-3 rounded-xl flex items-center justify-between gap-3", sel === it.id ? "bg-brand-soft dark:bg-brand-softDark" : "")}>
            <div className="min-w-0">
              <div className="font-semibold text-[13px]">{it.nome}</div>
              <div className="text-[11px] text-ink-mute">{it.porcao ? `${it.porcao[1]} ≈ ${it.porcao[0]} g` : "100 g"}</div>
            </div>
            <span className="font-mono text-[11.5px] text-ink-mute flex-none">{it.kcal} kcal/100g</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
