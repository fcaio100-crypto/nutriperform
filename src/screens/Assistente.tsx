import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles, Trash2 } from "lucide-react";
import { useStore, vistoDe } from "../state/store";
import { useUi } from "../state/ui";
import { supabase } from "../lib/supabase";
import { aguaMetaL, fmtInt, intensidade, isoToDM, kcalEstimada, metasDoEstado, nowHM, totals, triagem } from "../lib/calc";
import { resumoTreino, treinoPlanejado, treinosDaData } from "../lib/plan";
import { AGENDA_PADRAO, DIAS_SEMANA, NIVEIS, progressoFuncional } from "../data/exercises";
import { FOODS, foodById } from "../data/foods";
import type { AppState } from "../lib/types";
import type { Action } from "../state/store";
import { cx } from "../components/ui";

interface Msg { papel: "usuario" | "assistente"; texto: string; erro?: boolean; id?: number; em?: string }
interface Linha { id: number; papel: "usuario" | "assistente"; texto: string; acoes: { nome: string; args: Record<string, unknown> }[]; aplicado: boolean; erro: boolean; criado_em: string }
const CHAVE = "nutriperform.chat.v2";
const ESPERA_MAX_MS = 3 * 60 * 1000;
const SUGESTOES = ["Monte meu treino de hoje", "O que comer antes do treino?", "Quanto ainda posso comer hoje?", "Fiz o treino de hoje", "Bebi 500 ml de água"];

function carregar(): Msg[] {
  try {
    const raw = localStorage.getItem(CHAVE);
    const d = raw ? JSON.parse(raw) : null;
    return d && Array.isArray(d.msgs) ? d.msgs : [];
  } catch {
    return [];
  }
}

/** Resumo do dia enviado ao assistente (metas, consumo, treino e ids para ações). */
function contexto(s: AppState) {
  const m = metasDoEstado(s);
  const t = totals(s.meals);
  const iso = vistoDe(s);
  const plano = treinoPlanejado(s, iso);
  const feitos = treinosDaData(s, iso);
  const tri = triagem(s.healthScreening, m.imc, s.profile.idade);
  const p = s.profile;
  const linhas = [
    `Data: ${iso}. Pessoa: ${p.nome || "—"}, ${p.idade} anos, ${p.sexo}, ${p.peso} kg, ${p.altura} cm, objetivo ${p.objetivo}, peso desejado ${p.pesoDesejado} kg.`,
    `Metas do dia: ${fmtInt(m.meta)} kcal, proteína ${fmtInt(m.proteina)} g, carboidrato ${fmtInt(m.carboidrato)} g, gordura ${fmtInt(m.gordura)} g, água ${aguaMetaL(s)} L.`,
    `Consumido: ${fmtInt(t.kcal)} kcal, proteína ${fmtInt(t.proteina)} g, carboidrato ${fmtInt(t.carbo)} g, gordura ${fmtInt(t.gordura)} g, água ${(s.waterMl / 1000).toFixed(2)} L.`,
    `Faltam: ${fmtInt(Math.max(0, m.meta - t.kcal))} kcal e ${fmtInt(Math.max(0, m.proteina - t.proteina))} g de proteína.`,
    `Treino planejado hoje: ${plano} (${resumoTreino(s, plano)}). Feitos hoje: ${feitos.map((w) => `${w.modalidade} ${w.duracaoMin} min`).join(", ") || "nenhum"}.`,
    `Semana de treino: ${[1, 2, 3, 4, 5, 6, 0].map((d) => `${DIAS_SEMANA[d]}=${(s.agenda ?? AGENDA_PADRAO)[String(d)]}`).join("; ")}.`,
    `Funcional em casa: nível ${progressoFuncional(s.workouts).nivel} de ${NIVEIS.length}. Tempo por treino: ${p.minutosPorTreino} min. Atividade: ${p.atividade}.`,
    `Últimos treinos: ${s.workouts.slice(0, 8).map((w) => `${w.data} ${w.modalidade} ${w.duracaoMin} min${w.sensacao ? ` (${w.sensacao})` : ""}`).join("; ") || "nenhum registrado"}.`,
    "Refeições do diário:",
    ...s.meals.map((ml) => `- ${ml.nome} ${ml.hora}: ${ml.items.map((i) => `${foodById(i.foodId).nome} ${i.qtdGramas} g`).join(", ") || "vazia"}`),
  ];
  if (tri.nivel === "vermelho") linhas.push("ALERTA DE SEGURANÇA: " + tri.motivos.join(" "));
  linhas.push(
    "",
    "IDS PARA AÇÕES:",
    `Refeições do diário (refeicao_id): ${s.meals.map((ml) => `${ml.id}=${ml.nome}`).join("; ")}`,
    `Sessão de treino de hoje (sessao): "unica" = ${plano}${feitos.some((w) => w.modalidade === plano) ? " (já feita)" : ""}`,
    `Alimentos do banco (alimento_id=nome, por 100 g): ${FOODS.map((f) => `${f.id}=${f.nome}`).join("; ")}`,
  );
  if (s.planoPersonalizadoAtivo && s.planoPersonalizado.length)
    linhas.push(`Refeições do plano: ${s.planoPersonalizado.map((r) => `ref-${r.id}=${r.nome} (${r.descricao})`).join("; ")}`);
  return linhas.join("\n");
}

