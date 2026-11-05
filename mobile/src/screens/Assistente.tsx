import { useEffect, useRef, useState } from "react";
import { Alert, AppState as RNAppState, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ArrowUp, Sparkles, Trash2 } from "lucide-react-native";
import { useStore, vistoDe } from "../state/store";
import { useUi } from "../state/ui";
import { supabase } from "../lib/supabase";
import { aguaMetaL, fmtInt, intensidade, isoToDM, kcalEstimada, metasDoEstado, nowHM, totals, triagem } from "../lib/calc";
import { resumoTreino, treinoPlanejado, treinosDaData } from "../lib/plan";
import { AGENDA_PADRAO, DIAS_SEMANA, NIVEIS, progressoFuncional } from "../data/exercises";
import { FOODS, foodById } from "../data/foods";
import type { AppState } from "../lib/types";
import type { Action } from "../state/store";
import { BRAND, DANGER, fonte, useTheme } from "../theme";
import { Glass, GlassGroup } from "../components/Glass";
import { B, Col, Row, T } from "../components/ui";

interface Msg { papel: "usuario" | "assistente"; texto: string; erro?: boolean; id?: number; em?: string }
interface Linha { id: number; papel: "usuario" | "assistente"; texto: string; acoes: { nome: string; args: Record<string, unknown> }[]; aplicado: boolean; erro: boolean; criado_em: string }
const CHAVE = "nutriperform.chat.v2";
const ESPERA_MAX_MS = 3 * 60 * 1000;
const SUGESTOES = ["Monte meu treino de hoje", "O que comer antes do treino?", "Quanto ainda posso comer hoje?", "Fiz o treino de hoje", "Bebi 500 ml de água"];

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
function Texto({ t, cor }: { t: string; cor: string }) {
  return (
    <Col gap={2}>
      {t.split("\n").map((linha, i) => {
        const lista = /^\s*[-•*]\s+/.test(linha);
        const conteudo = linha.replace(/^\s*[-•*]\s+/, "");
        const partes = conteudo.split(/(\*\*[^*]+\*\*)/g).map((p, j) => (p.startsWith("**") && p.endsWith("**") ? <B key={j}>{p.slice(2, -2)}</B> : p));
        if (!linha.trim()) return <View key={i} style={{ height: 6 }} />;
        return lista ? (
          <Row key={i} gap={8} style={{ alignItems: "flex-start" }}><T size={14} color={cor}>•</T><T size={14} color={cor} style={{ flex: 1 }}>{partes}</T></Row>
        ) : (
          <T key={i} size={14} color={cor}>{partes}</T>
        );
      })}
    </Col>
  );
}

function Pontos() {
  const [n, setN] = useState(0);
  useEffect(() => { const id = setInterval(() => setN((x) => (x + 1) % 3), 350); return () => clearInterval(id); }, []);
  const t = useTheme();
  return <Row gap={6}>{[0, 1, 2].map((d) => <View key={d} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.mute, opacity: d === n ? 1 : 0.35 }} />)}</Row>;
}

