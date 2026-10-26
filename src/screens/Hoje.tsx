import { useState } from "react";
import { Check, ChevronRight, Droplets, Dumbbell, Minus, Moon, Plus, Sparkles, Utensils } from "lucide-react";
import { useStore, hojeDe, vistoDe } from "../state/store";
import { useUi } from "../state/ui";
import { addDays, aguaMetaL, fmtDec, fmtInt, greeting, isoToDM, metasDoEstado, parseISO, totals } from "../lib/calc";
import { resumoTreino, treinoPlanejado, treinosDaData } from "../lib/plan";
import { FUNC_MOD, OPCOES_TREINO } from "../data/exercises";
import { foodById } from "../data/foods";
import { Bar, Button, Card, Chips, cx } from "../components/ui";
import { DayNav, SafetyCard } from "../components/shell";
import { LogoMark } from "../components/Logo";

const PRINCIPAIS = ["cafe", "almoco", "lt", "jantar"];

export default function Hoje() {
  const { state } = useStore();
  const nome = state.profile.nome.split(" ")[0];
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[13px] text-ink-mute font-semibold">{greeting()}{nome ? `, ${nome}` : ""}</span>
          <h1 className="font-extrabold text-[26px] tracking-tight leading-tight">Seu dia</h1>
        </div>
        <LogoMark size={40} />
      </div>
      <DayNav />
      <TreinoCard />
      <ComidaCard />
      <AguaCard />
      <AssistenteAtalho />
      <Semana />
      <SafetyCard compact />
    </>
  );
}

function TreinoCard() {
  const { state, dispatch } = useStore();
  const { openTreino, openWorkout, go } = useUi();
  const [trocar, setTrocar] = useState(false);
  const iso = vistoDe(state);
  const ehHoje = iso === hojeDe(state);
  const plano = treinoPlanejado(state, iso);
  const feitos = treinosDaData(state, iso);
  const feitoPlano = feitos.find((w) => w.modalidade === plano);
  const outros = feitos.filter((w) => w !== feitoPlano);
  const mobFeita = feitos.some((w) => w.modalidade === "Mobilidade");
  const mostrarMob = plano !== "Mobilidade" && plano !== FUNC_MOD;

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-brand font-bold text-[12px] tracking-wide uppercase"><Dumbbell size={16} /> Treino {ehHoje ? "de hoje" : "do dia"}</span>
        <button type="button" onClick={() => setTrocar(!trocar)} className="text-[12.5px] font-bold text-ink-mute">{trocar ? "Cancelar" : "Trocar"}</button>
      </div>

      {trocar ? (
        <div className="flex flex-col gap-3 anim-fade">
          <span className="text-[13px] font-semibold">O que você vai fazer {ehHoje ? "hoje" : "neste dia"}?</span>
          <Chips value={plano} onChange={(v) => { dispatch({ type: "SET_TREINO_DO_DIA", date: iso, mod: v }); setTrocar(false); }} options={OPCOES_TREINO.map((m) => ({ v: m, label: m }))} />
          <button type="button" onClick={() => go("eu", "semana")} className="self-start text-[12.5px] font-bold text-brand">Editar minha semana de treino →</button>
        </div>
      ) : feitoPlano ? (
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center flex-none"><Check size={24} strokeWidth={3} /></span>
          <div className="min-w-0">
            <div className="font-extrabold text-[18px] leading-tight">{plano} feito!</div>
            <div className="text-[12.5px] text-ink-mute">{feitoPlano.duracaoMin} min{feitoPlano.sensacao ? ` · ${feitoPlano.sensacao}` : ""}{feitoPlano.nivel ? ` · nível ${feitoPlano.nivel}` : ""}</div>
          </div>
        </div>
      ) : plano === "Descanso" ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-surface-raised dark:bg-surface-raisedDark text-ink-soft flex items-center justify-center flex-none"><Moon size={22} /></span>
            <div>
              <div className="font-extrabold text-[18px] leading-tight">Dia de descanso</div>
              <div className="text-[12.5px] text-ink-mute">Recuperar também faz parte do treino.</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          <div>
            <div className="font-extrabold text-[22px] leading-tight">{plano}</div>
            <div className="text-[13px] text-ink-mute mt-0.5">{resumoTreino(state, plano)}</div>
          </div>
          <Button size="lg" onClick={() => openTreino(plano, iso)}>Começar treino</Button>
        </div>
      )}

      {!trocar && (outros.length > 0 || mostrarMob) && (
        <div className="flex flex-col border-t border-line dark:border-line-dark pt-1">
          {outros.map((w) => (
            <div key={w.id} className="flex items-center justify-between py-2.5">
              <span className="flex items-center gap-2 text-[13px] font-semibold"><Check size={16} className="text-brand" /> {w.modalidade}</span>
              <span className="font-mono text-[12px] text-ink-mute">{w.duracaoMin} min</span>
            </div>
          ))}
          {mostrarMob && !mobFeita && (
            <button type="button" onClick={() => openTreino("Mobilidade", iso)} className="flex items-center justify-between py-2.5 text-left">
              <span className="flex items-center gap-2 text-[13px] font-semibold">
                <span className="w-4 h-4 rounded-full border-2 border-[#C5D1CA] dark:border-[#3A4A41]" /> Mobilidade · 10 min
              </span>
              <ChevronRight size={17} className="text-ink-mute" />
            </button>
          )}
        </div>
      )}

      {!trocar && (
        <button type="button" onClick={() => openWorkout()} className="self-start text-[12.5px] font-bold text-ink-mute">+ Registrar outra atividade</button>
      )}
    </Card>
  );
}

