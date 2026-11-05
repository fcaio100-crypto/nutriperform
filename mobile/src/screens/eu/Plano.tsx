import { useMemo, useState } from "react";
import { Pressable, Share, View } from "react-native";
import { Share2, Sparkles, Trash2 } from "lucide-react-native";
import { useStore } from "../../state/store";
import { useUi } from "../../state/ui";
import { LISTA_COMPRAS, TIPOS_DIA, ajusteTipoDia, carboTipoDia, fmtInt, gerarPlano, metasDoEstado } from "../../lib/calc";
import type { PlanMeal } from "../../lib/types";
import { BRAND, useTheme } from "../../theme";
import { B, Box, Button, Card, Checkbox, Chips, Col, Collapse, Field, Grid, Input, Link, Muted, Row, SectionLabel, T } from "../../components/ui";

export default function Plano() {
  const { state, dispatch } = useStore();
  const { openDieta, notify } = useUi();
  const t = useTheme();
  const m = metasDoEstado(state);
  const meta = Math.round(m.meta + ajusteTipoDia(state.dayType));
  const sugerido = useMemo(() => gerarPlano(meta), [meta]);
  const proprio = state.planoPersonalizadoAtivo;
  const lista = proprio ? [...state.planoPersonalizado].sort((a, b) => a.hora.localeCompare(b.hora)) : sugerido;
  const totalLista = lista.reduce((s, x) => s + (x.kcal || 0), 0);

  function registrar(r: PlanMeal) {
    if (!r.itens?.length) return;
    const alvo = state.meals.find((x) => x.nome.toLowerCase().includes(r.nome.toLowerCase()) || r.nome.toLowerCase().includes(x.nome.toLowerCase()));
    dispatch({ type: "ADD_MEAL_ITEMS_BULK", mealId: alvo?.id ?? state.meals[0].id, itens: r.itens });
    notify(`${r.nome} registrado no diário`);
  }
  function compartilhar() {
    const txt = lista.map((r) => `${r.hora} · ${r.nome}${r.kcal ? ` — ${fmtInt(r.kcal)} kcal` : ""}${r.descricao ? `\n${r.descricao}` : ""}${r.substituicao ? `\nTroca: ${r.substituicao}` : ""}`).join("\n\n");
    Share.share({ message: `Plano alimentar — ${state.profile.nome || "NutriPerform"}\n\n${txt}` }).catch(() => {});
  }

  return (
    <>
      <Card tone="dark" pad={20}>
        <Row gap={8}><Sparkles size={16} color="#8FD3AE" /><T size={11} w={700} color="#8FD3AE" upper track={0.5}>Montado para você</T></Row>
        <T size={17} w={700} color="#fff">Gere um cardápio com as calorias certas para chegar a {state.profile.pesoDesejado} kg</T>
        <Button variant="white" onPress={openDieta} style={{ alignSelf: "flex-start" }}>Montar meu plano</Button>
      </Card>

      <Card pad={16}>
        <Field label="De onde vem o seu plano">
          <Chips value={proprio ? "p" : "a"} onChange={(v) => dispatch({ type: "SET_PLANO_PERSONALIZADO_ATIVO", ativo: v === "p" })} options={[{ v: "a", label: "Sugestão do app" }, { v: "p", label: "Meu plano / nutricionista" }]} />
        </Field>
        {!proprio ? (
          <Field label="Como é o seu dia hoje?">
            <Chips value={state.dayType} onChange={(v) => dispatch({ type: "SET_DAY_TYPE", dayType: v })} options={TIPOS_DIA.map((x) => ({ v: x, label: x }))} />
          </Field>
        ) : null}
        <Grid cols={2}>
          <Box l={proprio ? "Total do plano" : "Energia do dia"} v={`${fmtInt(proprio ? totalLista : meta)} kcal`} />
          <Box l={proprio ? "Sua meta" : "Carboidrato"} v={proprio ? `${fmtInt(m.meta)} kcal` : `${carboTipoDia(state.dayType, state.profile.peso)} g`} />
        </Grid>
      </Card>

      <SectionLabel action={<Pressable onPress={compartilhar} hitSlop={8}><Row gap={4}><Share2 size={14} color={BRAND} /><T size={12} w={700} color={BRAND}>Enviar</T></Row></Pressable>}>
        {proprio ? "Meu plano" : "Cardápio sugerido"}
      </SectionLabel>

      {lista.length === 0 ? <Muted center style={{ paddingVertical: 8 }}>Nenhuma refeição cadastrada. Adicione abaixo o plano do seu nutricionista.</Muted> : null}
      {lista.map((r) => (
        <Card key={r.id} pad={16} gap={8}>
          <Row between>
            <Row gap={8} style={{ flex: 1 }}>
              <T size={11} mono color={t.mute}>{r.hora}</T>
              <T size={14.5} w={700} style={{ flexShrink: 1 }}>{r.nome}</T>
            </Row>
            <Row gap={8}>
              {r.kcal > 0 ? <T size={12.5} mono>{fmtInt(r.kcal)} kcal</T> : null}
              {proprio ? <Pressable accessibilityLabel="Remover" hitSlop={10} onPress={() => dispatch({ type: "REMOVE_REFEICAO_PERSONALIZADA", id: r.id })}><Trash2 size={16} color={t.mute} /></Pressable> : null}
            </Row>
          </Row>
          {r.descricao ? <T size={12.5}>{r.descricao}</T> : null}
          {r.substituicao ? <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: t.raised }}><T size={11.5} color={t.soft}><B>Troca:</B> {r.substituicao}</T></View> : null}
          {r.itens && r.itens.length > 0 ? <Link size={12} onPress={() => registrar(r)}>+ Registrar no diário</Link> : null}
        </Card>
      ))}

      {proprio ? <NovaRefeicao /> : null}
      <ListaCompras />
    </>
  );
}

