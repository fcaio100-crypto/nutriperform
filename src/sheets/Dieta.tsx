import { useState } from "react";
import { useStore } from "../state/store";
import { useUi } from "../state/ui";
import { fmtDec, fmtInt, gerarPlano, metas, ritmoPeso, triagem } from "../lib/calc";
import type { PlanMeal } from "../lib/types";
import { Button, Chips, Field, Input, Sheet } from "../components/ui";
import { SafetyCard } from "../components/shell";

export default function Dieta() {
  const { state, dispatch } = useStore();
  const { close, notify } = useUi();
  const p = state.profile;
  const [ritmo, setRitmo] = useState(0.5);
  const calc = metas(p, 0, state.protPerKg, state.fatPct);
  const [gasto, setGasto] = useState(String(state.gastoManualKcal || Math.round(calc.getCalculado)));
  const [plano, setPlano] = useState<PlanMeal[] | null>(null);
  const r = ritmoPeso(p.peso, p.pesoDesejado, ritmo);
  const g = Math.round(Number(gasto));
  const meta = g - r.kcalPorDia;
  const invalido = g > 0 && r.direcao === "deficit" && meta <= 0;
  const bloqueado = triagem(state.healthScreening, calc.imc, p.idade).nivel === "vermelho";
  const pode = g > 0 && !invalido && !bloqueado;

  function aplicar() {
    if (!plano) return;
    dispatch({ type: "APLICAR_DIETA_GERADA", gastoManualKcal: g, deficit: r.kcalPorDia, refeicoes: plano });
    notify("Plano aplicado às suas metas");
    close();
  }

  return (
    <Sheet
      title="Montar meu plano"
      onClose={close}
      footer={plano ? <Button size="lg" onClick={aplicar}>Usar este plano</Button> : <Button size="lg" disabled={!pode} onClick={() => setPlano(gerarPlano(meta))}>Montar plano</Button>}
    >
      {bloqueado && <SafetyCard compact />}
      <span className="text-[12.5px] text-ink-soft leading-relaxed">
        A partir do seu gasto diário e do objetivo de chegar a <b>{fmtDec(p.pesoDesejado)} kg</b>, o app monta um cardápio com as calorias certas.
      </span>
      <Field label="Quanto você gasta por dia (kcal)" hint={`Use a média do relógio (7–14 dias). Pela fórmula: ≈ ${fmtInt(calc.getCalculado)} kcal.`}>
        <Input inputMode="numeric" value={gasto} onChange={(e) => { setGasto(e.target.value); setPlano(null); }} />
      </Field>
      {r.direcao !== "manutencao" && (
        <Field label="Ritmo por semana">
          <Chips value={ritmo} onChange={(v) => { setRitmo(v); setPlano(null); }} options={[0.25, 0.5, 0.75].map((x) => ({ v: x, label: `${String(x).replace(".", ",")}%` }))} />
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Box l={r.direcao === "superavit" ? "Superávit" : "Déficit"} v={`${fmtInt(Math.abs(r.kcalPorDia))} kcal/dia`} />
        <Box l="Você vai comer" v={g > 0 ? `${fmtInt(meta)} kcal/dia` : "—"} />
      </div>
      {r.semanas > 0 && <span className="text-[11.5px] text-ink-mute">Estimativa: ~{Math.ceil(r.semanas)} semanas ({fmtDec(r.kgPorSemana, 2)} kg/semana).</span>}
      {invalido && <span className="text-[12px] text-danger">Esse ritmo pede um déficit maior que o seu gasto. Escolha um ritmo mais lento.</span>}
      {plano && (
        <div className="flex flex-col gap-2 anim-rise">
          {plano.map((m) => (
            <div key={m.id} className="p-3 rounded-xl bg-surface-raised dark:bg-surface-raisedDark">
              <div className="flex justify-between text-[12.5px] font-bold"><span>{m.hora} · {m.nome}</span><span className="font-mono">{m.kcal} kcal</span></div>
              <div className="text-[11.5px] text-ink-soft mt-0.5">{m.descricao}</div>
            </div>
          ))}
          <span className="text-[11px] text-ink-mute">Total: {fmtInt(plano.reduce((s, m) => s + m.kcal, 0))} kcal. Usar este plano substitui o plano atual e ajusta suas metas.</span>
        </div>
      )}
    </Sheet>
  );
}

function Box({ l, v }: { l: string; v: string }) {
  return (
    <div className="p-3.5 rounded-xl bg-surface-raised dark:bg-surface-raisedDark">
      <div className="text-[11px] text-ink-mute font-semibold">{l}</div>
      <div className="font-mono text-[15px] mt-0.5">{v}</div>
    </div>
  );
}
