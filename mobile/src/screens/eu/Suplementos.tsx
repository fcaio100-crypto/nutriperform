import { useState } from "react";
import { Pressable, View } from "react-native";
import { Pill as PillIcon, Trash2 } from "lucide-react-native";
import { useStore } from "../../state/store";
import { BRAND, useTheme } from "../../theme";
import { Button, Card, Col, Collapse, Empty, Field, Grid, Input, Muted, Row, T } from "../../components/ui";

export default function Suplementos() {
  const { state, dispatch } = useStore();
  const t = useTheme();
  const [f, setF] = useState({ nome: "", dose: "", hora: "", frequencia: "Todos os dias", objetivo: "" });
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  function salvar() {
    if (!f.nome.trim()) return;
    dispatch({ type: "ADD_SUPPLEMENT", supplement: { id: Date.now(), ...f, nome: f.nome.trim() } });
    setF({ nome: "", dose: "", hora: "", frequencia: "Todos os dias", objetivo: "" });
  }
  return (
    <>
      {state.supplements.length === 0 ? <Card><Empty icon={<PillIcon size={20} color={BRAND} />} title="Nenhum suplemento" text="Cadastre o que você usa para não esquecer horário e dose." /></Card> : null}
      {state.supplements.map((s) => (
        <Card key={s.id} pad={16}>
          <Row gap={12}>
            <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: t.brandSoft, alignItems: "center", justifyContent: "center" }}><PillIcon size={18} color={BRAND} /></View>
            <Col gap={0} style={{ flex: 1 }}>
              <T size={14} w={700}>{s.nome} <T size={12} mono color={t.mute}>{s.dose}</T></T>
              <T size={11.5} color={t.mute}>{[s.hora, s.frequencia, s.objetivo].filter(Boolean).join(" · ")}</T>
            </Col>
            <Pressable accessibilityLabel="Remover" hitSlop={10} onPress={() => dispatch({ type: "REMOVE_SUPPLEMENT", id: s.id })}><Trash2 size={16} color={t.mute} /></Pressable>
          </Row>
        </Card>
      ))}
      <Collapse title="Adicionar suplemento">
        <Field label="Nome"><Input value={f.nome} onChangeText={set("nome")} placeholder="Ex.: Creatina" /></Field>
        <Grid cols={2} gap={12}>
          <Field label="Dose"><Input value={f.dose} onChangeText={set("dose")} placeholder="5 g" /></Field>
          <Field label="Horário"><Input value={f.hora} onChangeText={set("hora")} placeholder="Pós-treino" /></Field>
          <Field label="Frequência"><Input value={f.frequencia} onChangeText={set("frequencia")} /></Field>
          <Field label="Objetivo"><Input value={f.objetivo} onChangeText={set("objetivo")} placeholder="Força" /></Field>
        </Grid>
        <Button onPress={salvar} disabled={!f.nome.trim()}>Salvar suplemento</Button>
      </Collapse>
      <Muted size={11} center>Registro pessoal. Dose e indicação devem ser definidas com médico ou nutricionista.</Muted>
    </>
  );
}