function NovaRefeicao() {
  const { dispatch } = useStore();
  const [hora, setHora] = useState("12:00");
  const [nome, setNome] = useState("");
  const [desc, setDesc] = useState("");
  const [kcal, setKcal] = useState("");
  const [sub, setSub] = useState("");
  function add() {
    if (!nome.trim()) return;
    dispatch({ type: "ADD_REFEICAO_PERSONALIZADA", refeicao: { id: Date.now(), hora, nome: nome.trim(), descricao: desc.trim(), kcal: Number(kcal) || 0, substituicao: sub.trim() } });
    setNome(""); setDesc(""); setKcal(""); setSub("");
  }
  return (
    <Collapse title="Adicionar refeição ao meu plano" subtitle="Copie aqui o que o seu nutricionista passou">
      <Grid cols={2} gap={12}>
        <Field label="Horário"><Input value={hora} onChangeText={setHora} placeholder="12:00" keyboardType="numbers-and-punctuation" /></Field>
        <Field label="kcal (opcional)"><Input keyboardType="number-pad" value={kcal} onChangeText={setKcal} /></Field>
      </Grid>
      <Field label="Nome"><Input value={nome} onChangeText={setNome} placeholder="Ex.: Café da manhã" /></Field>
      <Field label="Alimentos e quantidades"><Input value={desc} onChangeText={setDesc} placeholder="Ex.: 2 ovos + 1 pão + café" multiline /></Field>
      <Field label="Substituição (opcional)"><Input value={sub} onChangeText={setSub} /></Field>
      <Button onPress={add} disabled={!nome.trim()}>Adicionar refeição</Button>
    </Collapse>
  );
}

function ListaCompras() {
  const { state, dispatch } = useStore();
  const t = useTheme();
  const total = LISTA_COMPRAS.reduce((s, g) => s + g.items.length, 0);
  const marcados = LISTA_COMPRAS.reduce((s, g) => s + g.items.filter((it) => state.shoppingChecks[`${g.id}-${it}`]).length, 0);
  return (
    <Collapse title="Lista de compras da semana" subtitle={`${marcados} de ${total} itens no carrinho`}>
      {LISTA_COMPRAS.map((g) => (
        <Col key={g.id} gap={2}>
          <T size={11} w={700} color={t.mute} upper track={0.5}>{g.l}</T>
          {g.items.map((it) => {
            const k = `${g.id}-${it}`;
            const on = !!state.shoppingChecks[k];
            return (
              <Pressable key={k} onPress={() => dispatch({ type: "TOGGLE_SHOPPING_ITEM", key: k })}>
                <Row gap={10} style={{ paddingVertical: 6 }}><Checkbox on={on} size={20} /><T size={13} strike={on}>{it}</T></Row>
              </Pressable>
            );
          })}
        </Col>
      ))}
    </Collapse>
  );
}
