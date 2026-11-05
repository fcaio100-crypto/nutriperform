import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Plus, Search, X } from "lucide-react-native";
import { useStore } from "../state/store";
import { useUi } from "../state/ui";
import { foodById, searchFoods } from "../data/foods";
import { fmtInt, itemMacros, totals } from "../lib/calc";
import type { Food } from "../lib/types";
import { BRAND, useTheme } from "../theme";
import { B, Button, Col, Input, Row, Sheet, T } from "../components/ui";

const COMUNS = ["pao", "ovo", "cuscuz", "tapioca", "arroz", "feijao", "frango", "carne", "banana", "mamao_papaia", "tangerina", "pao_queijo", "cafe", "leite", "iogurte", "whey"];

export default function AddFood() {
  const { state, dispatch } = useStore();
  const { close, foodMealId, notify } = useUi();
  const t = useTheme();
  const [mealId, setMealId] = useState(foodMealId ?? state.meals[0]?.id);
  const [q, setQ] = useState("");
  const meal = state.meals.find((m) => m.id === mealId) ?? state.meals[0];

  const recentes = useMemo(() => {
    const ult = new Map<string, number>();
    const todos = [...Object.values(state.dias ?? {}).flatMap((d) => d.meals), ...state.meals];
    for (const m of todos) for (const it of m.items) ult.set(it.foodId, it.qtdGramas);
    return [...ult.entries()].reverse().slice(0, 8).map(([id, g]) => ({ food: foodById(id), g }));
  }, [state.dias, state.meals]);
  const busca = useMemo(() => (q.trim() ? searchFoods(q).slice(0, 30) : []), [q]);
  const comuns = COMUNS.map(foodById).filter((f) => !recentes.some((r) => r.food.id === f.id));

  function add(f: Food, g: number) {
    dispatch({ type: "ADD_MEAL_ITEM", mealId: meal.id, foodId: f.id, qtdGramas: g });
    notify(`+ ${f.nome} (${g} g)`);
  }
  const tot = totals([meal]);

  return (
    <Sheet title="Adicionar comida" onClose={close} footer={<Button size="lg" onPress={close}>Pronto</Button>}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {state.meals.map((m) => (
          <Pressable key={m.id} onPress={() => setMealId(m.id)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: meal.id === m.id ? t.inverse : t.raised }}>
            <T size={12} w={600} color={meal.id === m.id ? t.onInverse : t.soft}>{m.nome}</T>
          </Pressable>
        ))}
      </ScrollView>

      {meal.items.length > 0 ? (
        <Col gap={6}>
          <Row between><T size={11.5} w={700} color={t.mute} upper track={0.5}>Nesta refeição</T><T size={11.5} mono color={t.mute}>{fmtInt(tot.kcal)} kcal</T></Row>
          {meal.items.map((it) => {
            const x = itemMacros(it);
            return (
              <Row key={it.id} between gap={8} style={{ paddingLeft: 12, paddingRight: 4, paddingVertical: 4, borderRadius: 12, backgroundColor: t.brandSoft }}>
                <T size={12.5} w={600} lines={1} style={{ flex: 1 }}>{x.nome} · {it.qtdGramas} g</T>
                <Row gap={2}>
                  <T size={11.5} mono>{fmtInt(x.kcal)} kcal</T>
                  <Pressable accessibilityLabel="Remover" onPress={() => dispatch({ type: "REMOVE_MEAL_ITEM", mealId: meal.id, itemId: it.id })} style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}><X size={15} color={t.mute} /></Pressable>
                </Row>
              </Row>
            );
          })}
        </Col>
      ) : null}

      <View>
        <View style={{ position: "absolute", left: 14, top: 0, bottom: 0, justifyContent: "center", zIndex: 1 }}><Search size={16} color={t.mute} /></View>
        <Input value={q} onChangeText={setQ} placeholder="Buscar alimento (ex.: pão de queijo)" style={{ paddingLeft: 40 }} autoCorrect={false} />
      </View>

      {q.trim() ? (
        <Lista titulo="Resultados" vazio="Nada encontrado. Tente outro nome." itens={busca.map((f) => ({ food: f }))} onAdd={add} />
      ) : (
        <>
          {recentes.length > 0 ? <Lista titulo="Você costuma comer" itens={recentes} onAdd={add} /> : null}
          <Lista titulo="Comuns" itens={comuns.map((f) => ({ food: f }))} onAdd={add} />
        </>
      )}
      <T size={11} color={t.mute} center>Toque no <B>+</B> para adicionar 1 porção. Toque no nome para escolher a quantidade.</T>
    </Sheet>
  );
}

function Lista({ titulo, itens, onAdd, vazio }: { titulo: string; itens: { food: Food; g?: number }[]; onAdd: (f: Food, g: number) => void; vazio?: string }) {
  const t = useTheme();
  return (
    <Col gap={0}>
      <T size={11.5} w={700} color={t.mute} upper track={0.5} style={{ marginBottom: 4 }}>{titulo}</T>
      {itens.length === 0 && vazio ? <T size={12.5} color={t.mute} center style={{ paddingVertical: 12 }}>{vazio}</T> : null}
      {itens.map(({ food, g }, i) => <Linha key={food.id} food={food} g={g} onAdd={onAdd} last={i === itens.length - 1} />)}
    </Col>
  );
}

function Linha({ food, g, onAdd, last }: { food: Food; g?: number; onAdd: (f: Food, g: number) => void; last?: boolean }) {
  const t = useTheme();
  const [aberto, setAberto] = useState(false);
  const [gramas, setGramas] = useState("");
  const porcao = g ?? food.porcao?.[0] ?? 100;
  const rotulo = g ? `${g} g (última vez)` : food.porcao ? `${food.porcao[1]} · ${food.porcao[0]} g` : "100 g";
  return (
    <View style={{ borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: t.line }}>
      <Row gap={12} style={{ paddingVertical: 10 }}>
        <Pressable onPress={() => setAberto(!aberto)} style={{ flex: 1 }}>
          <T size={14} w={600} lines={1}>{food.nome}</T>
          <T size={11.5} color={t.mute}>{rotulo} · {fmtInt((food.kcal * porcao) / 100)} kcal</T>
        </Pressable>
        <Pressable accessibilityLabel={`Adicionar ${food.nome}`} onPress={() => onAdd(food, porcao)} style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: BRAND, alignItems: "center", justifyContent: "center", transform: [{ scale: pressed ? 0.9 : 1 }] })}>
          <Plus size={20} color="#fff" />
        </Pressable>
      </Row>
      {aberto ? (
        <Col gap={8} style={{ paddingBottom: 12 }}>
          {food.porcao ? (
            <Row gap={6} wrap>
              <T size={11} w={600} color={t.mute}>Porção = {food.porcao[1]}</T>
              {[0.5, 1, 2, 3].map((x) => (
                <Pressable key={x} onPress={() => { onAdd(food, Math.round(food.porcao![0] * x)); setAberto(false); }} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: t.raised }}>
                  <T size={12.5} w={700}>{x === 0.5 ? "½" : x}×</T>
                </Pressable>
              ))}
            </Row>
          ) : null}
          <Row gap={8}>
            <Input keyboardType="number-pad" value={gramas} onChangeText={(v) => setGramas(v.replace(/\D/g, ""))} placeholder="Outra quantidade (g)" style={{ flex: 1 }} />
            <Button variant="secondary" onPress={() => { const v = Number(gramas); if (v) { onAdd(food, v); setAberto(false); setGramas(""); } }}>Adicionar</Button>
          </Row>
        </Col>
      ) : null}
    </View>
  );
}
