import { ChevronRight, Droplets, Dumbbell, Plus, Scale, Utensils } from "lucide-react";
import { useStore, hojeDe, vistoDe } from "../state/store";
import { useUi } from "../state/ui";
import { aguaMetaL, fmtDec, fmtInt, greeting, isoToDM, metasDoEstado, totals } from "../lib/calc";
import { Bar, Card, Ring, SectionLabel, cx } from "../components/ui";
import { DayNav, SafetyCard } from "../components/shell";

export default function Hoje() {
  const { state, dispatch } = useStore();
  const { openFood, openWeight, openWorkout, go } = useUi();
  const m = metasDoEstado(state);
  const t = totals(state.meals);
  const restante = Math.max(0, m.meta - t.kcal);
  const pct = m.meta > 0 ? (t.kcal / m.meta) * 100 : 0;
  const passou = t.kcal > m.meta;
  const aguaL = state.waterMl / 1000;
  const aguaMeta = aguaMetaL(state);
  const dia = isoToDM(vistoDe(state));
  const treinosDia = state.workouts.filter((w) => w.data === dia);
  const ehHoje = vistoDe(state) === hojeDe(state);
  const ultimo = state.workouts[0];
  const primeiro = state.profile.nome.split(" ")[0];
  const iniciais = state.profile.nome.split(" ").filter(Boolean).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "?";

  const macros = [
    { l: "Proteína", cur: t.proteina, goal: m.proteina, c: "#1E8E5A" },
    { l: "Carboidrato", cur: t.carbo, goal: m.carboidrato, c: "#C2852B" },
    { l: "Gordura", cur: t.gordura, goal: m.gordura, c: "#7A6CC4" },
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[13px] text-ink-mute font-semibold">{greeting()}{primeiro ? "," : ""}</span>
          <span className="font-extrabold text-[24px] tracking-tight leading-tight">{primeiro || "Bem-vindo"}</span>
        </div>
        <button type="button" onClick={() => go("perfil")} className="w-11 h-11 rounded-full bg-brand text-white font-bold text-[14px] flex items-center justify-center">{iniciais}</button>
      </div>

      <DayNav />

      {/* Calorias */}
      <Card className="p-5 flex flex-col gap-5" onClick={() => go("comer", "diario")}>
        <div className="flex items-center gap-5">
          <Ring pct={pct} size={124} stroke={12} color={passou ? "#C2455F" : "#1E8E5A"}>
            <span className="font-mono text-[24px] font-medium leading-none">{fmtInt(passou ? t.kcal - m.meta : restante)}</span>
            <span className="text-[10.5px] text-ink-mute font-semibold mt-1">{passou ? "kcal acima" : "kcal restantes"}</span>
          </Ring>
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <div>
              <div className="text-[11px] text-ink-mute font-semibold">Consumido</div>
              <div className="font-mono text-[17px]">{fmtInt(t.kcal)} <span className="text-[12px] text-ink-mute">kcal</span></div>
            </div>
            <div>
              <div className="text-[11px] text-ink-mute font-semibold">Meta do dia</div>
              <div className="font-mono text-[17px]">{fmtInt(m.meta)} <span className="text-[12px] text-ink-mute">kcal</span></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {macros.map((x) => (
            <div key={x.l} className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-ink-soft">{x.l}</span>
              <Bar pct={x.goal > 0 ? (x.cur / x.goal) * 100 : 0} color={x.c} h={6} />
              <span className="font-mono text-[11px] text-ink-mute">{fmtInt(x.cur)}/{fmtInt(x.goal)} g</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Água + Treino */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-water"><Droplets size={17} /><span className="font-bold text-[12.5px]">Água</span></div>
          <div className="font-mono text-[20px] leading-none">{fmtDec(aguaL)}<span className="text-[12px] text-ink-mute"> / {fmtDec(aguaMeta)} L</span></div>
          <Bar pct={aguaMeta > 0 ? (aguaL / aguaMeta) * 100 : 0} color="#3B82C4" h={6} />
          <button type="button" onClick={() => dispatch({ type: "ADD_WATER", ml: 250 })} className="py-2 rounded-xl bg-[#E6F0FA] dark:bg-[#132433] text-water font-bold text-[12px] flex items-center justify-center gap-1">
            <Plus size={14} /> 1 copo
          </button>
        </Card>
        <Card className="p-4 flex flex-col gap-3" onClick={() => go("treinar")}>
          <div className="flex items-center gap-2 text-brand"><Dumbbell size={17} /><span className="font-bold text-[12.5px]">Treino</span></div>
          {treinosDia.length > 0 ? (
            <>
              <div className="font-mono text-[20px] leading-none">{treinosDia.length}<span className="text-[12px] text-ink-mute"> {treinosDia.length === 1 ? "sessão" : "sessões"}</span></div>
              <span className="text-[11.5px] text-ink-soft truncate">{treinosDia.map((w) => w.modalidade).join(" · ")}</span>
            </>
          ) : (
            <>
              <div className="text-[13px] font-semibold leading-snug">{ehHoje ? "Nada registrado hoje" : "Nada neste dia"}</div>
              <span className="text-[11.5px] text-ink-mute">Toque para ver seus treinos</span>
            </>
          )}
          <button type="button" onClick={(e) => { e.stopPropagation(); openWorkout(); }} className="mt-auto py-2 rounded-xl bg-brand-soft dark:bg-brand-softDark text-brand font-bold text-[12px] flex items-center justify-center gap-1">
            <Plus size={14} /> Registrar
          </button>
        </Card>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-3 gap-3">
        <Quick icon={<Utensils size={18} />} label="Alimento" onClick={() => openFood()} />
        <Quick icon={<Scale size={18} />} label="Peso" onClick={openWeight} />
        <Quick icon={<Droplets size={18} />} label="+500 ml" onClick={() => dispatch({ type: "ADD_WATER", ml: 500 })} />
      </div>

      <SafetyCard compact />

      {/* Refeições do dia */}
      <SectionLabel action={<button type="button" onClick={() => go("comer", "diario")} className="text-[12px] font-bold text-brand flex items-center">Diário <ChevronRight size={14} /></button>}>Refeições</SectionLabel>
      <Card className="divide-y divide-line dark:divide-line-dark">
        {state.meals.map((meal) => {
          const k = totals([meal]).kcal;
          return (
            <button key={meal.id} type="button" onClick={() => openFood(meal.id)} className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-[11px] text-ink-mute w-10">{meal.hora}</span>
                <div className="min-w-0">
                  <div className="font-semibold text-[13px]">{meal.nome}</div>
                  <div className="text-[11px] text-ink-mute truncate">{meal.items.length ? `${meal.items.length} ${meal.items.length === 1 ? "item" : "itens"}` : "Toque para adicionar"}</div>
                </div>
              </div>
              <span className={cx("font-mono text-[12.5px] flex-none", k > 0 ? "" : "text-ink-mute")}>{k > 0 ? `${fmtInt(k)} kcal` : <Plus size={16} />}</span>
            </button>
          );
        })}
      </Card>

      {ultimo && (
        <>
          <SectionLabel>Último treino</SectionLabel>
          <Card tone="dark" className="p-4 flex items-center justify-between gap-3" onClick={() => go("treinar")}>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[11px] font-bold text-[#8FD3AE] tracking-wide uppercase">{ultimo.data} · {ultimo.modalidade}</span>
              <span className="font-bold text-[15px]">{ultimo.duracaoMin} min · {fmtInt(ultimo.kcal)} kcal</span>
              <span className="text-[11.5px] text-[#B9CFC2]">Pré-treino: ~{Math.round(state.profile.peso * 1.5)} g de carboidrato, 1 a 4 h antes.</span>
            </div>
            <ChevronRight size={20} className="text-[#8FD3AE] flex-none" />
          </Card>
        </>
      )}

      <span className="text-[10.5px] text-ink-mute text-center leading-relaxed px-4">
        Ferramenta de acompanhamento e educação nutricional. Não substitui avaliação de médico ou nutricionista.
      </span>
    </>
  );
}

function Quick({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="p-3.5 rounded-2xl bg-surface-card dark:bg-surface-cardDark border border-line dark:border-line-dark flex flex-col items-center gap-1.5 shadow-card">
      <span className="w-9 h-9 rounded-xl bg-brand-soft dark:bg-brand-softDark text-brand flex items-center justify-center">{icon}</span>
      <span className="font-bold text-[12px]">{label}</span>
    </button>
  );
}
