import { useState } from "react";
import { Pressable, View } from "react-native";
import { Check, ChevronRight, Droplets, Dumbbell, Minus, Moon, Plus, Sparkles, Utensils } from "lucide-react-native";
import { useStore, hojeDe, vistoDe } from "../state/store";
import { useUi } from "../state/ui";
import { addDays, aguaMetaL, fmtDec, fmtInt, greeting, intensidade, isoToDM, kcalEstimada, metasDoEstado, nowHM, parseISO, totals } from "../lib/calc";
import type { Workout } from "../lib/types";
import { resumoTreino, treinoPlanejado, treinosDaData } from "../lib/plan";
import { DURACAO_PADRAO, FUNC_MOD, NIVEIS, OPCOES_TREINO, progressoFuncional } from "../data/exercises";
import { foodById } from "../data/foods";
import { BRAND, DANGER, LIMA, PRETO, WATER, useTheme } from "../theme";
import { B, Bar, Button, Card, Checkbox, Chips, Col, Divider, Input, Link, Row, T } from "../components/ui";
import { DayNav, SafetyCard } from "../components/shell";
import { LogoMark } from "../components/Logo";

const PRINCIPAIS = ["cafe", "almoco", "lt", "jantar"];

export default function Hoje() {
  const { state } = useStore();
  const t = useTheme();
  const nome = state.profile.nome.split(" ")[0];
  return (
    <>
      <Row between>
        <Col gap={0}>
          <T size={13} w={600} color={t.mute}>{greeting()}{nome ? `, ${nome}` : ""}</T>
          <T size={30} w={800} style={{ letterSpacing: -0.6, lineHeight: 36 }}>Seu dia</T>
        </Col>
        <LogoMark size={42} />
      </Row>
      <DayNav />
      <TreinoCard />
      <ComidaCard />
      <AguaCard />
      <AssistenteAtalho />
      <Semana />
      <SafetyCard compact />
    </>
  );
}

function Cabeca({ icon, label, cor, right }: { icon: React.ReactNode; label: string; cor: string; right?: React.ReactNode }) {
  return (
    <Row between>
      <Row gap={8}>{icon}<T size={12} w={700} color={cor} upper track={0.5}>{label}</T></Row>
      {right}
    </Row>
  );
}

