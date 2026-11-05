import { useState } from "react";
import { Pressable, Share, StyleSheet, View } from "react-native";
import { Share2, Trash2, X } from "lucide-react-native";
import { useStore } from "../../state/store";
import { treinoSugerido } from "../../data/exercises";
import { BRAND, useTheme } from "../../theme";
import { Button, Card, Chips, Col, Collapse, Field, Input, Muted, Row, SectionLabel, T } from "../../components/ui";

export default function Musculacao() {
  const { state, dispatch } = useStore();
  const t = useTheme();
  const p = state.profile;
  const proprio = state.treinoPersonalizadoAtivo;
  const sugerido = treinoSugerido(p.objetivo, p.diasTreinoSemana, p.minutosPorTreino);

  function compartilhar() {
    const dias = proprio ? state.treinoPersonalizado : sugerido;
    const txt = dias.map((d) => `${d.dia}${d.foco ? ` · ${d.foco}` : ""}\n${d.exercicios.map((e) => `• ${e.nome} — ${e.series}x${e.repeticoes}`).join("\n")}`).join("\n\n");
    Share.share({ message: `Rotina de treino — ${p.nome || "NutriPerform"}\n\n${txt}` }).catch(() => {});
  }

  return (
    <>
      <Card pad={16}>
        <Field label="De onde vem a sua rotina">
          <Chips value={proprio ? "p" : "a"} onChange={(v) => dispatch({ type: "SET_TREINO_PERSONALIZADO_ATIVO", ativo: v === "p" })} options={[{ v: "a", label: "Sugestão do app" }, { v: "p", label: "Meu personal" }]} />
        </Field>
        {!proprio ? (
          <>
            <Field label="Dias por semana"><Chips small value={p.diasTreinoSemana} onChange={(v) => dispatch({ type: "UPDATE_PROFILE", patch: { diasTreinoSemana: v } })} options={[1, 2, 3, 4, 5, 6].map((n) => ({ v: n, label: String(n) }))} /></Field>
            <Field label="Minutos por sessão"><Chips small value={p.minutosPorTreino} onChange={(v) => dispatch({ type: "UPDATE_PROFILE", patch: { minutosPorTreino: v } })} options={[30, 45, 60, 75, 90, 120].map((n) => ({ v: n, label: String(n) }))} /></Field>
          </>
        ) : null}
      </Card>

      <SectionLabel action={<Pressable onPress={compartilhar} hitSlop={8}><Row gap={4}><Share2 size={14} color={BRAND} /><T size={12} w={700} color={BRAND}>Enviar</T></Row></Pressable>}>
        {proprio ? "Rotina do meu personal" : `Divisão sugerida · ${p.objetivo}`}
      </SectionLabel>

      {proprio ? <RotinaPropria /> : sugerido.map((d, i) => (
        <Collapse key={i} title={`${d.dia} · ${d.foco}`} subtitle={`${d.exercicios.length} exercícios`} defaultOpen={i === 0}>
          <Col gap={0}>
            {d.exercicios.map((e, j) => (
              <Row key={j} between gap={12} style={{ paddingVertical: 7, borderBottomWidth: j === d.exercicios.length - 1 ? 0 : StyleSheet.hairlineWidth, borderBottomColor: t.line }}>
                <T size={13} w={500} style={{ flex: 1 }}>{e.nome}</T>
                <T size={12} mono color={t.mute}>{e.series}×{e.repeticoes}</T>
              </Row>
            ))}
          </Col>
        </Collapse>
      ))}
      {!proprio ? <Muted size={11}>Sugestão de referência. Não substitui a orientação de um profissional de educação física.</Muted> : null}
    </>
  );
}

