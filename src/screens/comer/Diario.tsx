import { CheckCircle2, Plus, X } from "lucide-react";
import { useStore } from "../../state/store";
import { useUi } from "../../state/ui";
import { fmtInt, itemMacros, metasDoEstado, totals } from "../../lib/calc";
import { Bar, Button, Card, Muted } from "../../components/ui";
import { DayNav } from "../../components/shell";

export default function Diario() {
  const { state, dispatch } = useStore();
  const { openFood, setSub } = useUi();
  const m = metasDoEstado(state);
  const t = totals(state.meals);
  const fonte = state.planoPersonalizadoAtivo ? "o seu plano" : "a sugestão do app";

  return (
    <>
      <DayNav />
      <Card className="p-4 flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[22px]">{fmtInt(t.kcal)}<span className="text-[12px] text-ink-mute"> / {fmtInt(m.meta)} kcal</span></span>
          <Muted className="text-[12px] font-semibold">{fmtInt(Math.max(0, m.meta - t.kcal))} restantes</Muted>
        </div>
        <Bar pct={m.meta > 0 ? (t.kcal / m.meta) * 100 : 0} color={t.kcal > m.meta ? "#C2455F" : "#1E8E5A"} />
        <div className="flex justify-between font-mono text-[11.5px] text-ink-soft">
          <span>P {fmtInt(t.proteina)}/{fmtInt(m.proteina)} g</span>
          <span>C {fmtInt(t.carbo)}/{fmtInt(m.carboidrato)} g</span>
          <span>G {fmtInt(t.gordura)}/{fmtInt(m.gordura)} g</span>
        </div>
      </Card>

      {state.planoSeguidoHoje ? (
        <Card tone="soft" className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={20} className="text-brand flex-none" />
            <span className="text-[12.5px] font-semibold">Hoje você segue {fonte}.</span>
          </div>
          <button type="button" onClick={() => dispatch({ type: "SET_PLANO_SEGUIDO_HOJE", seguido: false })} className="text-[12px] font-bold text-brand">Desfazer</button>
        </Card>
      ) : (
        <div className="p-3.5 rounded-2xl border-2 border-dashed border-line dark:border-line-dark flex items-center justify-between gap-3">
          <button type="button" onClick={() => dispatch({ type: "SET_PLANO_SEGUIDO_HOJE", seguido: true })} className="text-left text-[12.5px] font-medium text-ink-soft">
            Vai seguir {fonte} hoje? <b className="text-brand">Marcar</b>
          </button>
          <button type="button" onClick={() => setSub("comer", "plano")} className="text-[12px] font-bold text-ink-mute flex-none">Ver plano</button>
        </div>
      )}

      {state.meals.map((meal) => {
        const mt = totals([meal]);
        return (
          <Card key={meal.id} className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-[14px]">{meal.nome}</span>
                <span className="font-mono text-[11px] text-ink-mute">{meal.hora}</span>
              </div>
              <span className="font-mono text-[12.5px]">{fmtInt(mt.kcal)} kcal</span>
            </div>
            {meal.items.map((it) => {
              const x = itemMacros(it);
              return (
                <div key={it.id} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-surface-raised dark:bg-surface-raisedDark">
                  <div className="min-w-0">
                    <div className="font-semibold text-[12.5px] truncate">{x.nome} · {it.qtdGramas} g</div>
                    <div className="font-mono text-[10.5px] text-ink-mute">{fmtInt(x.kcal)} kcal · P {fmtInt(x.proteina)} · C {fmtInt(x.carbo)} · G {fmtInt(x.gordura)}</div>
                  </div>
                  <button type="button" aria-label="Remover" onClick={() => dispatch({ type: "REMOVE_MEAL_ITEM", mealId: meal.id, itemId: it.id })} className="w-7 h-7 rounded-full flex items-center justify-center text-ink-mute hover:text-danger flex-none">
                    <X size={15} />
                  </button>
                </div>
              );
            })}
            <button type="button" onClick={() => openFood(meal.id)} className="self-start flex items-center gap-1 text-[12.5px] font-bold text-brand py-1">
              <Plus size={15} /> Adicionar
            </button>
          </Card>
        );
      })}

      <Button size="lg" onClick={() => openFood()}><Plus size={18} /> Adicionar alimento</Button>
      <Muted className="text-[11px] text-center">85 alimentos com medidas caseiras (TACO/USDA). Faltou algum? Ele entra na próxima atualização.</Muted>
    </>
  );
}