function TreinoCard() {
  const { state, dispatch } = useStore();
  const { openTreino, openWorkout, go, notify } = useUi();
  const t = useTheme();
  const [trocar, setTrocar] = useState(false);
  const iso = vistoDe(state);
  const ehHoje = iso === hojeDe(state);
  const plano = treinoPlanejado(state, iso);
  const feitos = treinosDaData(state, iso);
  const feitoPlano = feitos.find((w) => w.modalidade === plano);
  const outros = feitos.filter((w) => w !== feitoPlano);

  function marcarFeito(mod: string) {
    const nivel = mod === FUNC_MOD ? progressoFuncional(state.workouts).nivel : undefined;
    const min = mod === FUNC_MOD ? NIVEIS[(nivel ?? 1) - 1].min : mod === "Musculação" ? state.profile.minutosPorTreino || 60 : DURACAO_PADRAO[mod] ?? 45;
    const w: Workout = {
      id: Date.now(), modalidade: mod, data: isoToDM(iso), dataISO: iso, hora: nowHM(), duracaoMin: min, intensidade: intensidade(6),
      distancia: "—", kcal: mod === FUNC_MOD ? Math.round(min * 7.6) : kcalEstimada(min, 6), pse: 6, sensacao: "Na medida", nivel,
    };
    dispatch({ type: "ADD_WORKOUT", workout: w });
    notify(`${mod} concluído ✓`);
  }

  return (
    <Card pad={20} gap={16}>
      <Cabeca icon={<Dumbbell size={16} color={BRAND} />} label={`Treino ${ehHoje ? "de hoje" : "do dia"}`} cor={BRAND} right={<Link color={t.mute} onPress={() => setTrocar(!trocar)}>{trocar ? "Cancelar" : "Trocar"}</Link>} />

      {trocar ? (
        <Col gap={12}>
          <T size={13} w={600}>O que você vai fazer {ehHoje ? "hoje" : "neste dia"}?</T>
          <Chips value={plano} onChange={(v) => { dispatch({ type: "SET_TREINO_DO_DIA", date: iso, mod: v }); setTrocar(false); }} options={OPCOES_TREINO.map((m) => ({ v: m, label: m }))} />
          <Link onPress={() => go("eu", "semana")}>Editar minha semana de treino →</Link>
        </Col>
      ) : feitoPlano ? (
        <Row gap={12}>
          <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: BRAND, alignItems: "center", justifyContent: "center" }}><Check size={24} color="#fff" strokeWidth={3} /></View>
          <Col gap={0} style={{ flex: 1 }}>
            <T size={19} w={800}>{plano} feito!</T>
            <T size={12.5} color={t.mute}>{feitoPlano.duracaoMin} min{feitoPlano.sensacao ? ` · ${feitoPlano.sensacao}` : ""}{feitoPlano.nivel ? ` · nível ${feitoPlano.nivel}` : ""}</T>
          </Col>
        </Row>
      ) : plano === "Descanso" ? (
        <Row gap={12}>
          <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: t.raised, alignItems: "center", justifyContent: "center" }}><Moon size={22} color={t.soft} /></View>
          <Col gap={0} style={{ flex: 1 }}>
            <T size={19} w={800}>Dia de descanso</T>
            <T size={12.5} color={t.mute}>Recuperar também faz parte do treino.</T>
          </Col>
        </Row>
      ) : (
        <Col gap={14}>
          <Col gap={2}>
            <T size={24} w={800} style={{ letterSpacing: -0.4 }}>{plano}</T>
            <T size={13} color={t.mute}>{resumoTreino(state, plano)}</T>
          </Col>
          <Button size="lg" onPress={() => openTreino(plano, iso)}>Começar treino</Button>
          <Button variant="secondary" icon={<Check size={16} strokeWidth={3} color={t.ink} />} onPress={() => marcarFeito(plano)}>Já fiz — marcar como concluído</Button>
        </Col>
      )}

      {!trocar && outros.length > 0 ? (
        <Col gap={0}>
          <Divider />
          {outros.map((w) => (
            <Row key={w.id} between style={{ paddingVertical: 10 }}>
              <Row gap={8}><Check size={16} color={BRAND} /><T size={13} w={600}>{w.modalidade}</T></Row>
              <T size={12} mono color={t.mute}>{w.duracaoMin} min</T>
            </Row>
          ))}
        </Col>
      ) : null}

      {!trocar ? (
        <Col gap={10}>
          <Divider />
          <T size={12} w={700} color={t.mute}>Fazer outro treino agora</T>
          <Row gap={6} wrap>
            {OPCOES_TREINO.filter((m) => m !== "Descanso" && m !== plano).map((m) => (
              <Pressable key={m} onPress={() => openTreino(m, iso)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: t.raised }}>
                <T size={12} w={600} color={t.soft}>{m}</T>
              </Pressable>
            ))}
          </Row>
          <Link color={t.mute} onPress={() => openWorkout()}>+ Registrar outra atividade</Link>
        </Col>
      ) : null}
    </Card>
  );
}

function refeicaoAgora(meals: { id: string; hora: string }[]) {
  const d = new Date();
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const passadas = meals.filter((m) => m.hora <= hm);
  return (passadas[passadas.length - 1] ?? meals[0])?.id;
}