export default function Assistente() {
  const { state, dispatch } = useStore();
  const { notify } = useUi();
  const t = useTheme();
  const ins = useSafeAreaInsets();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [busy, setBusy] = useState(false);
  const lista = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const estado = useRef(state);
  estado.current = state;
  const aplicando = useRef(new Set<number>());
  const enviando = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(CHAVE).then((raw) => {
      const d = raw ? JSON.parse(raw) : null;
      if (d && Array.isArray(d.msgs)) setMsgs((atual) => (atual.length ? atual : d.msgs));
    }).catch(() => {});
  }, []);
  useEffect(() => {
    AsyncStorage.setItem(CHAVE, JSON.stringify({ msgs: msgs.filter((m) => m.id).slice(-200) })).catch(() => {});
    setTimeout(() => lista.current?.scrollToEnd({ animated: true }), 60);
  }, [msgs, busy]);

  /** Busca a conversa salva na nuvem, aplica ações pendentes e diz se ainda há resposta a caminho. */
  async function sincronizar(): Promise<boolean> {
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
      const locais = atual.filter((m) => !m.id && m.erro);
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
  useEffect(() => {
    let vivo = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ciclo = async () => {
      if (timer) clearTimeout(timer);
      const pendente = await sincronizar().catch(() => false);
      if (!vivo) return;
      setBusy((b) => (pendente ? true : b && enviando.current));
      if (pendente) timer = setTimeout(ciclo, 3000);
    };
    acompanhar.current = ciclo;
    ciclo();
    const s = RNAppState.addEventListener("change", (x) => { if (x === "active") ciclo(); });
    return () => { vivo = false; if (timer) clearTimeout(timer); s.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enviar(pergunta: string) {
    const q = pergunta.trim();
    if (!q || busy) return;
    const historico: Msg[] = [...msgs.filter((m) => !m.erro), { papel: "usuario", texto: q }];
    setMsgs([...msgs.filter((m) => m.id || !m.erro), { papel: "usuario", texto: q }]);
    setTexto("");
    setBusy(true);
    enviando.current = true;
    try {
      const { error } = await supabase.functions.invoke("assistente", { body: { mensagens: historico.map(({ papel, texto }) => ({ papel, texto })), contexto: contexto(estado.current) } });
      if (error) {
        let erro = "";
        try { erro = (await (error as { context?: Response }).context?.json())?.erro ?? ""; } catch { /* sem corpo */ }
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
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (uid) await supabase.from("assistente_conversa").delete().eq("user_id", uid);
  }

  const baseBarra = Math.max(ins.bottom - 6, 12) + 76;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={-baseBarra + 12}>
      <ScrollView ref={lista} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: ins.top + 12, paddingHorizontal: 16, paddingBottom: 24, gap: 12, flexGrow: 1 }}>
        <Row between style={{ alignItems: "flex-end" }}>
          <Col gap={0}>
            <T size={13} w={600} color={t.mute}>Pergunte sobre o seu dia</T>
            <T size={30} w={800} style={{ letterSpacing: -0.6, lineHeight: 36 }}>Assistente</T>
          </Col>
          {msgs.length > 0 ? (
            <Pressable hitSlop={8} onPress={() => Alert.alert("Apagar todo o histórico do chat?", undefined, [{ text: "Cancelar", style: "cancel" }, { text: "Apagar", style: "destructive", onPress: limparTudo }])}>
              <Row gap={6}><Trash2 size={15} color={t.mute} /><T size={12.5} w={700} color={t.mute}>Limpar</T></Row>
            </Pressable>
          ) : null}
        </Row>

        {msgs.length === 0 ? (
          <Col gap={12} style={{ alignItems: "center", paddingVertical: 28, paddingHorizontal: 8 }}>
            <Glass radius={20} tint="rgba(30,142,90,0.2)" style={{ width: 60, height: 60, alignItems: "center", justifyContent: "center" }}><Sparkles size={26} color={BRAND} /></Glass>
            <T size={17} w={700}>Como posso ajudar hoje?</T>
            <T size={13} color={t.mute} center>Treino e alimentação juntos: monto treinos, digo o que comer antes e depois e acompanho suas metas. Também lanço comida, água, peso e treinos por você — é só me contar.</T>
          </Col>
        ) : null}

        {msgs.map((m, i) => {
          const eu = m.papel === "usuario";
          if (eu)
            return (
              <View key={i} style={{ alignSelf: "flex-end", maxWidth: "86%", paddingHorizontal: 16, paddingVertical: 11, borderRadius: 22, borderBottomRightRadius: 6, backgroundColor: BRAND }}>
                <T size={14} color="#fff">{m.texto}</T>
              </View>
            );
          if (m.erro)
            return (
              <View key={i} style={{ alignSelf: "flex-start", maxWidth: "86%", paddingHorizontal: 16, paddingVertical: 11, borderRadius: 22, borderBottomLeftRadius: 6, backgroundColor: t.dangerSoft }}>
                <T size={14} color={DANGER}>{m.texto}</T>
              </View>
            );
          return (
            <Glass key={i} radius={22} style={{ alignSelf: "flex-start", maxWidth: "86%", paddingHorizontal: 16, paddingVertical: 11 }}>
              <Texto t={m.texto} cor={t.ink} />
            </Glass>
          );
        })}
        {busy ? <Glass radius={22} style={{ alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 14 }}><Pontos /></Glass> : null}
      </ScrollView>

      <View style={{ paddingHorizontal: 12, paddingBottom: baseBarra, paddingTop: 6, gap: 8 }}>
        {msgs.length === 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 6, paddingHorizontal: 4 }}>
            {SUGESTOES.map((s) => (
              <Pressable key={s} onPress={() => enviar(s)}>
                <Glass radius={999} interactive style={{ paddingHorizontal: 14, paddingVertical: 9 }}><T size={12.5} w={600}>{s}</T></Glass>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        <GlassGroup spacing={10}>
          <Row gap={8} style={{ alignItems: "flex-end" }}>
            <Glass radius={24} style={{ flex: 1, paddingHorizontal: 16, paddingVertical: Platform.OS === "ios" ? 12 : 4, minHeight: 48, justifyContent: "center" }}>
              <TextInput
                value={texto}
                onChangeText={setTexto}
                placeholder="Ex.: comi 2 pães de queijo no lanche"
                placeholderTextColor={t.mute}
                multiline
                style={{ fontSize: 15, fontFamily: fonte(500), color: t.ink, maxHeight: 120 }}
                accessibilityLabel="Sua pergunta"
              />
            </Glass>
            <Pressable disabled={busy || !texto.trim()} onPress={() => enviar(texto)} accessibilityLabel="Enviar" style={{ opacity: busy || !texto.trim() ? 0.4 : 1 }}>
              <Glass radius={24} interactive tint={BRAND} style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
                <ArrowUp size={21} color="#fff" />
              </Glass>
            </Pressable>
          </Row>
        </GlassGroup>
        <T size={10.5} color={t.mute} center>Orientação geral — não substitui médico ou nutricionista.</T>
      </View>
    </KeyboardAvoidingView>
  );
}