function RotinaPropria() {
  const { state, dispatch } = useStore();
  const t = useTheme();
  const [dia, setDia] = useState("");
  const [foco, setFoco] = useState("");
  const [novo, setNovo] = useState<Record<number, { nome: string; series: string; reps: string }>>({});
  const get = (id: number) => novo[id] ?? { nome: "", series: "3", reps: "10-12" };
  const set = (id: number, patch: Partial<{ nome: string; series: string; reps: string }>) => setNovo((x) => ({ ...x, [id]: { ...get(id), ...patch } }));

  return (
    <>
      {state.treinoPersonalizado.length === 0 ? <Muted center style={{ paddingVertical: 8 }}>Nenhum dia cadastrado. Adicione abaixo o que o seu personal passou.</Muted> : null}
      {state.treinoPersonalizado.map((d) => {
        const n = get(d.id);
        return (
          <Card key={d.id} pad={16} gap={8}>
            <Row between style={{ alignItems: "flex-start" }}>
              <Col gap={0}>
                <T size={14.5} w={700}>{d.dia}</T>
                {d.foco ? <T size={11.5} color={t.mute}>{d.foco}</T> : null}
              </Col>
              <Pressable accessibilityLabel="Remover dia" hitSlop={10} onPress={() => dispatch({ type: "REMOVE_DIA_TREINO_PERSONALIZADO", id: d.id })}><Trash2 size={16} color={t.mute} /></Pressable>
            </Row>
            {d.exercicios.map((e) => (
              <Row key={e.id} between style={{ paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.line }}>
                <T size={13} style={{ flex: 1 }}>{e.nome}</T>
                <Row gap={8}>
                  <T size={12} mono color={t.mute}>{e.series}×{e.repeticoes}</T>
                  <Pressable accessibilityLabel="Remover exercício" hitSlop={10} onPress={() => dispatch({ type: "REMOVE_EXERCICIO_PERSONALIZADO", diaId: d.id, exercicioId: e.id })}><X size={14} color={t.mute} /></Pressable>
                </Row>
              </Row>
            ))}
            <Row gap={6} style={{ paddingTop: 4 }}>
              <Input value={n.nome} onChangeText={(v) => set(d.id, { nome: v })} placeholder="Exercício" style={{ flex: 1, paddingVertical: 10 }} />
              <Input value={n.series} keyboardType="number-pad" onChangeText={(v) => set(d.id, { series: v.replace(/\D/g, "") })} style={{ width: 46, textAlign: "center", paddingVertical: 10, paddingHorizontal: 6 }} accessibilityLabel="Séries" />
              <Input value={n.reps} onChangeText={(v) => set(d.id, { reps: v })} style={{ width: 64, textAlign: "center", paddingVertical: 10, paddingHorizontal: 6 }} accessibilityLabel="Repetições" />
              <View>
                <Button size="sm" onPress={() => {
                  if (!n.nome.trim()) return;
                  dispatch({ type: "ADD_EXERCICIO_PERSONALIZADO", diaId: d.id, exercicio: { id: Date.now(), nome: n.nome.trim(), series: Number(n.series) || 3, repeticoes: n.reps.trim() || "10-12" } });
                  setNovo((x) => ({ ...x, [d.id]: { nome: "", series: n.series, reps: n.reps } }));
                }}>+</Button>
              </View>
            </Row>
          </Card>
        );
      })}
      <Collapse title="Adicionar dia de treino" defaultOpen={state.treinoPersonalizado.length === 0}>
        <Field label="Nome do dia"><Input value={dia} onChangeText={setDia} placeholder="Ex.: Treino A — Segunda" /></Field>
        <Field label="Foco (opcional)"><Input value={foco} onChangeText={setFoco} placeholder="Ex.: Peito e tríceps" /></Field>
        <Button disabled={!dia.trim()} onPress={() => { dispatch({ type: "ADD_DIA_TREINO_PERSONALIZADO", dia: { id: Date.now(), dia: dia.trim(), foco: foco.trim(), exercicios: [] } }); setDia(""); setFoco(""); }}>Adicionar dia</Button>
      </Collapse>
    </>
  );
}
