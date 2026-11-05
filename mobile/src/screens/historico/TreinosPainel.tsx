import { useState, type ReactNode } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import Svg, { Circle, G, Line, Polygon, Polyline, Rect, Text as SvgText } from "react-native-svg";
import { Flame, Plus, Share2, Trash2 } from "lucide-react-native";
import { useStore } from "../../state/store";
import { useUi } from "../../state/ui";
import { addDays, fmtInt, parseISO, todayISO } from "../../lib/calc";
import { corDe, entre, fmtDur, fmtKm, inicioSemana, isoDoTreino, kmDoTreino, pace, sequencia, tituloTreino, totaisTreino } from "../../lib/treinos";
import type { Workout } from "../../lib/types";
import { BRAND, DANGER, WARN, useTheme } from "../../theme";
import { Button, Card, Col, Empty, Grid, Link, Muted, Pill, Ring, Row, SectionLabel, T } from "../../components/ui";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const curtaData = (iso: string) => { const d = parseISO(iso); return `${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]}`; };

function Variacao({ a, b }: { a: number; b: number }) {
  const t = useTheme();
  if (!b) return <T size={10.5} color={t.mute}>sem semana anterior</T>;
  const pct = Math.round(((a - b) / b) * 100);
  return <T size={10.5} w={700} color={pct >= 0 ? BRAND : DANGER}>{pct >= 0 ? "▲" : "▼"} {Math.abs(pct)}% <T size={10.5} color={t.mute}>vs anterior</T></T>;
}
function Num({ l, v, u, d }: { l: string; v: string; u?: string; d?: ReactNode }) {
  const t = useTheme();
  return (
    <Col gap={2}>
      <T size={11} w={600} color={t.mute}>{l}</T>
      <T size={22} mono>{v}{u ? <T size={12} mono color={t.mute}> {u}</T> : null}</T>
      {d}
    </Col>
  );
}

/** largura do card para os gráficos em SVG */
function useLargura(): [number, (w: number) => void] {
  const [w, setW] = useState(320);
  return [w, setW];
}

