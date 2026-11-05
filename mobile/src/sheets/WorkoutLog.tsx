import { useState } from "react";
import { useStore } from "../state/store";
import { useUi } from "../state/ui";
import { COM_DISTANCIA, MODALIDADES } from "../data/exercises";
import { addDays, intensidade, isoToDM, kcalEstimada, nowHM, todayISO } from "../lib/calc";
import type { Workout } from "../lib/types";
import { pace } from "../lib/treinos";
import { Button, Chips, Field, Grid, Input, Sheet, Slider } from "../components/ui";

export default function WorkoutLog() {
  const { dispatch } = useStore();
  const { close, workoutMod, notify, openShare } = useUi();
  const [mod, setMod] = useState(workoutMod ?? "Musculação");
  const hoje = todayISO();
  const [data, setData] = useState(hoje);
  const [min, setMin] = useState(mod === "Mobilidade" ? 10 : 60);
  const [pse, setPse] = useState(6);
  const [dist, setDist] = useState("");
  const [relogio, setRelogio] = useState(false);
  const [kcalReal, setKcalReal] = useState("");
  const [origem, setOrigem] = useState("");
  const [titulo, setTitulo] = useState("");
  const [fc, setFc] = useState("");
  const [notas, setNotas] = useState("");
  const est = kcalEstimada(min, pse);
  const kr = Math.round(Number(kcalReal));
  const ok = !relogio || kr > 0;
  const ritmo = pace(min, Number(dist.replace(",", ".")));
  const dias = Array.from({ length: 7 }, (_, i) => addDays(hoje, -i));

  function salvar() {
    if (!ok) return;
    const fcN = Math.round(Number(fc));
    const w: Workout = {
      id: Date.now(), modalidade: mod, data: isoToDM(data), dataISO: data, hora: nowHM(), duracaoMin: min, intensidade: intensidade(pse),
      distancia: COM_DISTANCIA.includes(mod) && dist.trim() ? (/[a-z]/i.test(dist) ? dist.trim() : `${dist.trim()} km`) : "—",
      kcal: relogio ? kr : est, pse, origem: relogio ? origem.trim() || "Relógio/app" : undefined, kcalInformado: relogio,
      titulo: titulo.trim() || undefined, fcMedia: fcN > 0 ? fcN : undefined, notas: notas.trim() || undefined,
    };
    dispatch({ type: "ADD_WORKOUT", workout: w });
    notify(`${mod} registrado`);
    openShare(w);
  }

  return (
    <Sheet title="Registrar treino" onClose={close} footer={<Button size="lg" onPress={salvar} disabled={!ok}>Salvar e criar card</Button>}>
      <Field label="Modalidade"><Chips small value={mod} onChange={setMod} options={MODALIDADES.map((m) => ({ v: m, label: m }))} /></Field>
      <Field label="Data">
        <Chips small scroll value={data} onChange={setData} options={dias.map((d, i) => ({ v: d, label: i === 0 ? "Hoje" : i === 1 ? "Ontem" : isoToDM(d) }))} />
      </Field>
      <Field label="Duração (min)"><Input keyboardType="number-pad" value={String(min || "")} onChangeText={(v) => setMin(Number(v.replace(/\D/g, "")) || 0)} /></Field>
      {COM_DISTANCIA.includes(mod) ? (
        <Field label="Distância (km)" hint={ritmo ? `Pace: ${ritmo} /km` : "O pace é calculado sozinho."}><Input keyboardType="decimal-pad" value={dist} onChangeText={setDist} placeholder="Ex.: 5,2" /></Field>
      ) : null}
      <Grid cols={2} gap={12}>
        <Field label="Título (opcional)"><Input value={titulo} onChangeText={setTitulo} placeholder={`${mod} da manhã`} /></Field>
        <Field label="FC média (opcional)"><Input keyboardType="number-pad" value={fc} onChangeText={(v) => setFc(v.replace(/\D/g, ""))} placeholder="bpm" /></Field>
      </Grid>
      <Field label={`Esforço percebido: ${pse}/10 (${intensidade(pse)})`}><Slider min={1} max={10} value={pse} onChange={setPse} /></Field>
      <Field label="Calorias">
        <Chips small value={relogio ? "r" : "e"} onChange={(v) => setRelogio(v === "r")} options={[{ v: "e", label: `Estimar (≈ ${est} kcal)` }, { v: "r", label: "Tenho no relógio/app" }]} />
      </Field>
      {relogio ? (
        <Grid cols={2} gap={12}>
          <Field label="kcal do relógio"><Input keyboardType="number-pad" value={kcalReal} onChangeText={setKcalReal} placeholder="Ex.: 480" /></Field>
          <Field label="Relógio/app"><Input value={origem} onChangeText={setOrigem} placeholder="Garmin, Strava…" /></Field>
        </Grid>
      ) : null}
      <Field label="Como foi (opcional)"><Input value={notas} onChangeText={setNotas} placeholder="Sensações, clima, parceiros…" multiline /></Field>
    </Sheet>
  );
}
