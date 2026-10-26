import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import type { AppState, DayData, DiaTreino, Exercicio, HealthScreening, Meal, PlanMeal, Profile, Supplement, User, WeightEntry, Workout } from "../lib/types";
import { addDays, roundedTotals, todayISO } from "../lib/calc";
import { AGENDA_PADRAO } from "../data/exercises";
import { supabase } from "../lib/supabase";

// Mesma chave e documento das versões anteriores: os dados do usuário continuam valendo.
const STORAGE_KEY = "nutriperform.state.v1";
const DB_DOC = "app/state";

export const DEFAULT_PROFILE: Profile = {
  nome: "", idade: 30, sexo: "Masculino", peso: 75, altura: 175, abdomen: 0, gordura: 0, massaMagra: 0,
  objetivo: "Saúde geral", pesoDesejado: 75, atividade: "Moderadamente ativo", diasTreinoSemana: 3, minutosPorTreino: 60,
};
export const DEFAULT_MEALS: Meal[] = [
  { id: "cafe", nome: "Café da manhã", hora: "07:00", items: [] },
  { id: "lm", nome: "Lanche da manhã", hora: "10:00", items: [] },
  { id: "almoco", nome: "Almoço", hora: "12:30", items: [] },
  { id: "lt", nome: "Lanche da tarde", hora: "15:30", items: [] },
  { id: "pre", nome: "Pré-treino", hora: "17:30", items: [] },
  { id: "pos", nome: "Pós-treino", hora: "20:45", items: [] },
  { id: "jantar", nome: "Jantar", hora: "21:15", items: [] },
  { id: "ceia", nome: "Ceia", hora: "22:30", items: [] },
];
export const DEFAULT_HEALTH: HealthScreening = {
  dorPeitoOuTontura: false, condicaoCardiaca: false, gestanteOuLactante: false, cirurgiaOuLesaoRecente: false,
  cirurgiaBariatrica: false, doencaRenal: false, doencaHepatica: false, diabetesRiscoHipoglicemia: false,
  condicaoCronicaControlada: false, dorArticular: false, usoMedicacaoContinua: false, sinalComportamentoAlimentar: false, observacoes: "",
};

export function initialState(): AppState {
  return {
    profile: DEFAULT_PROFILE,
    meals: DEFAULT_MEALS,
    workouts: [],
    weights: [],
    supplements: [
      { id: 1, nome: "Creatina monoidratada", dose: "5 g", hora: "Pós-treino", frequencia: "Todos os dias", objetivo: "Força e potência" },
      { id: 2, nome: "Whey protein", dose: "30 g", hora: "Pós-treino", frequencia: "Dias de treino", objetivo: "Aporte proteico" },
    ],
    waterMl: 0, deficit: 0, protPerKg: 1.8, fatPct: 25, mlPerKg: 35,
    gastoManualAtivo: false, gastoManualKcal: 0, dayType: "Treino leve", shoppingChecks: {},
    users: [], auth: { currentUserEmail: null, loginTries: 0, lockedUntil: null },
    history: [], lastActiveDate: "", onboardingDone: false, theme: "Claro", screen: "hoje",
    planoPersonalizadoAtivo: false, planoPersonalizado: [], treinoPersonalizadoAtivo: false, treinoPersonalizado: [],
    planoSeguidoHoje: false, healthScreening: DEFAULT_HEALTH, dias: {},
    agenda: { ...AGENDA_PADRAO }, treinoDoDia: {},
  };
}

const LEGACY_SCREENS: Record<string, string> = {
  comida: "hoje", agua: "hoje", plano: "hoje", supl: "hoje", treino: "hoje", comer: "hoje", treinar: "hoje",
  corpo: "historico", evolucao: "historico", progresso: "historico", metas: "eu", mais: "eu", perfil: "eu",
};

function merge(base: AppState, saved: Partial<AppState>): AppState {
  const s: AppState = {
    ...base,
    ...saved,
    profile: { ...base.profile, ...(saved.profile ?? {}) },
    auth: { ...base.auth, ...(saved.auth ?? {}) },
    healthScreening: { ...base.healthScreening, ...(saved.healthScreening ?? {}) },
    dias: saved.dias ?? {},
    agenda: { ...AGENDA_PADRAO, ...(saved.agenda ?? {}) },
    treinoDoDia: saved.treinoDoDia ?? {},
  };
  s.screen = LEGACY_SCREENS[s.screen] ?? s.screen;
  return s;
}

