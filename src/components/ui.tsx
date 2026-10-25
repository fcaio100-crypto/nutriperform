import { useState, type ReactNode } from "react";
import { Check, ChevronDown, ChevronUp, Info, PlayCircle, X } from "lucide-react";
import { DICAS, videoUrl } from "../data/exercises";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function Card({ children, className = "", onClick, tone = "default" }: { children: ReactNode; className?: string; onClick?: () => void; tone?: "default" | "soft" | "dark" }) {
  const tones = {
    default: "bg-surface-card dark:bg-surface-cardDark border border-line dark:border-line-dark shadow-card",
    soft: "bg-brand-soft dark:bg-brand-softDark",
    dark: "bg-[#12241A] text-white",
  };
  return (
    <div onClick={onClick} className={cx("rounded-2xl", tones[tone], onClick && "cursor-pointer active:scale-[.99] transition-transform", className)}>
      {children}
    </div>
  );
}

export function Button({ children, onClick, variant = "primary", className = "", disabled, size = "md" }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "danger"; className?: string; disabled?: boolean; size?: "sm" | "md" | "lg" }) {
  const v = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    secondary: "bg-surface-card dark:bg-surface-cardDark border border-line dark:border-line-dark text-ink dark:text-white",
    ghost: "bg-surface-raised dark:bg-surface-raisedDark text-ink dark:text-white",
    danger: "bg-transparent border border-line dark:border-line-dark text-danger",
  }[variant];
  const s = { sm: "px-3 py-2 text-[12px] rounded-xl", md: "px-4 py-3 text-[13px] rounded-xl", lg: "px-5 py-4 text-[14px] rounded-2xl w-full" }[size];
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cx("font-bold transition-colors select-none inline-flex items-center justify-center gap-2", v, s, disabled && "opacity-40 pointer-events-none", className)}>
      {children}
    </button>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="flex flex-col gap-0.5 min-w-0">
        <h1 className="font-extrabold text-[24px] tracking-tight leading-tight">{title}</h1>
        {subtitle && <span className="text-[12.5px] text-ink-soft dark:text-[#9DB0A5] font-medium">{subtitle}</span>}
      </div>
      {action}
    </div>
  );
}

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mt-1">
      <span className="font-bold text-[11px] tracking-[0.08em] uppercase text-ink-mute">{children}</span>
      {action}
    </div>
  );
}