function ComidaCard() {
  const { state } = useStore();
  const { openFood } = useUi();
  const t = useTheme();
  const [todas, setTodas] = useState(false);
  const m = metasDoEstado(state);
  const tot = totals(state.meals);
  const passou = tot.kcal > m.meta;
  const visiveis = state.meals.filter((x) => todas || PRINCIPAIS.includes(x.id) || x.items.length > 0);
  const escondidas = state.meals.length - visiveis.length;
  const laranja = t.dark ? "#C2852B" : "#B36B12";

  return (
    <Card pad={20} gap={12}>
      <Cabeca icon={<Utensils size={16} color={laranja} />} label="Comida" cor={laranja} right={<T size={13} mono><B>{fmtInt(tot.kcal)}</B><T size={13} mono color={t.mute}> / {fmtInt(m.meta)} kcal</T></T>} />
      <Bar pct={m.meta > 0 ? (tot.kcal / m.meta) * 100 : 0} color={passou ? DANGER : BRAND} h={10} />
      <T size={12.5} color={t.soft}>
        {passou ? <B color={DANGER}>{fmtInt(tot.kcal - m.meta)} kcal acima da meta</B> : <B>Restam {fmtInt(m.meta - tot.kcal)} kcal</B>} · proteína {fmtInt(tot.proteina)} de {fmtInt(m.proteina)} g
      </T>
      <Col gap={0}>
        {visiveis.map((meal) => {
          const k = totals([meal]).kcal;
          const tem = meal.items.length > 0;
          return (
            <Pressable key={meal.id} onPress={() => openFood(meal.id)} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <Row gap={12} style={{ paddingVertical: 10 }}>
                <Checkbox on={tem} round size={24} />
                <Col gap={0} style={{ flex: 1 }}>
                  <T size={14} w={600}>{meal.nome}</T>
                  {tem ? <T size={11.5} color={t.mute} lines={1}>{meal.items.map((i) => foodById(i.foodId).nome.split(" (")[0]).join(", ")}</T> : null}
                </Col>
                {k > 0 ? <T size={12.5} mono color={t.soft}>{fmtInt(k)} kcal</T> : <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.raised, alignItems: "center", justifyContent: "center" }}><Plus size={16} color={t.soft} /></View>}
              </Row>
            </Pressable>
          );
        })}
      </Col>
      {escondidas > 0 ? <Link color={t.mute} onPress={() => setTodas(true)}>+ Outras refeições (lanche da manhã, pré e pós-treino, ceia)</Link> : null}
      <Button variant="ghost" icon={<Plus size={17} color={t.ink} />} onPress={() => openFood(refeicaoAgora(state.meals))}>Adicionar comida</Button>
    </Card>
  );
}

function AguaCard() {
  const { state, dispatch } = useStore();
  const { notify } = useUi();
  const t = useTheme();
  const [outro, setOutro] = useState(false);
  const [ml, setMl] = useState("");
  const l = state.waterMl / 1000;
  const meta = aguaMetaL(state);
  function adicionar() {
    const v = Number(ml);
    if (!v) return;
    dispatch({ type: "ADD_WATER", ml: v });
    notify(`+${v} ml de água`);
    setMl("");
    setOutro(false);
  }
  return (
    <Card pad={20} gap={12}>
      <Cabeca icon={<Droplets size={16} color={WATER} />} label="Água" cor={WATER} right={<T size={13} mono><B>{fmtDec(l)}</B><T size={13} mono color={t.mute}> / {fmtDec(meta)} L</T></T>} />
      <Bar pct={meta > 0 ? (l / meta) * 100 : 0} color={WATER} h={10} />
      <Row gap={8}>
        <Pressable accessibilityLabel="Tirar um copo" onPress={() => dispatch({ type: "ADD_WATER", ml: -250 })} style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: t.raised, alignItems: "center", justifyContent: "center" }}><Minus size={18} color={t.soft} /></Pressable>
        <Pressable onPress={() => dispatch({ type: "ADD_WATER", ml: 250 })} style={({ pressed }) => ({ flex: 1, height: 48, borderRadius: 14, backgroundColor: WATER, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
          <Plus size={18} color="#fff" /><T size={14} w={700} color="#fff">1 copo (250 ml)</T>
        </Pressable>
        <Pressable onPress={() => setOutro(!outro)} style={{ paddingHorizontal: 16, height: 48, borderRadius: 14, backgroundColor: t.waterSoft, justifyContent: "center" }}><T size={13} w={700} color={WATER}>Outro</T></Pressable>
      </Row>
      {outro ? (
        <Col gap={8}>
          <Row gap={6} wrap>
            {[150, 200, 300, 350, 500, 750, 1000].map((v) => (
              <Pressable key={v} onPress={() => setMl(String(v))} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: ml === String(v) ? WATER : t.raised }}>
                <T size={12.5} w={700} color={ml === String(v) ? "#fff" : t.soft}>{v >= 1000 ? `${v / 1000} L` : `${v} ml`}</T>
              </Pressable>
            ))}
          </Row>
          <Row gap={8}>
            <Input autoFocus keyboardType="number-pad" value={ml} onChangeText={(x) => setMl(x.replace(/\D/g, ""))} placeholder="Quantidade em ml (ex.: 400)" style={{ flex: 1 }} onSubmitEditing={adicionar} />
            <Button disabled={!Number(ml)} onPress={adicionar} style={{ alignSelf: "stretch" }}>Adicionar</Button>
          </Row>
          <Link color={t.mute} size={12} onPress={() => { const v = Number(ml); if (v) { dispatch({ type: "ADD_WATER", ml: -v }); setMl(""); setOutro(false); } }}>Tirar essa quantidade</Link>
        </Col>
      ) : null}
    </Card>
  );
}