function loadLocal(): AppState {
  const base = initialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const s = raw ? merge(base, JSON.parse(raw)) : base;
    // com Supabase, quem diz se está logado é a sessão da nuvem
    return supabase ? { ...s, auth: { ...s.auth, currentUserEmail: null } } : s;
  } catch {
    return base;
  }
}

// ===== Dias: state.meals/waterMl = dia visto; state.dias guarda todos os outros =====
export const hojeDe = (s: AppState) => s.lastActiveDate || todayISO();
export const vistoDe = (s: AppState) => s.diaVisto || hojeDe(s);
const vazio = (meals: Meal[]) => meals.map((m) => ({ ...m, items: [] }));
const temItens = (meals: Meal[]) => meals.some((m) => m.items.length > 0);
function upsertHist(h: AppState["history"], e: AppState["history"][number]) {
  return [...h.filter((x) => x.date !== e.date), e].sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-90);
}
function prune(d: Record<string, DayData>, hoje: string) {
  const lim = addDays(hoje, -120);
  const o: Record<string, DayData> = {};
  for (const k in d) if (k >= lim) o[k] = d[k];
  return o;
}
export function mealsDeHoje(s: AppState) {
  const h = hojeDe(s);
  return vistoDe(s) === h ? s.meals : s.dias?.[h]?.meals ?? vazio(s.meals);
}
export function aguaDeHoje(s: AppState) {
  const h = hojeDe(s);
  return vistoDe(s) === h ? s.waterMl : s.dias?.[h]?.waterMl ?? 0;
}

function trocarDia(s: AppState, date: string): AppState {
  const atual = vistoDe(s);
  if (!date || date === atual) return s;
  const hoje = hojeDe(s);
  const dias = { ...(s.dias ?? {}) };
  dias[atual] = { meals: s.meals, waterMl: s.waterMl };
  let history = s.history;
  if (atual < hoje && (temItens(s.meals) || s.waterMl > 0)) history = upsertHist(history, { date: atual, waterMl: s.waterMl, ...roundedTotals(s.meals) });
  const alvo = dias[date];
  delete dias[date];
  return { ...s, dias: prune(dias, hoje), history, diaVisto: date, meals: alvo ? alvo.meals : vazio(s.meals), waterMl: alvo ? alvo.waterMl : 0 };
}

function virarDia(s: AppState, today: string): AppState {
  if (s.lastActiveDate === today) return s;
  const dias = { ...(s.dias ?? {}) };
  const visto = vistoDe(s);
  const last = s.lastActiveDate;
  let history = s.history;
  if (visto) dias[visto] = { meals: s.meals, waterMl: s.waterMl };
  if (last && dias[last]) history = upsertHist(history, { date: last, waterMl: dias[last].waterMl, ...roundedTotals(dias[last].meals) });
  const novo = dias[today];
  delete dias[today];
  return {
    ...s, dias: prune(dias, today), lastActiveDate: today, diaVisto: today, history,
    waterMl: novo ? novo.waterMl : 0, meals: novo ? novo.meals : vazio(s.meals), planoSeguidoHoje: false,
  };
}

