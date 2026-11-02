import type { AppState, PlanMeal } from "./types";
import { aguaMetaL, gerarPlano, metasDoEstado } from "./calc";
import { treinoPlanejado, resumoTreino } from "./plan";
import { AGENDA_PADRAO } from "../data/exercises";
import { supabase } from "./supabase";

/** Chave pública VAPID (a privada fica só no Supabase). */
const VAPID_PUBLIC =
  (import.meta.env.VITE_VAPID_PUBLIC as string | undefined) ??
  "BHQ8W30ediXuLoNhEVpqpT-xubkjC3yQkLKRZq_WDl_LBeN0gKjsrR6pDnpBbN-uLCyV_h1zwaNsJxzfldkDwE0";
const FLAG = "nutriperform.push";

export interface ItemAgenda {
  id: string;
  dia: number;
  min: number;
  tipo: "refeicao" | "treino" | "agua";
  titulo: string;
  corpo: string;
  tela: string;
  metaMl?: number;
}

// ===== Ambiente =====
export const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const ehAndroid = () => /android/i.test(navigator.userAgent);
export const instalado = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
export const suportaPush = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
export const permissao = (): NotificationPermission | "indisponivel" => (suportaPush() ? Notification.permission : "indisponivel");
export function ativoNesteAparelho() {
  try { return localStorage.getItem(FLAG) === "1" && permissao() === "granted"; } catch { return false; }
}

// ===== Agenda de lembretes (o servidor dispara; o app só monta a lista) =====
const minDe = (hora: string) => {
  const [h, m] = hora.split(":").map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
};
const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const litros = (ml: number) => (ml / 1000).toFixed(1).replace(".", ",");

export function planoAtual(s: AppState): PlanMeal[] {
  if (s.planoPersonalizadoAtivo && s.planoPersonalizado.length) return s.planoPersonalizado;
  return gerarPlano(metasDoEstado(s).meta);
}

export function montarAgenda(s: AppState): ItemAgenda[] {
  const itens: ItemAgenda[] = [];
  const plano = planoAtual(s);
  const metaMl = Math.round(aguaMetaL(s) * 1000);
  const doses = 12;
  const dose = Math.max(150, Math.round(metaMl / doses / 50) * 50);
  const hoje = new Date();

  for (let dia = 0; dia < 7; dia++) {
    // data do próximo "dia" da semana, para pegar trocas pontuais de treino
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + ((dia - hoje.getDay() + 7) % 7));
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const mod = treinoPlanejado(s, iso) || (s.agenda ?? AGENDA_PADRAO)[String(dia)];

    for (const r of plano) {
      if (!r.hora) continue;
      itens.push({
        id: `ref-${r.id}`, dia, min: minDe(r.hora), tipo: "refeicao", tela: "hoje",
        titulo: `🍽️ ${r.nome} — ${r.hora}`,
        corpo: [r.descricao, r.kcal ? `~${Math.round(r.kcal)} kcal` : "", r.substituicao ? `Troca: ${r.substituicao}.` : ""].filter(Boolean).join(" · "),
      });
    }

    if (mod && mod !== "Descanso") {
      itens.push({
        id: "treino", dia, min: 17 * 60 + 30, tipo: "treino", tela: "hoje",
        titulo: `🏋️ Treino de hoje — ${mod}`,
        corpo: `${resumoTreino(s, mod)}. Leve ~500 ml de água.`,
      });
    }

    // água: de 07:00 às 21:30, espaçada igualmente
    const ini = 7 * 60, fim = 21 * 60 + 30, passo = Math.round((fim - ini) / (doses - 1));
    for (let i = 0; i < doses; i++) {
      itens.push({
        id: `agua-${i}`, dia, min: ini + i * passo, tipo: "agua", tela: "hoje", metaMl,
        titulo: `💧 Hora de beber água — ${dose} ml`,
        corpo: `Meta de hoje: ${litros(metaMl)} L.`,
      });
    }
  }
  return itens.sort((a, b) => a.dia - b.dia || a.min - b.min);
}

export const resumoAgenda = (s: AppState) => {
  const plano = planoAtual(s).filter((r) => r.hora);
  return `${plano.length} refeições, treino às ${hhmm(17 * 60 + 30)} e 12 lembretes de água por dia`;
};

/** Salva a agenda no servidor (só quando as notificações estão ativas neste aparelho). */
export async function salvarAgenda(s: AppState) {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Fortaleza";
  await supabase.from("notification_prefs").upsert({ user_id: uid, ativo: true, tz, agenda: montarAgenda(s), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
}

// ===== Inscrição =====
function chaveBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export async function ativar(s: AppState): Promise<string | null> {
  if (!supabase) return "Notificações só funcionam no app publicado.";
  if (!suportaPush()) return ehIOS() && !instalado() ? "No iPhone, instale o app na Tela de Início primeiro (passo a passo acima)." : "Este navegador não aceita notificações.";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return "Permissão negada. Libere em Ajustes › Notificações › NutriPerform.";
  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;
  // sempre cria uma inscrição nova (a antiga pode ter ficado "muda" após atualização do iPhone)
  const antiga = await reg.pushManager.getSubscription();
  if (antiga) {
    await supabase.rpc("remover_push", { p_endpoint: antiga.endpoint });
    await antiga.unsubscribe().catch(() => {});
  }
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveBytes(VAPID_PUBLIC) });
  const j = sub.toJSON();
  const { error } = await supabase.rpc("registrar_push", { p_endpoint: sub.endpoint, p_p256dh: j.keys?.p256dh, p_auth: j.keys?.auth, p_user_agent: navigator.userAgent });
  if (error) return "Não consegui registrar este aparelho. Tente de novo.";
  try { localStorage.setItem(FLAG, "1"); } catch { /* ok */ }
  await salvarAgenda(s);
  return null;
}

export async function desativar() {
  try { localStorage.removeItem(FLAG); } catch { /* ok */ }
  if (!supabase || !suportaPush()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await supabase.rpc("remover_push", { p_endpoint: sub.endpoint });
    await sub.unsubscribe().catch(() => {});
  }
}

export async function testar(): Promise<string> {
  if (!supabase) return "Indisponível aqui.";
  const { data, error } = await supabase.functions.invoke("lembretes", { body: { teste: true } });
  if (error) return "Falha ao enviar o teste.";
  const r = data as { enviados?: number; aparelhos?: number };
  return r.enviados ? "Teste enviado! Deve chegar em alguns segundos." : "Nenhum aparelho ativo. Toque em Ativar notificações.";
}