/** Aplica no app as ações pedidas pelo assistente. Devolve um resumo do que foi feito. */
function aplicar(acoes: { nome: string; args: Record<string, unknown> }[], s: AppState, dispatch: React.Dispatch<Action>) {
  const feito: string[] = [];
  const dm = isoToDM(vistoDe(s));
  const n = (x: unknown) => Number(x) || 0;
  for (const a of acoes) {
    const g = a.args;
    if (a.nome === "registrar_agua" && n(g.ml) > 0) {
      dispatch({ type: "ADD_WATER", ml: n(g.ml) });
      feito.push(`+${n(g.ml)} ml de água`);
    } else if (a.nome === "registrar_peso" && n(g.kg) > 0) {
      const d = new Date();
      dispatch({ type: "ADD_WEIGHT", entry: { data: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`, peso: n(g.kg) } });
      feito.push(`peso ${n(g.kg)} kg`);
    } else if (a.nome === "registrar_alimento") {
      const meal = s.meals.find((m) => m.id === g.refeicao_id);
      const food = FOODS.find((f) => f.id === g.alimento_id);
      if (meal && food && n(g.gramas) > 0) {
        dispatch({ type: "ADD_MEAL_ITEM", mealId: meal.id, foodId: food.id, qtdGramas: Math.round(n(g.gramas)) });
        feito.push(`${food.nome} ${Math.round(n(g.gramas))} g no ${meal.nome.toLowerCase()}`);
      }
    } else if (a.nome === "registrar_treino" || a.nome === "concluir_sessao_treino") {
      const mod = a.nome === "registrar_treino" ? String(g.modalidade || "Treino") : treinoPlanejado(s, vistoDe(s));
      if (mod === "Descanso") continue;
      const min = n(g.duracao_min) || 45;
      const pse = g.intensidade === "Leve" ? 3 : g.intensidade === "Alta" ? 8 : 6;
      dispatch({ type: "ADD_WORKOUT", workout: { id: Date.now() + feito.length, modalidade: mod, data: dm, hora: nowHM(), duracaoMin: min, intensidade: intensidade(pse), distancia: n(g.distancia_km) ? `${n(g.distancia_km)} km` : "—", kcal: kcalEstimada(min, pse), pse } });
      feito.push(`${mod} ${min} min`);
    } else if (a.nome === "marcar_refeicao_plano" && g.consumida !== false) {
      const ids = Array.isArray(g.ids) ? g.ids.map(String) : [];
      for (const id of ids) {
        const r = s.planoPersonalizado.find((x) => `ref-${x.id}` === id);
        if (!r?.itens?.length) continue;
        const alvo = s.meals.find((x) => x.nome.toLowerCase().includes(r.nome.toLowerCase()) || r.nome.toLowerCase().includes(x.nome.toLowerCase())) ?? s.meals[0];
        dispatch({ type: "ADD_MEAL_ITEMS_BULK", mealId: alvo.id, itens: r.itens });
        feito.push(`${r.nome} do plano`);
      }
    }
  }
  return feito;
}

/** Negrito **x** e listas "- " simples. */
function Texto({ t }: { t: string }) {
  return (
    <>
      {t.split("\n").map((linha, i) => {
        const lista = /^\s*[-•*]\s+/.test(linha);
        const conteudo = linha.replace(/^\s*[-•*]\s+/, "");
        const partes = conteudo.split(/(\*\*[^*]+\*\*)/g).map((p, j) => (p.startsWith("**") && p.endsWith("**") ? <b key={j}>{p.slice(2, -2)}</b> : <Fragment key={j}>{p}</Fragment>));
        if (!linha.trim()) return <div key={i} className="h-2" />;
        return lista ? <div key={i} className="flex gap-2"><span>•</span><span>{partes}</span></div> : <div key={i}>{partes}</div>;
      })}
    </>
  );
}

export default function Assistente() {
  const { state, dispatch } = useStore();
  const { notify } = useUi();
  const [msgs, setMsgs] = useState<Msg[]>(carregar);
  const [texto, setTexto] = useState("");
  const [busy, setBusy] = useState(false);
  const fim = useRef<HTMLDivElement>(null);
  const estado = useRef(state);
  estado.current = state;
  const aplicando = useRef(new Set<number>());

  useEffect(() => {
    try { localStorage.setItem(CHAVE, JSON.stringify({ msgs: msgs.filter((m) => m.id).slice(-200) })); } catch { /* sem armazenamento */ }
    fim.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy]);

  /** Busca a conversa salva na nuvem, aplica ações pendentes e diz se ainda há resposta a caminho. */
  async function sincronizar(): Promise<boolean> {
    if (!supabase) return false;
    const { data, error } = await supabase.from("assistente_conversa").select("id,papel,texto,acoes,aplicado,erro,criado_em").order("id", { ascending: false }).limit(200);
    if (error || !data) return false;
    const linhas = (data as Linha[]).reverse();
    const feitos: string[] = [];
    for (const l of linhas) {
      if (l.papel !== "assistente" || l.aplicado || !l.acoes?.length || aplicando.current.has(l.id)) continue;
      aplicando.current.add(l.id);
      // marca antes de aplicar: se dois aparelhos abrirem juntos, só um aplica
      const { data: ok } = await supabase.from("assistente_conversa").update({ aplicado: true }).eq("id", l.id).eq("aplicado", false).select("id");
      if (ok?.length) feitos.push(...aplicar(l.acoes, estado.current, dispatch));
    }
    if (feitos.length) notify("Feito: " + feitos.join(", "));
    setMsgs((atual) => {
      const locais = atual.filter((m) => !m.id && m.erro); // erros de conexão deste aparelho
      const nuvem: Msg[] = linhas.map((l) => ({
        id: l.id, em: l.criado_em, papel: l.papel, erro: l.erro,
        texto: l.papel === "assistente" && !l.texto.trim() && l.acoes?.length ? "Pronto! Registrei o que você pediu." : l.texto,
      }));
      return [...nuvem, ...locais];
    });
    const ult = linhas[linhas.length - 1];
    return !!ult && ult.papel === "usuario" && Date.now() - new Date(ult.criado_em).getTime() < ESPERA_MAX_MS;
  }

  const acompanhar = useRef<() => void>(() => {});
  // ao abrir e ao voltar para o app: pega respostas que chegaram enquanto estava fora
  useEffect(() => {
    let vivo = true;
    let timer = 0;
    const ciclo = async () => {
      clearTimeout(timer);
      const pendente = await sincronizar().catch(() => false);
      if (!vivo) return;
      setBusy((b) => (pendente ? true : b && enviando.current));
      if (pendente) timer = window.setTimeout(ciclo, 3000);
    };
    acompanhar.current = ciclo;
    ciclo();
    const aoVoltar = () => { if (document.visibilityState === "visible") { clearTimeout(timer); ciclo(); } };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => { vivo = false; clearTimeout(timer); document.removeEventListener("visibilitychange", aoVoltar); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enviando = useRef(false);
  async function enviar(pergunta: string) {
    const q = pergunta.trim();
    if (!q || busy) return;
    const historico: Msg[] = [...msgs.filter((m) => !m.erro), { papel: "usuario", texto: q }];
    setMsgs([...msgs.filter((m) => m.id || !m.erro), { papel: "usuario", texto: q }]);
    setTexto("");
    if (!supabase) {
      setMsgs((x) => [...x, { papel: "assistente", texto: "O assistente funciona no app publicado (nutriperform.vercel.app), com a sua conta.", erro: true }]);
      return;
    }
    setBusy(true);
    enviando.current = true;
    try {
      const { error } = await supabase.functions.invoke("assistente", { body: { mensagens: historico.map(({ papel, texto }) => ({ papel, texto })), contexto: contexto(estado.current) } });
      if (error) {
        let erro = "";
        try { erro = (await (error as { context?: Response }).context?.json())?.erro ?? ""; } catch { /* sem corpo */ }
        // a resposta pode ter sido gerada mesmo assim (ex.: app foi para segundo plano)
        if (!erro && (await sincronizar().catch(() => false))) { setTimeout(() => acompanhar.current(), 0); return; }
        if (erro) { await sincronizar().catch(() => false); if (erro.includes("limite de")) setMsgs((x) => [...x, { papel: "assistente", texto: erro, erro: true }]); return; }
        throw new Error("Sem conexão com o assistente. Sua pergunta fica salva: abra o app de novo em instantes.");
      }
      await sincronizar();
    } catch (e) {
      setMsgs((x) => [...x, { papel: "assistente", texto: (e as Error).message, erro: true }]);
    } finally {
      enviando.current = false;
      setBusy(false);
    }
  }

  async function limparTudo() {
    setMsgs([]);
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id;
      if (uid) await supabase.from("assistente_conversa").delete().eq("user_id", uid);
    }
  }

  return (
    <div className="flex flex-col gap-4 min-h-[calc(100vh-150px)]">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[13px] text-ink-mute font-semibold">Pergunte sobre o seu dia</span>
          <h1 className="font-extrabold text-[26px] tracking-tight leading-tight">Assistente</h1>
        </div>
        {msgs.length > 0 && (
          <button type="button" onClick={() => { if (confirm("Apagar todo o histórico do chat?")) limparTudo(); }} className="flex items-center gap-1.5 text-[12.5px] font-bold text-ink-mute py-2"><Trash2 size={15} /> Limpar</button>
        )}
      </div>

      {msgs.length === 0 && (
        <div className="flex flex-col items-center text-center gap-3 py-6 px-2">
          <span className="w-14 h-14 rounded-2xl bg-brand-soft dark:bg-brand-softDark text-brand flex items-center justify-center"><Sparkles size={26} /></span>
          <span className="font-bold text-[16px]">Como posso ajudar hoje?</span>
          <span className="text-[13px] text-ink-mute leading-relaxed max-w-[320px]">Treino e alimentação juntos: monto treinos, digo o que comer antes e depois e acompanho suas metas. Também lanço comida, água, peso e treinos por você — é só me contar.</span>
        </div>
      )}

      <div className="flex flex-col gap-3 flex-1">
        {msgs.map((m, i) => (
          <div key={i} className={cx("max-w-[86%] px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed", m.papel === "usuario" ? "self-end bg-brand text-white rounded-br-md" : m.erro ? "self-start bg-[#FBE6EA] text-danger dark:bg-[#33141B] rounded-bl-md" : "self-start glass rounded-bl-md")}>
            {m.papel === "usuario" ? m.texto : <Texto t={m.texto} />}
          </div>
        ))}
        {busy && (
          <div className="self-start px-4 py-3 rounded-2xl rounded-bl-md glass flex gap-1.5">
            {[0, 1, 2].map((d) => <span key={d} className="w-2 h-2 rounded-full bg-ink-mute animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />)}
          </div>
        )}
        <div ref={fim} />
      </div>

      <div className="sticky bottom-28 flex flex-col gap-2 pt-2">
        {msgs.length === 0 && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4">
            {SUGESTOES.map((s) => (
              <button key={s} type="button" onClick={() => enviar(s)} className="glass glass-press px-3.5 py-2 rounded-full text-[12.5px] font-semibold whitespace-nowrap flex-none">{s}</button>
            ))}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); enviar(texto); }} className="flex items-end gap-2">
          <label className="sr-only" htmlFor="pergunta">Sua pergunta</label>
          <textarea
            id="pergunta"
            rows={1}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(texto); } }}
            placeholder="Ex.: comi 2 pães de queijo no lanche"
            className="flex-1 resize-none max-h-32 px-4 py-3 rounded-[24px] glass text-[14px] outline-none focus:border-brand"
          />
          <button type="submit" disabled={busy || !texto.trim()} aria-label="Enviar" className="glass-press w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center flex-none disabled:opacity-40 shadow-[0_6px_18px_rgba(30,142,90,.35)]">
            <ArrowUp size={20} />
          </button>
        </form>
        <span className="text-[10.5px] text-ink-mute text-center">Orientação geral — não substitui médico ou nutricionista.</span>
      </div>
    </div>
  );
}