// ===== Ações =====
export type Action =
  | { type: "SET_SCREEN"; screen: string }
  | { type: "UPDATE_PROFILE"; patch: Partial<Profile> }
  | { type: "ADD_MEAL_ITEM"; mealId: string; foodId: string; qtdGramas: number }
  | { type: "ADD_MEAL_ITEMS_BULK"; mealId: string; itens: { foodId: string; qtdGramas: number }[] }
  | { type: "REMOVE_MEAL_ITEM"; mealId: string; itemId: number }
  | { type: "ADD_WATER"; ml: number }
  | { type: "SET_GOALS"; patch: Partial<AppState> }
  | { type: "SET_DAY_TYPE"; dayType: string }
  | { type: "TOGGLE_SHOPPING_ITEM"; key: string }
  | { type: "ADD_WORKOUT"; workout: Workout }
  | { type: "REMOVE_WORKOUT"; id: number }
  | { type: "ADD_SUPPLEMENT"; supplement: Supplement }
  | { type: "REMOVE_SUPPLEMENT"; id: number }
  | { type: "ADD_WEIGHT"; entry: WeightEntry }
  | { type: "SET_THEME"; theme: AppState["theme"] }
  | { type: "SET_ONBOARDING_DONE"; done: boolean }
  | { type: "REGISTER_USER"; user: User }
  | { type: "ADMIN_CREATE_USER"; user: User }
  | { type: "LOGIN_SUCCESS"; email: string }
  | { type: "LOGIN_FAIL"; lockoutTries: number; lockoutDurationMs: number }
  | { type: "LOGOUT" }
  | { type: "ROLLOVER_DAY"; today: string }
  | { type: "SET_DIA_VISTO"; date: string }
  | { type: "SET_PLANO_PERSONALIZADO_ATIVO"; ativo: boolean }
  | { type: "ADD_REFEICAO_PERSONALIZADA"; refeicao: PlanMeal }
  | { type: "REMOVE_REFEICAO_PERSONALIZADA"; id: number }
  | { type: "SET_TREINO_PERSONALIZADO_ATIVO"; ativo: boolean }
  | { type: "ADD_DIA_TREINO_PERSONALIZADO"; dia: DiaTreino }
  | { type: "REMOVE_DIA_TREINO_PERSONALIZADO"; id: number }
  | { type: "ADD_EXERCICIO_PERSONALIZADO"; diaId: number; exercicio: Exercicio }
  | { type: "REMOVE_EXERCICIO_PERSONALIZADO"; diaId: number; exercicioId: number }
  | { type: "SET_PLANO_SEGUIDO_HOJE"; seguido: boolean }
  | { type: "UPDATE_HEALTH_SCREENING"; patch: Partial<HealthScreening> }
  | { type: "APLICAR_DIETA_GERADA"; gastoManualKcal: number; deficit: number; refeicoes: PlanMeal[] }
  | { type: "SET_AGENDA"; dia: string; mod: string }
  | { type: "SET_TREINO_DO_DIA"; date: string; mod: string }
  | { type: "REPLACE_STATE"; state: AppState };

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case "SET_SCREEN": return { ...s, screen: a.screen };
    case "UPDATE_PROFILE": return { ...s, profile: { ...s.profile, ...a.patch } };
    case "ADD_MEAL_ITEM":
      return { ...s, meals: s.meals.map((m) => (m.id === a.mealId ? { ...m, items: [...m.items, { id: Date.now(), foodId: a.foodId, qtdGramas: a.qtdGramas }] } : m)) };
    case "ADD_MEAL_ITEMS_BULK": {
      const t = Date.now();
      const novos = a.itens.map((it, i) => ({ id: t + i, foodId: it.foodId, qtdGramas: it.qtdGramas }));
      return { ...s, meals: s.meals.map((m) => (m.id === a.mealId ? { ...m, items: [...m.items, ...novos] } : m)) };
    }
    case "REMOVE_MEAL_ITEM":
      return { ...s, meals: s.meals.map((m) => (m.id === a.mealId ? { ...m, items: m.items.filter((i) => i.id !== a.itemId) } : m)) };
    case "ADD_WATER": return { ...s, waterMl: Math.max(0, Math.min(10000, s.waterMl + a.ml)) };
    case "SET_GOALS": return { ...s, ...a.patch };
    case "SET_DAY_TYPE": return { ...s, dayType: a.dayType };
    case "TOGGLE_SHOPPING_ITEM": return { ...s, shoppingChecks: { ...s.shoppingChecks, [a.key]: !s.shoppingChecks[a.key] } };
    case "ADD_WORKOUT": return { ...s, workouts: [a.workout, ...s.workouts] };
    case "REMOVE_WORKOUT": return { ...s, workouts: s.workouts.filter((w) => w.id !== a.id) };
    case "ADD_SUPPLEMENT": return { ...s, supplements: [...s.supplements, a.supplement] };
    case "REMOVE_SUPPLEMENT": return { ...s, supplements: s.supplements.filter((x) => x.id !== a.id) };
    case "ADD_WEIGHT": return { ...s, weights: [...s.weights, a.entry], profile: { ...s.profile, peso: a.entry.peso } };
    case "SET_THEME": return { ...s, theme: a.theme };
    case "SET_ONBOARDING_DONE": return { ...s, onboardingDone: a.done };
    case "REGISTER_USER":
      return { ...s, users: [...s.users, a.user], profile: { ...s.profile, nome: a.user.name }, auth: { currentUserEmail: a.user.email, loginTries: 0, lockedUntil: null }, screen: "hoje" };
    case "ADMIN_CREATE_USER": return { ...s, users: [...s.users, a.user] };
    case "LOGIN_SUCCESS": return { ...s, auth: { currentUserEmail: a.email, loginTries: 0, lockedUntil: null }, screen: "hoje" };
    case "LOGIN_FAIL": {
      const n = s.auth.loginTries + 1;
      return { ...s, auth: { ...s.auth, loginTries: n, lockedUntil: n >= a.lockoutTries ? Date.now() + a.lockoutDurationMs : s.auth.lockedUntil } };
    }
    case "LOGOUT": return { ...s, auth: { ...s.auth, currentUserEmail: null } };
    case "ROLLOVER_DAY": return virarDia(s, a.today);
    case "SET_DIA_VISTO": return trocarDia(s, a.date);
    case "SET_PLANO_PERSONALIZADO_ATIVO": return { ...s, planoPersonalizadoAtivo: a.ativo };
    case "ADD_REFEICAO_PERSONALIZADA": return { ...s, planoPersonalizado: [...s.planoPersonalizado, a.refeicao] };
    case "REMOVE_REFEICAO_PERSONALIZADA": return { ...s, planoPersonalizado: s.planoPersonalizado.filter((r) => r.id !== a.id) };
    case "SET_TREINO_PERSONALIZADO_ATIVO": return { ...s, treinoPersonalizadoAtivo: a.ativo };
    case "ADD_DIA_TREINO_PERSONALIZADO": return { ...s, treinoPersonalizado: [...s.treinoPersonalizado, a.dia] };
    case "REMOVE_DIA_TREINO_PERSONALIZADO": return { ...s, treinoPersonalizado: s.treinoPersonalizado.filter((d) => d.id !== a.id) };
    case "ADD_EXERCICIO_PERSONALIZADO":
      return { ...s, treinoPersonalizado: s.treinoPersonalizado.map((d) => (d.id === a.diaId ? { ...d, exercicios: [...d.exercicios, a.exercicio] } : d)) };
    case "REMOVE_EXERCICIO_PERSONALIZADO":
      return { ...s, treinoPersonalizado: s.treinoPersonalizado.map((d) => (d.id === a.diaId ? { ...d, exercicios: d.exercicios.filter((e) => e.id !== a.exercicioId) } : d)) };
    case "SET_PLANO_SEGUIDO_HOJE": return { ...s, planoSeguidoHoje: a.seguido };
    case "UPDATE_HEALTH_SCREENING": return { ...s, healthScreening: { ...s.healthScreening, ...a.patch } };
    case "APLICAR_DIETA_GERADA":
      return { ...s, gastoManualAtivo: true, gastoManualKcal: a.gastoManualKcal, deficit: a.deficit, planoPersonalizadoAtivo: true, planoPersonalizado: a.refeicoes };
    case "SET_AGENDA": return { ...s, agenda: { ...(s.agenda ?? AGENDA_PADRAO), [a.dia]: a.mod } };
    case "SET_TREINO_DO_DIA": return { ...s, treinoDoDia: { ...(s.treinoDoDia ?? {}), [a.date]: a.mod } };
    case "REPLACE_STATE": return a.state;
    default: return s;
  }
}

