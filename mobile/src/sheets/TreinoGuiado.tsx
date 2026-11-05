import { useState, type ReactNode } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Check } from "lucide-react-native";
import { useStore } from "../state/store";
import { useUi } from "../state/ui";
import { COM_DISTANCIA, DURACAO_PADRAO, FUNC_META, FUNC_MOD, MOBILIDADE, NIVEIS, blocosFuncional, progressoFuncional, type Item } from "../data/exercises";
import { diaMusculacao } from "../lib/plan";
import { intensidade, isoToDM, kcalEstimada, nowHM } from "../lib/calc";
import type { Workout } from "../lib/types";
import { BRAND, useTheme } from "../theme";
import { FundoVivo, Glass } from "../components/Glass";
import { Aviso, Bar, Button, Card, Chips, Col, ExerciseRow, Field, Input, Muted, Row, Segmented, Slider, T } from "../components/ui";

/** Tela cheia: o treino do dia, passo a passo. */
export default function TreinoGuiado() {
  const { treino, close } = useUi();
  const t = useTheme();
  const ins = useSafeAreaInsets();
  if (!treino) return null;
  const { mod, date } = treino;
  const lista = mod === FUNC_MOD || mod === "Mobilidade" || mod === "Musculação";
  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
      <View style={{ flex: 1 }}>
        <FundoVivo />
        <View style={{ paddingTop: ins.top + 8, paddingHorizontal: 16, paddingBottom: 4 }}>
          <Pressable onPress={close} hitSlop={10} style={{ alignSelf: "flex-start" }}>
            <Glass radius={999} interactive style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9 }}>
              <ArrowLeft size={18} color={t.soft} /><T size={13.5} w={700} color={t.soft}>Voltar</T>
            </Glass>
          </Pressable>
        </View>
        {lista ? <ComLista mod={mod} date={date} /> : <Atividade mod={mod} date={date} />}
      </View>
    </Modal>
  );
}

function Titulo({ titulo, sub }: { titulo: string; sub: string }) {
  return (
    <Col gap={2}>
      <T size={30} w={800} style={{ letterSpacing: -0.6, lineHeight: 36 }}>{titulo}</T>
      <Muted size={13}>{sub}</Muted>
    </Col>
  );
}

