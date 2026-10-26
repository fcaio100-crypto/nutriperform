import { useState } from "react";
import { useStore } from "../state/store";
import { useUi } from "../state/ui";
import { COM_DISTANCIA, MODALIDADES } from "../data/exercises";
import { intensidade, isoToDM, kcalEstimada, nowHM, todayISO } from "../lib/calc";
import { Button, Chips, Field, Input, Sheet } from "../components/ui";
import type { Workout } from "../lib/types";
import { pace } from "../lib/treinos";


export default function WorkoutLog() {
  const { dispatch } = useStore();
  const { close, workoutMod, notify, openShare } = useUi();
  const [mod, setMod] = useState(workoutMod ?? "Musculação");
  const [data, setData] = useState(todayISO());
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
    <Sheet title="Registrar treino" onClose={close} footer={<Button size="lg" onClick={salvar} disabled={!ok}>Salvar e criar card</Button>}>
      <Field label="Modalidade">
        <Chips small value={mod} onChange={setMod} options={MODALIDADES.map((m) => ({ v: m, label: m }))} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data"><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></Field>
        <Field label="Duração (min)"><Input inputMode="numeric" value={min} onChange={(e) => setMin(Number(e.target.value.replace(/\D/g, "")) || 0)} /></Field>
      </div>
      {COM_DISTANCIA.includes(mod) && (
        <Field label="Distância (km)" hint={pace(min, Number(dist.replace(",", "."))) ? `Pace: ${pace(min, Number(dist.replace(",", ".")))} /km` : "O pace é calculado sozinho."}><Input inputMode="decimal" value={dist} onChange={(e) => setDist(e.target.value)} placeholder="Ex.: 5,2" /></Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Título (opcional)"><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={`${mod} da manhã`} /></Field>
        <Field label="FC média (opcional)"><Input inputMode="numeric" value={fc} onChange={(e) => setFc(e.target.value.replace(/\D/g, ""))} placeholder="bpm" /></Field>
      </div>
      <Field label={`Esforço percebido: ${pse}/10 (${intensidade(pse)})`}>
        <input type="range" min={1} max={10} value={pse} onChange={(e) => setPse(Number(e.target.value))} />
      </Field>
      <Field label="Calorias">
        <Chips small value={relogio ? "r" : "e"} onChange={(v) => setRelogio(v === "r")} options={[{ v: "e", label: `Estimar (≈ ${est} kcal)` }, { v: "r", label: "Tenho no relógio/app" }]} />
      </Field>
      {relogio && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="kcal do relógio"><Input inputMode="numeric" value={kcalReal} onChange={(e) => setKcalReal(e.target.value)} placeholder="Ex.: 480" /></Field>
          <Field label="Relógio/app"><Input value={origem} onChange={(e) => setOrigem(e.target.value)} placeholder="Garmin, Strava…" /></Field>
        </div>
      )}
      <Field label="Como foi (opcional)"><Input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Sensações, clima, parceiros…" /></Field>
    </Sheet>
  );
}