// ===== Sincronização com o banco de dados do Claude (quando disponível) =====
type Db = { doc: (p: string) => { get: () => Promise<{ exists: boolean; data: () => Partial<AppState> | undefined }>; set: (v: unknown) => Promise<unknown> } };
let dbPromise: Promise<Db | null> | null = null;
function getDb(): Promise<Db | null> {
  if (!dbPromise)
    dbPromise = (async () => {
      const w = window as unknown as { claude?: { use?: (n: string) => Promise<Db> } };
      if (!w.claude?.use) return null;
      try {
        return await w.claude.use("db");
      } catch {
        return null;
      }
    })();
  return dbPromise;
}

/** o que vai para a nuvem: tudo, menos contas locais e sessão */
function paraNuvem(s: AppState) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { users: _u, auth: _a, ...resto } = s;
  return resto;
}

export type SyncStatus = "checking" | "synced" | "local-only";
interface Ctx { state: AppState; dispatch: React.Dispatch<Action>; sync: SyncStatus }
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadLocal);
  const [sync, setSync] = useState<SyncStatus>("checking");
  const dbRef = useRef<Db | null>(null);
  const lastSent = useRef("");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* armazenamento indisponível */ }
  }, [state]);

  // ===== Banco do Claude (quando o app roda dentro do Claude) =====
  useEffect(() => {
    if (supabase) return;
    let cancel = false;
    (async () => {
      const db = await getDb();
      if (cancel) return;
      if (!db) return setSync("local-only");
      try {
        const snap = await db.doc(DB_DOC).get();
        if (cancel) return;
        if (snap.exists) {
          const data = snap.data();
          if (data) {
            const merged = merge(initialState(), data);
            lastSent.current = JSON.stringify(merged);
            dispatch({ type: "REPLACE_STATE", state: merged });
          }
        }
        dbRef.current = db;
        setSync("synced");
      } catch {
        setSync("local-only");
      }
    })();
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    if (supabase || !dbRef.current) return;
    const json = JSON.stringify(state);
    if (json === lastSent.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      lastSent.current = json;
      dbRef.current?.doc(DB_DOC).set(state).catch(() => {});
    }, 700);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [state, sync]);

  // ===== Supabase (app publicado): login + tabela app_state, uma linha por usuário =====
  const sbUser = useRef<string | null>(null);
  const sbLoading = useRef<string | null>(null);
  useEffect(() => {
    if (!supabase) return;
    const sb = supabase;
    let cancel = false;
    async function carregar(uid: string, email: string, nome?: string) {
      if (sbLoading.current === uid || sbUser.current === uid) return;
      sbLoading.current = uid;
      sbUser.current = null;
      setSync("checking");
      const { data, error } = await sb.from("app_state").select("state").eq("user_id", uid).maybeSingle();
      sbLoading.current = null;
      if (cancel) return;
      if (error) { setSync("local-only"); return; } // não salva por cima do que está na nuvem
      const base = initialState();
      const remoto = data?.state as Partial<AppState> | undefined;
      const s = remoto ? merge(base, remoto) : { ...base, profile: { ...base.profile, nome: nome ?? "" } };
      const st: AppState = { ...s, users: [], auth: { currentUserEmail: email, loginTries: 0, lockedUntil: null } };
      lastSent.current = JSON.stringify(paraNuvem(st));
      dispatch({ type: "REPLACE_STATE", state: st });
      dispatch({ type: "ROLLOVER_DAY", today: todayISO() });
      sbUser.current = uid;
      setSync("synced");
    }
    const { data: sub } = sb.auth.onAuthStateChange((ev, session) => {
      const u = session?.user;
      // adia para fora do callback (recomendação do supabase-js)
      setTimeout(() => {
        if (u && (ev === "INITIAL_SESSION" || ev === "SIGNED_IN")) carregar(u.id, u.email ?? "", (u.user_metadata as { name?: string })?.name);
        else if (!u && (ev === "INITIAL_SESSION" || ev === "SIGNED_OUT")) {
          sbUser.current = null;
          dispatch({ type: "LOGOUT" });
          setSync("local-only");
        }
      }, 0);
    });
    return () => { cancel = true; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!supabase || !sbUser.current) return;
    const uid = sbUser.current;
    const corpo = paraNuvem(state);
    const json = JSON.stringify(corpo);
    if (json === lastSent.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      lastSent.current = json;
      supabase!.from("app_state").upsert({ user_id: uid, state: corpo, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).then(({ error }) => {
        if (error) { lastSent.current = ""; setSync("local-only"); } else setSync("synced");
      });
    }, 800);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [state, sync]);

  useEffect(() => {
    const tick = () => dispatch({ type: "ROLLOVER_DAY", today: todayISO() });
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.theme === "Escuro");
  }, [state.theme]);

  const value = useMemo(() => ({ state, dispatch, sync }), [state, sync]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore fora do StoreProvider");
  return c;
}