export function Muted({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={cx("text-ink-soft dark:text-[#9DB0A5]", className)}>{children}</span>;
}

/** Abas de segundo nível (pílulas roláveis) */
export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: string; badge?: number }[] }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 sticky top-0 z-10 py-2 bg-surface/90 dark:bg-surface-dark/90 backdrop-blur">
      {items.map((it) => {
        const sel = it.id === value;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            className={cx(
              "px-4 py-2 rounded-full font-bold text-[12.5px] whitespace-nowrap flex-none flex items-center gap-1.5 transition-colors",
              sel ? "bg-ink text-white dark:bg-white dark:text-ink" : "bg-surface-card dark:bg-surface-cardDark text-ink-soft dark:text-[#B5C4BB] border border-line dark:border-line-dark",
            )}
          >
            {it.label}
            {!!it.badge && <span className={cx("text-[10px] font-mono", sel ? "opacity-70" : "opacity-60")}>{it.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Seleção única em formato de chips */
export function Chips<T extends string | number>({ value, onChange, options, small }: { value: T; onChange: (v: T) => void; options: { v: T; label: string }[]; small?: boolean }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          onClick={() => onChange(o.v)}
          className={cx(
            "rounded-xl font-semibold transition-colors",
            small ? "px-3 py-1.5 text-[11.5px]" : "px-3.5 py-2 text-[12px]",
            o.v === value ? "bg-brand text-white" : "bg-surface-raised dark:bg-surface-raisedDark text-ink-soft dark:text-[#B5C4BB]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-semibold text-[11.5px] text-ink-soft dark:text-[#9DB0A5]">{label}</span>
      {children}
      {hint && <span className="text-[10.5px] text-ink-mute">{hint}</span>}
    </label>
  );
}

const inputCls = "px-3.5 py-3 rounded-xl border border-line dark:border-line-dark bg-surface-raised dark:bg-surface-raisedDark text-[13px] font-medium outline-none w-full focus:border-brand";
export function Input(p: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cx(inputCls, p.className)} />;
}
export function Select(p: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={cx(inputCls, p.className)} />;
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="w-full p-3.5 rounded-xl bg-surface-raised dark:bg-surface-raisedDark flex items-center justify-between gap-3 text-left">
      <span className="font-medium text-[12.5px] leading-snug">{label}</span>
      <span className={cx("flex-none w-11 h-6 rounded-full relative transition-colors", on ? "bg-brand" : "bg-[#CFD8D2] dark:bg-[#33423A]")}>
        <span className={cx("absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all", on ? "left-[22px]" : "left-[3px]")} />
      </span>
    </button>
  );
}

export function Bar({ pct, color = "#1E8E5A", h = 8 }: { pct: number; color?: string; h?: number }) {
  return (
    <div className="bg-surface-raised dark:bg-surface-raisedDark rounded-full overflow-hidden" style={{ height: h }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }} />
    </div>
  );
}

export function Ring({ pct, size = 128, stroke = 12, color = "#1E8E5A", children }: { pct: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, pct / 100));
  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-raised dark:stroke-surface-raisedDark" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke={color} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} style={{ transition: "stroke-dashoffset .5s" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

export function Stat({ label, value, unit, sub }: { label: string; value: ReactNode; unit?: string; sub?: ReactNode }) {
  return (
    <Card className="p-3.5 flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold text-ink-mute">{label}</span>
      <span className="font-mono font-medium text-[20px] leading-tight">
        {value}
        {unit && <span className="text-[12px] text-ink-mute"> {unit}</span>}
      </span>
      {sub && <span className="text-[10.5px] text-ink-mute">{sub}</span>}
    </Card>
  );
}

export function Empty({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-6 px-4">
      {icon && <div className="w-11 h-11 rounded-2xl bg-brand-soft dark:bg-brand-softDark text-brand flex items-center justify-center">{icon}</div>}
      <span className="font-bold text-[13.5px]">{title}</span>
      {text && <Muted className="text-[12px] leading-relaxed max-w-[300px]">{text}</Muted>}
      {action}
    </div>
  );
}

export function Sheet({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 anim-fade" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[560px] max-h-[90vh] flex flex-col bg-surface-card dark:bg-surface-cardDark rounded-t-[28px] anim-sheet"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="font-extrabold text-[17px]">{title}</span>
          <button type="button" onClick={onClose} aria-label="Fechar" className="w-8 h-8 rounded-full bg-surface-raised dark:bg-surface-raisedDark flex items-center justify-center text-ink-soft">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-4 flex flex-col gap-4">{children}</div>
        {footer && <div className="px-5 pt-2 pb-5 border-t border-line dark:border-line-dark">{footer}</div>}
      </div>
    </div>
  );
}

export function Collapse({ title, subtitle, children, defaultOpen = false, right }: { title: ReactNode; subtitle?: ReactNode; children: ReactNode; defaultOpen?: boolean; right?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full p-4 flex items-center justify-between gap-3 text-left">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-bold text-[14px]">{title}</span>
          {subtitle && <Muted className="text-[11.5px]">{subtitle}</Muted>}
        </div>
        <div className="flex items-center gap-2 flex-none">
          {right}
          {open ? <ChevronUp size={18} className="text-ink-mute" /> : <ChevronDown size={18} className="text-ink-mute" />}
        </div>
      </button>
      {open && <div className="px-4 pb-4 flex flex-col gap-3">{children}</div>}
    </Card>
  );
}

/** Linha de exercício: marcar feito, ver explicação e vídeo */
export function ExerciseRow({ nome, qtd, done, onToggle }: { nome: string; qtd: string; done: boolean; onToggle: () => void }) {
  const [info, setInfo] = useState(false);
  const d = DICAS[nome];
  return (
    <div className="flex flex-col gap-2 py-2.5 border-b last:border-0 border-line dark:border-line-dark">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onToggle} aria-label="Marcar como feito" className={cx("w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-none transition-colors", done ? "bg-brand border-brand text-white" : "border-[#C5D1CA] dark:border-[#3A4A41]")}>
          {done && <Check size={14} strokeWidth={3} />}
        </button>
        <button type="button" onClick={() => setInfo(!info)} className={cx("flex-1 min-w-0 text-left font-semibold text-[13px] leading-snug flex items-center gap-1.5", done && "line-through opacity-50")}>
          <span>{nome}</span>
          <Info size={14} className="text-brand flex-none" />
        </button>
        <span className="font-mono text-[11.5px] text-ink-mute flex-none text-right">{qtd}</span>
      </div>
      {info && (
        <div className="ml-9 p-3 rounded-xl bg-surface-raised dark:bg-surface-raisedDark flex flex-col gap-2.5 anim-fade">
          <span className="text-[12px] leading-relaxed">{d ? d[0] : "Execute com controle e sem dor. Na dúvida, peça orientação a um profissional."}</span>
          <a href={videoUrl(nome)} target="_blank" rel="noopener noreferrer" className="self-start inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand text-white font-bold text-[11.5px]">
            <PlayCircle size={15} /> Ver vídeo
          </a>
        </div>
      )}
    </div>
  );
}

/** Gráfico de barras simples */
export function BarChart({ data, color = "#1E8E5A", height = 130, fmt = (n: number) => String(Math.round(n)), goal }: { data: { label: string; value: number }[]; color?: string; height?: number; fmt?: (n: number) => string; goal?: number }) {
  const max = Math.max(1, goal ?? 0, ...data.map((d) => d.value));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative flex items-end gap-2" style={{ height }}>
        {goal ? <div className="absolute left-0 right-0 border-t border-dashed border-ink-mute/50" style={{ bottom: (goal / max) * height }} /> : null}
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1 min-w-0">
            <span className="font-mono text-[9.5px] text-ink-mute">{d.value > 0 ? fmt(d.value) : ""}</span>
            <div className="w-full max-w-[34px] rounded-t-lg" style={{ height: `${(d.value / max) * (height - 18)}px`, background: color, opacity: i === data.length - 1 ? 1 : 0.55, minHeight: d.value > 0 ? 3 : 0 }} />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center text-[10px] font-semibold text-ink-mute truncate">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

export function LineChart({ values, height = 120, color = "#1E8E5A" }: { values: number[]; height?: number; color?: string }) {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${values.length > 1 ? (i / (values.length - 1)) * 100 : 50},${100 - ((v - min) / span) * 80 - 10}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2.2} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => (
        <circle key={i} cx={values.length > 1 ? (i / (values.length - 1)) * 100 : 50} cy={100 - ((v - min) / span) * 80 - 10} r={1.6} fill={color} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

export function Pill({ children, tone = "brand" }: { children: ReactNode; tone?: "brand" | "mute" | "warn" | "danger" | "water" }) {
  const t = {
    brand: "bg-brand-soft text-brand dark:bg-brand-softDark",
    mute: "bg-surface-raised dark:bg-surface-raisedDark text-ink-soft",
    warn: "bg-[#FBF1DE] text-warn dark:bg-[#33280F]",
    danger: "bg-[#FBE6EA] text-danger dark:bg-[#33141B]",
    water: "bg-[#E6F0FA] text-water dark:bg-[#132433]",
  }[tone];
  return <span className={cx("px-2 py-0.5 rounded-full font-bold text-[10.5px] whitespace-nowrap", t)}>{children}</span>;
}