function refeicaoAgora(meals: { id: string; hora: string }[]) {
  const d = new Date();
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const passadas = meals.filter((m) => m.hora <= hm);
  return (passadas[passadas.length - 1] ?? meals[0])?.id;
}

function ComidaCard() {
  const { state } = useStore();
  const { openFood } = useUi();
  const [todas, setTodas] = useState(false);
  const m = metasDoEstado(state);
  const t = totals(state.meals);
  const passou = t.kcal > m.meta;
  const visiveis = state.meals.filter((x) => todas || PRINCIPAIS.includes(x.id) || x.items.length > 0);
  const escondidas = state.meals.length - visiveis.length;

  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[#B36B12] dark:text-warn font-bold text-[12px] tracking-wide uppercase"><Utensils size={16} /> Comida</span>
        <span className="font-mono text-[13px]"><b>{fmtInt(t.kcal)}</b><span className="text-ink-mute"> / {fmtInt(m.meta)} kcal</span></span>
      </div>
      <Bar pct={m.meta > 0 ? (t.kcal / m.meta) * 100 : 0} color={passou ? "#C2455F" : "#1E8E5A"} h={10} />
      <span className="text-[12.5px] text-ink-soft">
        {passou ? <b className="text-danger">{fmtInt(t.kcal - m.meta)} kcal acima da meta</b> : <><b>Restam {fmtInt(m.meta - t.kcal)} kcal</b></>} · proteína {fmtInt(t.proteina)} de {fmtInt(m.proteina)} g
      </span>

      <div className="flex flex-col -mx-1">
        {visiveis.map((meal) => {
          const k = totals([meal]).kcal;
          const nomes = meal.items.length;
          return (
            <button key={meal.id} type="button" onClick={() => openFood(meal.id)} className="flex items-center gap-3 px-1 py-2.5 text-left rounded-xl active:bg-surface-raised">
              <span className={cx("w-6 h-6 rounded-full flex items-center justify-center flex-none", nomes ? "bg-brand text-white" : "border-2 border-[#C5D1CA] dark:border-[#3A4A41]")}>
                {nomes ? <Check size={14} strokeWidth={3} /> : null}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[14px]">{meal.nome}</div>
                {meal.items.length > 0 && <ItensNomes ids={meal.items.map((i) => i.foodId)} />}
              </div>
              {k > 0 ? <span className="font-mono text-[12.5px] text-ink-soft flex-none">{fmtInt(k)} kcal</span> : <span className="w-8 h-8 rounded-full bg-surface-raised dark:bg-surface-raisedDark text-ink-soft flex items-center justify-center flex-none"><Plus size={16} /></span>}
            </button>
          );
        })}
      </div>
      {escondidas > 0 && (
        <button type="button" onClick={() => setTodas(true)} className="self-start text-[12.5px] font-bold text-ink-mute -mt-1">+ Outras refeições (lanche da manhã, pré e pós-treino, ceia)</button>
      )}
      <Button variant="ghost" onClick={() => openFood(refeicaoAgora(state.meals))}><Plus size={17} /> Adicionar comida</Button>
    </Card>
  );
}

