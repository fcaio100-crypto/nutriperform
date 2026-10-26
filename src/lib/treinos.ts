import type { Workout } from "./types";
import { addDays, isoDate, parseISO, todayISO } from "./calc";

/** Cor de cada modalidade nos gráficos e no card de compartilhar */
export const MOD_COR: Record<string, string> = {
  "Musculação": "#1E8E5A",
  "Funcional em casa": "#0E9F9A",
  "Corrida": "#3B6FE0",
  "Caminhada": "#5AA7D6",
  "Mobilidade": "#9B7BD8",
  "Futebol": "#2E9E3E",
  "Beach tennis": "#E0A21B",
  "Ciclismo": "#D9466B",
  "CrossFit": "#E4632A",
  "Natação": "#1BA7C9",
};
export const corDe = (mod: string) => MOD_COR[mod] ?? "#8A978F";

/** Data do treino em yyyy-mm-dd (registros antigos têm só dd/mm: usa o ano mais recente possível) */
export function isoDoTreino(w: Workout): string {
  if (w.dataISO) return w.dataISO;
  const m = /^(\d{2})\/(\d{2})$/.exec(w.data || "");
  if (!m) return todayISO();
  const hoje = new Date();
  const d = new Date(hoje.getFullYear(), Number(m[2]) - 1, Number(m[1]));
  if (d > hoje) d.setFullYear(d.getFullYear() - 1);
  return isoDate(d);
}

/** Distância em km a partir do texto livre ("5,2 km", "5 km", "800 m") */
export function kmDoTreino(w: Workout): number {
  const t = (w.distancia || "").toLowerCase();
  if (!t || t === "—" || t.startsWith("nível")) return 0;
  const n = parseFloat(t.replace(",", ".").replace(/[^\d.]/g, " ").trim().split(/\s+/)[0]);
  if (!(n > 0)) return 0;
  return /\bm\b|metros/.test(t) && !/km/.test(t) ? n / 1000 : n;
}

export function fmtDur(min: number) {
  const m = Math.round(min || 0);
  const h = Math.floor(m / 60);
  return h ? `${h}h${String(m % 60).padStart(2, "0")}` : `${m} min`;
}
export function pace(min: number, km: number) {
  if (!(km > 0) || !(min > 0)) return "";
  const p = min / km;
  let mm = Math.floor(p);
  let ss = Math.round((p - mm) * 60);
  if (ss === 60) { mm++; ss = 0; }
  return `${mm}:${String(ss).padStart(2, "0")}`;
}
export const fmtKm = (k: number) => (Math.round(k * 100) / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 });

/** Segunda-feira da semana de uma data */
export function inicioSemana(iso: string) {
  const d = parseISO(iso);
  return addDays(iso, -((d.getDay() + 6) % 7));
}

export function totaisTreino(ws: Workout[]) {
  return ws.reduce(
    (a, w) => ({ n: a.n + 1, min: a.min + (w.duracaoMin || 0), km: a.km + kmDoTreino(w), kcal: a.kcal + (w.kcal || 0) }),
    { n: 0, min: 0, km: 0, kcal: 0 },
  );
}

export const entre = (ws: Workout[], de: string, ate: string) => ws.filter((w) => { const d = isoDoTreino(w); return d >= de && d <= ate; });

export function tituloTreino(w: Workout) {
  if (w.titulo) return w.titulo;
  const h = parseInt((w.hora || "12").split(":")[0], 10);
  return `${w.modalidade} ${h < 12 ? "da manhã" : h < 18 ? "da tarde" : "da noite"}`;
}

/** Dias seguidos com treino, terminando hoje ou ontem */
export function sequencia(ws: Workout[]) {
  const dias = new Set(ws.map(isoDoTreino));
  let d = todayISO();
  if (!dias.has(d)) d = addDays(d, -1);
  let n = 0;
  while (dias.has(d)) { n++; d = addDays(d, -1); }
  return n;
}