export default function TreinosPainel() {
  const { state, dispatch } = useStore();
  const { openWorkout, openShare } = useUi();
  const t = useTheme();
  const [filtro, setFiltro] = useState("Todos");
  const [W, setW] = useLargura();
  const ws = state.workouts;
  const hoje = todayISO();
  const ini = inicioSemana(hoje);
  const semana = entre(ws, ini, hoje);
  const s = totaisTreino(semana);
  const p = totaisTreino(entre(ws, addDays(ini, -7), addDays(ini, -1)));
  const meta = Math.max(1, state.profile.diasTreinoSemana || 3);
  const seq = sequencia(ws);

  if (ws.length === 0)
    return (
      <Card>
        <Empty title="Nenhum treino ainda" text="Registre seu primeiro treino para ver volume, recordes, constância e criar o card para postar." action={<Button size="sm" icon={<Plus size={15} color="#fff" />} onPress={() => openWorkout()}>Registrar treino</Button>} />
      </Card>
    );

  const semanas = Array.from({ length: 8 }, (_, i) => {
    const a = addDays(ini, -7 * (7 - i));
    const lista = entre(ws, a, addDays(a, 6));
    const por: Record<string, number> = {};
    lista.forEach((w) => { por[w.modalidade] = (por[w.modalidade] ?? 0) + w.duracaoMin; });
    return { a, por, tot: lista.reduce((q, w) => q + w.duracaoMin, 0) };
  });
  const yMax = Math.max(60, Math.ceil(Math.max(...semanas.map((x) => x.tot)) / 60) * 60);
  const modsNoGrafico = [...new Set(semanas.flatMap((x) => Object.keys(x.por)))];

  const ult30 = entre(ws, addDays(hoje, -29), hoje);
  const t30 = totaisTreino(ult30);
  const porMod = Object.entries(ult30.reduce<Record<string, { n: number; min: number }>>((acc, w) => {
    const o = acc[w.modalidade] ?? { n: 0, min: 0 };
    acc[w.modalidade] = { n: o.n + 1, min: o.min + w.duracaoMin };
    return acc;
  }, {})).sort((a, b) => b[1].min - a[1].min);
  const maxMod = Math.max(1, ...porMod.map(([, v]) => v.min));

  const minDia: Record<string, number> = {};
  ws.forEach((w) => { const d = isoDoTreino(w); minDia[d] = (minDia[d] ?? 0) + w.duracaoMin; });
  const iniHeat = addDays(ini, -77);
  const diasAtivos12 = Array.from({ length: 84 }, (_, i) => addDays(iniHeat, i)).filter((d) => d <= hoje && minDia[d]).length;

  const corridas = ws.filter((w) => w.modalidade === "Corrida" && kmDoTreino(w) > 0);
  const maiorDist = [...corridas].sort((a, b) => kmDoTreino(b) - kmDoTreino(a))[0];
  const ritmo = (w: Workout) => w.duracaoMin / kmDoTreino(w);
  const melhorPace = corridas.filter((w) => kmDoTreino(w) >= 1).sort((a, b) => ritmo(a) - ritmo(b))[0];
  const melhor5 = corridas.filter((w) => kmDoTreino(w) >= 5).sort((a, b) => ritmo(a) - ritmo(b))[0];
  const maisLongo = [...ws].sort((a, b) => b.duracaoMin - a.duracaoMin)[0];
  const ultCorr = [...corridas].sort((a, b) => (isoDoTreino(a) < isoDoTreino(b) ? -1 : 1)).slice(-10);

  const mods = ["Todos", ...new Set(ws.map((w) => w.modalidade))];
  const lista = [...ws].filter((w) => filtro === "Todos" || w.modalidade === filtro).sort((a, b) => (isoDoTreino(b) + (b.hora || "")).localeCompare(isoDoTreino(a) + (a.hora || "")));
  const tl = totaisTreino(lista);

  // gráfico de volume
  const GW = W, GH = 170, L = 30;
  const bw = (GW - L - 4) / 8;
  const cel = Math.floor((W - 12 * 3) / 12);

  return (
    <>
      <Card pad={20} gap={16}>
        <Row gap={16}>
          <Ring pct={Math.min(100, (s.n / meta) * 100)} size={104} stroke={11}>
            <T size={26} mono>{s.n}/{meta}</T>
            <T size={9.5} w={700} color={t.mute}>TREINOS</T>
          </Ring>
          <Col gap={3} style={{ flex: 1 }}>
            <T size={17} w={800}>Esta semana</T>
            <Muted size={12}>{curtaData(ini)} – {curtaData(addDays(ini, 6))}</Muted>
            <T size={12} w={600}>{s.n >= meta ? "Meta da semana batida ✓" : `Faltam ${meta - s.n} para a meta`}</T>
            {seq > 0 ? <Row gap={4}><Flame size={14} color={WARN} /><T size={12} w={700} color={WARN}>{seq} {seq > 1 ? "dias seguidos" : "dia seguido"}</T></Row> : null}
          </Col>
        </Row>
        <Grid cols={2} gap={14}>
          <Num l="Tempo total" v={fmtDur(s.min)} d={<Variacao a={s.min} b={p.min} />} />
          <Num l="Distância total" v={fmtKm(s.km)} u="km" d={<Variacao a={s.km} b={p.km} />} />
          <Num l="Calorias totais" v={fmtInt(s.kcal)} u="kcal" d={<Variacao a={s.kcal} b={p.kcal} />} />
          <Num l="Esforço médio" v={semana.length ? (semana.reduce((q, w) => q + (w.pse || 0), 0) / semana.length).toFixed(1).replace(".", ",") : "—"} u="/10" />
        </Grid>
      </Card>

      <SectionLabel>Volume por semana</SectionLabel>
      <Card pad={16}>
        <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
          <Svg width={GW} height={GH}>
            {[0, 1, 2, 3].map((k) => {
              const v = (yMax / 3) * k;
              const y = 148 - (v / yMax) * 136;
              return (
                <G key={k}>
                  <Line x1={L} x2={GW} y1={y} y2={y} stroke={t.line} strokeWidth={1} />
                  <SvgText x={L - 6} y={y + 4} textAnchor="end" fill={t.mute} fontSize={10}>{`${Math.round(v / 60)}h`}</SvgText>
                </G>
              );
            })}
            {semanas.map((sm, i) => {
              const x = L + 2 + i * bw;
              let y = 148;
              return (
                <G key={sm.a}>
                  {Object.entries(sm.por).map(([m, v]) => {
                    const h = (v / yMax) * 136;
                    y -= h;
                    return <Rect key={m} x={x + 4} y={y} width={bw - 8} height={h} rx={3} fill={corDe(m)} />;
                  })}
                  <SvgText x={x + bw / 2} y={164} textAnchor="middle" fontSize={9.5} fontWeight={i === 7 ? "bold" : "normal"} fill={i === 7 ? t.ink : t.mute}>
                    {i === 7 ? "Atual" : `${String(parseISO(sm.a).getDate()).padStart(2, "0")}/${String(parseISO(sm.a).getMonth() + 1).padStart(2, "0")}`}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </View>
        <Row gap={12} wrap>
          {modsNoGrafico.map((m) => <Row key={m} gap={6}><View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: corDe(m) }} /><T size={11} color={t.soft}>{m}</T></Row>)}
        </Row>
      </Card>

      <SectionLabel>Últimos 30 dias</SectionLabel>
      <Card pad={16}>
        <Grid cols={3}>
          <Num l="Treinos" v={String(t30.n)} />
          <Num l="Tempo total" v={fmtDur(t30.min)} />
          <Num l="Calorias totais" v={fmtInt(t30.kcal)} />
        </Grid>
        <Col gap={10}>
          {porMod.map(([m, v]) => (
            <Row key={m} gap={10}>
              <T size={12} w={600} lines={1} style={{ width: 96 }}>{m}</T>
              <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: t.raised, overflow: "hidden" }}><View style={{ height: "100%", borderRadius: 4, width: `${(v.min / maxMod) * 100}%`, backgroundColor: corDe(m) }} /></View>
              <T size={11} mono color={t.soft}>{v.n}× · {fmtDur(v.min)}</T>
            </Row>
          ))}
        </Col>
      </Card>

      <SectionLabel>Constância · 12 semanas</SectionLabel>
      <Card pad={16} gap={10}>
        <Row gap={3} style={{ alignItems: "flex-start" }}>
          {Array.from({ length: 12 }, (_, c) => (
            <Col key={c} gap={3}>
              {Array.from({ length: 7 }, (_, r) => {
                const d = addDays(iniHeat, c * 7 + r);
                const m = minDia[d] ?? 0;
                const a = m ? Math.min(1, 0.3 + m / 120) : 0;
                return <View key={d} style={{ width: cel, height: cel, borderRadius: 3, backgroundColor: m ? `rgba(30,142,90,${a})` : t.raised, opacity: d > hoje ? 0.3 : 1 }} />;
              })}
            </Col>
          ))}
        </Row>
        <Muted size={11}>{diasAtivos12} dias com treino nas últimas 12 semanas. Cada coluna é uma semana (seg → dom); mais escuro, mais minutos.</Muted>
      </Card>

      <SectionLabel>Recordes</SectionLabel>
      <Grid cols={2}>
        <Recorde l="Maior corrida" v={maiorDist ? `${fmtKm(kmDoTreino(maiorDist))} km` : "—"} s={maiorDist ? curtaData(isoDoTreino(maiorDist)) : "registre a distância"} />
        <Recorde l="Melhor pace" v={melhorPace ? `${pace(melhorPace.duracaoMin, kmDoTreino(melhorPace))} /km` : "—"} s={melhorPace ? `${fmtKm(kmDoTreino(melhorPace))} km · ${curtaData(isoDoTreino(melhorPace))}` : "corridas de 1 km+"} />
        <Recorde l="5 km estimado" v={melhor5 ? fmtDur(ritmo(melhor5) * 5) : "—"} s={melhor5 ? "pelo melhor pace em 5 km+" : "corridas de 5 km+"} />
        <Recorde l="Treino mais longo" v={fmtDur(maisLongo.duracaoMin)} s={`${maisLongo.modalidade} · ${curtaData(isoDoTreino(maisLongo))}`} />
      </Grid>

      {ultCorr.length >= 2 ? (
        <>
          <SectionLabel>Pace das últimas corridas</SectionLabel>
          <Card pad={16} gap={8}>
            <PaceChart runs={ultCorr} W={W} />
            <Muted size={11}>Quanto mais alto o ponto, mais rápido. Último treino em destaque.</Muted>
          </Card>
        </>
      ) : null}

      <SectionLabel action={<Link size={12} onPress={() => openWorkout()}>+ Registrar</Link>}>Todos os treinos</SectionLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {mods.map((m) => (
          <Pressable key={m} onPress={() => setFiltro(m)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: filtro === m ? t.inverse : t.raised }}>
            <T size={11.5} w={700} color={filtro === m ? t.onInverse : t.soft}>{m}</T>
          </Pressable>
        ))}
      </ScrollView>
      <Muted size={11.5} style={{ paddingHorizontal: 4 }}>{tl.n} treinos · {fmtDur(tl.min)} · {fmtKm(tl.km)} km · {fmtInt(tl.kcal)} kcal no total</Muted>
      {lista.slice(0, 60).map((w) => {
        const km = kmDoTreino(w);
        return (
          <Card key={w.id} pad={16} gap={10}>
            <Row between style={{ alignItems: "flex-start" }}>
              <Col gap={4} style={{ flex: 1 }}>
                <Row gap={6} wrap>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: corDe(w.modalidade) }}><T size={10.5} w={700} color="#fff">{w.modalidade}</T></View>
                  {w.nivel ? <Pill>Nível {w.nivel}</Pill> : null}
                  {w.sensacao ? <Pill tone="mute">{w.sensacao}</Pill> : null}
                </Row>
                <T size={14.5} w={700}>{tituloTreino(w)}</T>
                <T size={11} color={t.mute}>{curtaData(isoDoTreino(w))}{w.hora ? ` · ${w.hora}` : ""}</T>
              </Col>
              <Pressable accessibilityLabel="Apagar" hitSlop={10} onPress={() => Alert.alert("Apagar este treino?", undefined, [{ text: "Cancelar", style: "cancel" }, { text: "Apagar", style: "destructive", onPress: () => dispatch({ type: "REMOVE_WORKOUT", id: w.id }) }])}>
                <Trash2 size={16} color={t.mute} />
              </Pressable>
            </Row>
            <Row gap={20} wrap>
              {km > 0 ? <Dado l="Distância" v={`${fmtKm(km)} km`} /> : null}
              {km > 0 ? <Dado l="Pace" v={`${pace(w.duracaoMin, km)} /km`} /> : null}
              <Dado l="Tempo" v={fmtDur(w.duracaoMin)} />
              <Dado l="Calorias" v={`${fmtInt(w.kcal)}${w.kcalInformado ? "" : " est."}`} />
              {w.fcMedia ? <Dado l="FC média" v={`${w.fcMedia} bpm`} /> : null}
              {w.pse ? <Dado l="Esforço" v={`${w.pse}/10`} /> : null}
            </Row>
            {w.notas ? <Muted>{w.notas}</Muted> : null}
            <Button size="sm" variant="ghost" icon={<Share2 size={14} color={t.ink} />} style={{ alignSelf: "flex-start" }} onPress={() => openShare(w)}>Criar card para postar</Button>
          </Card>
        );
      })}
    </>
  );
}