function Semana() {
  const { state, dispatch } = useStore();
  const t = useTheme();
  const v = vistoDe(state);
  const h = hojeDe(state);
  const dow = (parseISO(v).getDay() + 6) % 7;
  const seg = addDays(v, -dow);
  const dias = Array.from({ length: 7 }, (_, i) => addDays(seg, i));
  const feitos = dias.filter((d) => state.workouts.some((w) => w.data === isoToDM(d))).length;
  return (
    <Card pad={20} gap={12}>
      <Row between>
        <T size={12} w={700} color={t.mute} upper track={0.5}>Sua semana</T>
        <T size={12.5} w={700}>{feitos} {feitos === 1 ? "dia treinado" : "dias treinados"}</T>
      </Row>
      <Row gap={6}>
        {dias.map((d, i) => {
          const ok = state.workouts.some((w) => w.data === isoToDM(d));
          const plano = treinoPlanejado(state, d);
          const futuro = d > h;
          const sel = d === v;
          return (
            <Pressable key={d} onPress={() => dispatch({ type: "SET_DIA_VISTO", date: d })} style={{ flex: 1, alignItems: "center", gap: 4 }}>
              <T size={10.5} w={700} color={sel ? BRAND : t.mute}>{"STQQSSD"[i]}</T>
              <View style={[
                { width: "100%", aspectRatio: 1, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: ok ? BRAND : t.raised },
                !ok && futuro && plano !== "Descanso" && { backgroundColor: "transparent", borderWidth: 2, borderStyle: "dashed", borderColor: t.line },
                sel && { borderWidth: 2, borderStyle: "solid", borderColor: BRAND },
              ]}>
                {ok ? <Check size={15} color="#fff" strokeWidth={3} /> : <T size={11} w={700} color={t.mute}>{plano === "Descanso" ? "–" : String(parseISO(d).getDate())}</T>}
              </View>
            </Pressable>
          );
        })}
      </Row>
    </Card>
  );
}

function AssistenteAtalho() {
  const { go } = useUi();
  return (
    <Pressable onPress={() => go("assistente")} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <Row gap={12} style={{ padding: 16, borderRadius: 24, borderCurve: "continuous", backgroundColor: PRETO }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: LIMA, alignItems: "center", justifyContent: "center" }}><Sparkles size={20} color={PRETO} /></View>
        <Col gap={1} style={{ flex: 1 }}>
          <T size={14} w={700} color="#fff">Pergunte ao assistente</T>
          <T size={12} color="#B9C4BC" lines={1}>“O que comer no jantar para bater a proteína?”</T>
        </Col>
        <ChevronRight size={18} color="#B9C4BC" />
      </Row>
    </Pressable>
  );
}