function ItensNomes({ ids }: { ids: string[] }) {
  const nomes = ids.map((id) => foodById(id).nome.split(" (")[0]);
  return <div className="text-[11.5px] text-ink-mute truncate">{nomes.join(", ")}</div>;
}

function AguaCard() {
  const { state, dispatch } = useStore();
  const l = state.waterMl / 1000;
  const meta = aguaMetaL(state);
  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-water font-bold text-[12px] tracking-wide uppercase"><Droplets size={16} /> Água</span>
        <span className="font-mono text-[13px]"><b>{fmtDec(l)}</b><span className="text-ink-mute"> / {fmtDec(meta)} L</span></span>
      </div>
      <Bar pct={meta > 0 ? (l / meta) * 100 : 0} color="#3B82C4" h={10} />
      <div className="flex gap-2">
        <button type="button" aria-label="Tirar um copo" onClick={() => dispatch({ type: "ADD_WATER", ml: -250 })} className="w-12 h-12 rounded-xl bg-surface-raised dark:bg-surface-raisedDark text-ink-soft flex items-center justify-center flex-none"><Minus size={18} /></button>
        <button type="button" onClick={() => dispatch({ type: "ADD_WATER", ml: 250 })} className="flex-1 h-12 rounded-xl bg-water text-white font-bold text-[14px] flex items-center justify-center gap-1.5"><Plus size={18} /> 1 copo (250 ml)</button>
        <button type="button" onClick={() => dispatch({ type: "ADD_WATER", ml: 500 })} className="px-4 h-12 rounded-xl bg-[#E6F0FA] dark:bg-[#132433] text-water font-bold text-[13px] flex-none">+500</button>
      </div>
    </Card>
  );
}

function Semana() {
  const { state, dispatch } = useStore();
  const v = vistoDe(state);
  const h = hojeDe(state);
  const dow = (parseISO(v).getDay() + 6) % 7; // 0 = segunda
  const seg = addDays(v, -dow);
  const dias = Array.from({ length: 7 }, (_, i) => addDays(seg, i));
  const feitos = dias.filter((d) => state.workouts.some((w) => w.data === isoToDM(d))).length;
  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-[12px] tracking-wide uppercase text-ink-mute">Sua semana</span>
        <span className="text-[12.5px] font-bold">{feitos} {feitos === 1 ? "dia treinado" : "dias treinados"}</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {dias.map((d, i) => {
          const ok = state.workouts.some((w) => w.data === isoToDM(d));
          const plano = treinoPlanejado(state, d);
          const futuro = d > h;
          return (
            <button key={d} type="button" onClick={() => dispatch({ type: "SET_DIA_VISTO", date: d })} className="flex flex-col items-center gap-1">
              <span className={cx("text-[10.5px] font-bold", d === v ? "text-brand" : "text-ink-mute")}>{"STQQSSD"[i]}</span>
              <span className={cx(
                "w-full aspect-square rounded-xl flex items-center justify-center text-[11px] font-bold",
                ok ? "bg-brand text-white" : plano === "Descanso" ? "bg-surface-raised dark:bg-surface-raisedDark text-ink-mute" : futuro ? "border-2 border-dashed border-line dark:border-line-dark text-ink-mute" : "bg-surface-raised dark:bg-surface-raisedDark text-ink-mute",
                d === v && "ring-2 ring-brand ring-offset-2 ring-offset-surface-card dark:ring-offset-surface-cardDark",
              )}>
                {ok ? <Check size={15} strokeWidth={3} /> : plano === "Descanso" ? "–" : parseISO(d).getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function AssistenteAtalho() {
  const { go } = useUi();
  return (
    <button type="button" onClick={() => go("assistente")} className="p-4 rounded-2xl bg-[#0B0F0C] text-white flex items-center gap-3 text-left">
      <span className="w-11 h-11 rounded-xl bg-[#A3E635] text-[#0B0F0C] flex items-center justify-center flex-none"><Sparkles size={20} /></span>
      <span className="flex-1 min-w-0">
        <span className="block font-bold text-[14px]">Pergunte ao assistente</span>
        <span className="block text-[12px] text-[#B9C4BC] truncate">“O que comer no jantar para bater a proteína?”</span>
      </span>
      <ChevronRight size={18} className="text-[#B9C4BC] flex-none" />
    </button>
  );
}