function ComLista({ mod, date }: { mod: string; date: string }) {
  const { state, dispatch } = useStore();
  const { notify, openShare } = useUi();
  const t = useTheme();
  const ins = useSafeAreaInsets();
  const [feito, setFeito] = useState<Record<string, boolean>>({});
  const [diaIdx, setDiaIdx] = useState<number | undefined>(undefined);
  const [fora, setFora] = useState<Record<string, boolean>>({});
  const [sensacao, setSensacao] = useState<"Fácil" | "Na medida" | "Difícil">("Na medida");

  let titulo = mod;
  let sub = "";
  let min = 10;
  let secoes: { titulo: string; dica?: string; itens: Item[] }[] = [];
  let topo: ReactNode = null;
  let nivel: number | undefined;

  if (mod === FUNC_MOD) {
    const P = progressoFuncional(state.workouts);
    const N = NIVEIS[P.nivel - 1];
    titulo = "Funcional em casa";
    sub = `Nível ${N.n} · ${N.nome} · ~${N.min} min`;
    min = N.min;
    nivel = N.n;
    const blocos = blocosFuncional(N);
    const escolhidos = blocos.filter((b) => !fora[b.id]);
    secoes = escolhidos.map((b, i) => ({ titulo: `${i + 1}. ${b.titulo} · ${b.tempo}`, dica: b.dica, itens: b.itens }));
    if (escolhidos.length < blocos.length) {
      min = Math.max(5, Math.round((N.min * escolhidos.length) / blocos.length));
      sub = `Nível ${N.n} · ${N.nome} · ~${min} min`;
    }
    topo = (
      <Col gap={8}>
        <T size={12} w={700} color={t.mute}>Partes do treino (toque para tirar ou incluir)</T>
        <Row gap={6} wrap>
          {blocos.map((b) => (
            <Pressable key={b.id} onPress={() => { setFora((x) => ({ ...x, [b.id]: !x[b.id] })); setFeito({}); }} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: fora[b.id] ? t.raised : BRAND }}>
              <T size={12} w={600} color={fora[b.id] ? t.mute : "#fff"} strike={!!fora[b.id]}>{b.titulo}</T>
            </Pressable>
          ))}
        </Row>
        <Bar pct={P.max ? 100 : (P.pts / FUNC_META) * 100} />
        <Muted size={11.5}>{P.max ? "Nível máximo." : `${P.pts} de ${FUNC_META} treinos para subir de nível`}</Muted>
      </Col>
    );
  } else if (mod === "Mobilidade") {
    titulo = "Mobilidade";
    sub = "~10 min · movimentos lentos, sem dor";
    secoes = [{ titulo: "Rotina", itens: MOBILIDADE }];
  } else {
    const d = diaMusculacao(state, diaIdx);
    titulo = "Musculação";
    min = state.profile.minutosPorTreino || 60;
    if (d) {
      sub = `${d.titulo} · ${d.exercicios.length} exercícios`;
      secoes = [{ titulo: d.foco || d.titulo, itens: d.exercicios.map((e) => [e.nome, `${e.series}×${e.repeticoes}`] as Item) }];
      if (d.total > 1) topo = <Chips small value={d.indice} onChange={(v) => { setDiaIdx(v); setFeito({}); }} options={d.todos.map((_, i) => ({ v: i, label: `Treino ${String.fromCharCode(65 + i)}` }))} />;
    } else sub = "Sem rotina cadastrada";
  }

  const total = secoes.reduce((s, x) => s + x.itens.length, 0);
  const marcados = Object.values(feito).filter(Boolean).length;

  function concluir() {
    const pse = sensacao === "Fácil" ? 4 : sensacao === "Na medida" ? 6 : 8;
    const w: Workout = {
      id: Date.now(), modalidade: mod, data: isoToDM(date), dataISO: date, hora: nowHM(), duracaoMin: min, intensidade: intensidade(pse),
      distancia: "—", kcal: mod === FUNC_MOD ? Math.round(min * 7.6) : kcalEstimada(min, pse), pse, sensacao, nivel,
    };
    dispatch({ type: "ADD_WORKOUT", workout: w });
    if (mod === FUNC_MOD) {
      const depois = progressoFuncional([w, ...state.workouts]);
      notify(
        depois.ultimo === "subiu" ? `Subiu para o Nível ${depois.nivel} — ${NIVEIS[depois.nivel - 1].nome}! 🎉`
        : depois.ultimo === "desceu" ? `Voltamos ao Nível ${depois.nivel} para consolidar.`
        : depois.max ? "Treino feito! Nível máximo." : `Treino feito! Faltam ${FUNC_META - depois.pts} para subir de nível.`,
      );
    } else notify(`${titulo} feito ✓`);
    openShare(w);
  }

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 16 }}>
        <Titulo titulo={titulo} sub={sub} />
        {topo}
        <Muted size={12}>Marque cada exercício ao terminar. Toque no nome para ver como fazer e o vídeo.</Muted>
        {secoes.map((s) => (
          <Col key={s.titulo} gap={6}>
            <T size={12} w={700} color={t.mute} upper track={0.5} style={{ marginTop: 4, paddingHorizontal: 4 }}>{s.titulo}</T>
            <Card pad={16} gap={0}>
              {s.itens.map(([nome, qtd], j) => {
                const k = s.titulo + j;
                return <ExerciseRow key={k} nome={nome} qtd={qtd} done={!!feito[k]} last={j === s.itens.length - 1} onToggle={() => setFeito((x) => ({ ...x, [k]: !x[k] }))} />;
              })}
            </Card>
          </Col>
        ))}
      </ScrollView>
      {/* barra de conclusão flutuante em vidro */}
      <Glass radius={30} style={{ marginHorizontal: 10, marginBottom: Math.max(ins.bottom, 10), padding: 16, gap: 10 }}>
        <Row between>
          <T size={14.5} w={700}>Como foi o treino?</T>
          <T size={12} mono color={t.mute}>{marcados}/{total} exercícios</T>
        </Row>
        <Segmented value={sensacao} onChange={setSensacao} options={[["Fácil", "Fácil"], ["Na medida", "Na medida"], ["Difícil", "Difícil"]]} />
        <Button size="lg" icon={<Check size={18} strokeWidth={3} color="#fff" />} onPress={concluir}>Concluir treino</Button>
        {mod === FUNC_MOD ? <Muted size={11}>Fácil ou Na medida contam ponto para subir de nível. Dois Difícil seguidos voltam um nível.</Muted> : null}
      </Glass>
    </>
  );
}

function Atividade({ mod, date }: { mod: string; date: string }) {
  const { dispatch } = useStore();
  const { openShare, notify } = useUi();
  const ins = useSafeAreaInsets();
  const [min, setMin] = useState(DURACAO_PADRAO[mod] ?? 45);
  const [pse, setPse] = useState(6);
  const [dist, setDist] = useState("");
  const temDist = COM_DISTANCIA.includes(mod);

  function salvar() {
    const w: Workout = { id: Date.now(), modalidade: mod, data: isoToDM(date), dataISO: date, hora: nowHM(), duracaoMin: min, intensidade: intensidade(pse), distancia: temDist && dist.trim() ? dist.trim() : "—", kcal: kcalEstimada(min, pse), pse };
    dispatch({ type: "ADD_WORKOUT", workout: w });
    notify(`${mod} registrado ✓`);
    openShare(w);
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: ins.bottom + 24, gap: 18 }}>
      <Titulo titulo={mod} sub="Quando terminar, registre aqui." />
      {mod === "Corrida" ? <Aviso>Corra num ritmo em que dá para conversar. Aumente no máximo 10% do volume por semana e intercale com caminhada se precisar.</Aviso> : null}
      {mod === "Futebol" || mod === "Beach tennis" ? <Aviso>Antes do jogo: 8–10 min de aquecimento (trote, skipping, afundos andando, deslocamento lateral). Leve água: +500 a 750 ml por hora.</Aviso> : null}
      <Card pad={18} gap={16}>
        <Field label="Quanto tempo durou?"><Chips value={min} onChange={setMin} options={[20, 30, 45, 60, 90].map((n) => ({ v: n, label: `${n} min` }))} /></Field>
        {temDist ? <Field label="Distância (opcional)"><Input value={dist} onChangeText={setDist} placeholder="Ex.: 5 km" /></Field> : null}
        <Field label={`Esforço: ${pse}/10 · ${intensidade(pse)}`}><Slider min={1} max={10} value={pse} onChange={setPse} /></Field>
      </Card>
      <Button size="lg" onPress={salvar}>{`Registrar ${mod.toLowerCase()} · ≈ ${kcalEstimada(min, pse)} kcal`}</Button>
    </ScrollView>
  );
}