function Recorde({ l, v, s }: { l: string; v: string; s: string }) {
  const t = useTheme();
  return (
    <Card pad={14} gap={2}>
      <T size={11} w={600} color={t.mute}>{l}</T>
      <T size={19} mono>{v}</T>
      <T size={10.5} color={t.mute} lines={1}>{s}</T>
    </Card>
  );
}
function Dado({ l, v }: { l: string; v: string }) {
  const t = useTheme();
  return (
    <Col gap={0}>
      <T size={10} w={700} color={t.mute} upper track={0.5}>{l}</T>
      <T size={15} mono>{v}</T>
    </Col>
  );
}

function PaceChart({ runs, W }: { runs: Workout[]; W: number }) {
  const t = useTheme();
  const ps = runs.map((w) => w.duracaoMin / kmDoTreino(w));
  const mn = Math.floor(Math.min(...ps) * 2) / 2 - 0.5;
  const mx = Math.ceil(Math.max(...ps) * 2) / 2 + 0.5;
  const H = 130, L = 40, B = 18;
  const xs = (i: number) => L + 8 + (i * (W - L - 16)) / (runs.length - 1);
  const ys = (v: number) => 8 + ((v - mn) / (mx - mn)) * (H - B - 8);
  const pts = ps.map((v, i) => `${xs(i)},${ys(v)}`).join(" ");
  const cor = corDe("Corrida");
  return (
    <Svg width={W} height={H}>
      {[0, 1, 2].map((k) => {
        const v = mn + ((mx - mn) / 2) * k;
        return (
          <G key={k}>
            <Line x1={L} x2={W} y1={ys(v)} y2={ys(v)} stroke={t.line} />
            <SvgText x={L - 6} y={ys(v) + 4} textAnchor="end" fontSize={10} fill={t.mute}>{pace(v, 1)}</SvgText>
          </G>
        );
      })}
      <Polygon points={`${xs(0)},${H - B} ${pts} ${xs(ps.length - 1)},${H - B}`} fill={cor} opacity={0.12} />
      <Polyline points={pts} fill="none" stroke={cor} strokeWidth={2.5} strokeLinejoin="round" />
      {ps.map((v, i) => <Circle key={i} cx={xs(i)} cy={ys(v)} r={i === ps.length - 1 ? 5 : 3} fill={cor} />)}
    </Svg>
  );
}
