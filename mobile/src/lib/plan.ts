import type { AppState } from "./types";
import { AGENDA_PADRAO, FUNC_MOD, NIVEIS, progressoFuncional, treinoSugerido, DURACAO_PADRAO } from "../data/exercises";
import { isoToDM, parseISO } from "./calc";

/** Treino planejado para uma data: troca pontual > semana de treino. */
export function treinoPlanejado(s: AppState, iso: string) {
  const o = s.treinoDoDia?.[iso];
  if (o) return o;
  return (s.agenda ?? AGENDA_PADRAO)[String(parseISO(iso).getDay())] ?? "Descanso";
}

export const treinosDaData = (s: AppState, iso: string) => s.workouts.filter((w) => w.data === isoToDM(iso));

/** Resumo curto do treino para o cartão de hoje. */
export function resumoTreino(s: AppState, mod: string) {
  if (mod === FUNC_MOD) {
    const n = NIVEIS[progressoFuncional(s.workouts).nivel - 1];
    return `Nível ${n.n} · ${n.nome} · ~${n.min} min · sem equipamento`;
  }
  if (mod === "Mobilidade") return "7 exercícios · ~10 min";
  if (mod === "Musculação") {
    const d = diaMusculacao(s);
    return d ? `${d.titulo} · ${d.exercicios.length} exercícios` : "Monte sua rotina em Eu › Musculação";
  }
  return `~${DURACAO_PADRAO[mod] ?? 45} min`;
}

/** Próximo dia da rotina de musculação (gira conforme as sessões já feitas). */
export function diaMusculacao(s: AppState, idx?: number) {
  const proprio = s.treinoPersonalizadoAtivo && s.treinoPersonalizado.length > 0;
  const dias = proprio
    ? s.treinoPersonalizado.map((d) => ({ titulo: d.dia, foco: d.foco, exercicios: d.exercicios }))
    : treinoSugerido(s.profile.objetivo, s.profile.diasTreinoSemana, s.profile.minutosPorTreino).map((d) => ({ titulo: `${d.dia} · ${d.foco}`, foco: d.foco, exercicios: d.exercicios }));
  if (!dias.length) return null;
  const feitos = s.workouts.filter((w) => w.modalidade === "Musculação").length;
  const i = idx ?? feitos % dias.length;
  return { ...dias[i % dias.length], indice: i % dias.length, total: dias.length, todos: dias };
}
