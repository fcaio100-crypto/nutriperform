import { CalendarDays, ChevronLeft, ChevronRight, Home, LineChart, ShieldAlert, ShieldCheck, Sparkles, User } from "lucide-react";
import { useStore, hojeDe, vistoDe } from "../state/store";
import { useUi } from "../state/ui";
import { longDate, metasDoEstado, parseISO, addDays, triagem } from "../lib/calc";
import { Card, cx } from "./ui";

export const NAV = [
  { id: "hoje", label: "Hoje", icon: Home },
  { id: "assistente", label: "Assistente", icon: Sparkles },
  { id: "historico", label: "Histórico", icon: LineChart },
  { id: "eu", label: "Eu", icon: User },
] as const;

export function BottomNav() {
  const { state } = useStore();
  const { go } = useUi();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-card/95 dark:bg-surface-cardDark/95 backdrop-blur border-t border-line dark:border-line-dark" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="max-w-[560px] mx-auto grid grid-cols-4">
        {NAV.map(({ id, label, icon: Icon }) => {
          const sel = state.screen === id;
          return (
            <button key={id} type="button" onClick={() => go(id)} className="flex flex-col items-center gap-1 py-2.5">
              <span className={cx("w-12 h-7 rounded-full flex items-center justify-center transition-colors", sel && "bg-brand-soft dark:bg-brand-softDark")}>
                <Icon size={20} strokeWidth={sel ? 2.4 : 1.9} className={sel ? "text-brand" : "text-ink-mute"} />
              </span>
              <span className={cx("text-[10.5px] font-bold", sel ? "text-brand" : "text-ink-mute")}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** Seletor de dia (dias passados e futuros) */
export function DayNav() {
  const { state, dispatch } = useStore();
  const v = vistoDe(state);
  const h = hojeDe(state);
  const dif = Math.round((parseISO(v).getTime() - parseISO(h).getTime()) / 864e5);
  const rel = dif === 0 ? "Hoje" : dif === -1 ? "Ontem" : dif === 1 ? "Amanhã" : dif < 0 ? `${-dif} dias atrás` : `Daqui a ${dif} dias`;
  const ir = (d: string) => dispatch({ type: "SET_DIA_VISTO", date: d });
  const antigo = state.history.find((x) => x.date === v);
  const vazio = !state.meals.some((m) => m.items.length);
  const btn = "w-9 h-9 rounded-full bg-surface-card dark:bg-surface-cardDark border border-line dark:border-line-dark flex items-center justify-center text-ink-soft flex-none";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Dia anterior" onClick={() => ir(addDays(v, -1))} className={btn}><ChevronLeft size={18} /></button>
        <label className="relative flex-1 min-w-0 flex items-center justify-center gap-2 h-9 rounded-full bg-surface-card dark:bg-surface-cardDark border border-line dark:border-line-dark cursor-pointer">
          <CalendarDays size={15} className="text-brand flex-none" />
          <span className="font-bold text-[12.5px] truncate">{rel === "Hoje" ? `Hoje · ${longDate(parseISO(v)).split(",")[1]?.trim()}` : `${rel} · ${longDate(parseISO(v))}`}</span>
          <input type="date" value={v} onChange={(e) => e.target.value && ir(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" aria-label="Escolher data" />
        </label>
        <button type="button" aria-label="Próximo dia" onClick={() => ir(addDays(v, 1))} className={btn}><ChevronRight size={18} /></button>
      </div>
      {dif !== 0 && (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-brand-soft dark:bg-brand-softDark anim-fade">
          <span className="text-[11.5px] font-medium leading-snug">
            {dif < 0 ? "Vendo um dia passado — o que adicionar fica neste dia." : "Planejando um dia futuro — quando chegar, já estará preenchido."}
          </span>
          <button type="button" onClick={() => ir(h)} className="px-3 py-1.5 rounded-lg bg-brand text-white font-bold text-[11.5px] flex-none">Hoje</button>
        </div>
      )}
      {dif < 0 && antigo && vazio && (
        <span className="text-[11px] text-ink-mute px-1">
          Antes do diário por data só os totais eram guardados: {antigo.kcal} kcal · P {antigo.proteina} g · C {antigo.carbo} g · G {antigo.gordura} g.
        </span>
      )}
    </div>
  );
}

const NIVEL_UI = {
  verde: { label: "Tudo certo", tone: "text-brand", bg: "bg-brand-soft dark:bg-brand-softDark", Icon: ShieldCheck },
  amarelo: { label: "Atenção", tone: "text-warn", bg: "bg-[#FBF1DE] dark:bg-[#33280F]", Icon: ShieldAlert },
  vermelho: { label: "Procure orientação profissional", tone: "text-danger", bg: "bg-[#FBE6EA] dark:bg-[#33141B]", Icon: ShieldAlert },
};

export function SafetyCard({ compact }: { compact?: boolean }) {
  const { state } = useStore();
  const m = metasDoEstado(state);
  const t = triagem(state.healthScreening, m.imc, state.profile.idade);
  const ui = NIVEL_UI[t.nivel];
  if (compact && t.nivel === "verde") return null;
  return (
    <Card className={cx("p-4 flex flex-col gap-2 border-0 shadow-none", ui.bg)}>
      <div className="flex items-center gap-2">
        <ui.Icon size={18} className={ui.tone} />
        <span className={cx("font-bold text-[13px]", ui.tone)}>Central de segurança · {ui.label}</span>
      </div>
      <div className="flex flex-col gap-1">
        {t.motivos.map((m, i) => (
          <span key={i} className="text-[12px] leading-relaxed">• {m}</span>
        ))}
      </div>
      {!compact && <span className="text-[10.5px] text-ink-mute leading-relaxed">A triagem é só uma bússola de cautela — o app nunca diagnostica.</span>}
    </Card>
  );
}

export function Toast() {
  const { toast } = useUi();
  if (!toast) return null;
  return (
    <div className="fixed left-0 right-0 bottom-24 z-50 flex justify-center px-4 pointer-events-none">
      <div className="px-4 py-3 rounded-2xl bg-ink text-white text-[12.5px] font-semibold shadow-lg anim-rise max-w-[420px] text-center">{toast}</div>
    </div>
  );
}
