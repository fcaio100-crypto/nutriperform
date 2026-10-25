import { useState } from "react";
import { useStore } from "../../state/store";
import { useUi } from "../../state/ui";
import { ATIVIDADES, fmtDec, fmtInt, metasDoEstado, ritmoPeso, triagem } from "../../lib/calc";
import { Button, Card, Chips, Collapse, Field, Input, Muted, SectionLabel } from "../../components/ui";
import { SafetyCard } from "../../components/shell";
import type { AppState } from "../../lib/types";

export default function Metas() {
  const { state, dispatch } = useStore();
  const { notify } = useUi();
  const p = state.profile;
  const m = metasDoEstado(state);
  const [ritmo, setRitmo] = useState(0.5);
  const [gasto, setGasto] = useState(state.gastoManualKcal ? String(state.gastoManualKcal) : "");
  const r = ritmoPeso(p.peso, p.pesoDesejado, ritmo);
  const consumo = m.get - r.kcalPorDia;
  const impossivel = r.direcao === "deficit" && consumo <= 0;
  const baixo = r.direcao === "deficit" && !impossivel && consumo < m.get * 0.5;
  const vermelho = triagem(state.healthScreening, m.imc, p.idade).nivel === "vermelho";
  const set = (patch: Partial<AppState>) => dispatch({ type: "SET_GOALS", patch });
  const macros = [
    { l: "Proteína", g: m.proteina, k: m.proteina * 4, c: "#1E8E5A" },
    { l: "Carboidrato", g: m.carboidrato, k: m.carboidrato * 4, c: "#C2852B" },
    { l: "Gordura", g: m.gordura, k: m.gordura * 9, c: "#7A6CC4" },
  ];

  return (
    <>
      <Card tone="dark" className="p-5 grid grid-cols-2 gap-4">
        <div>
          <div className="text-[11px] font-bold text-[#8FD3AE] uppercase tracking-wide">Você gasta</div>
          <div className="font-mono text-[22px]">{fmtInt(m.get)}</div>
          <div className="text-[11px] text-[#B9CFC2]">{m.usandoGastoManual ? "informado por você" : "pela fórmula"}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#8FD3AE] uppercase tracking-wide">Você deve comer</div>
          <div className="font-mono text-[22px]">{fmtInt(m.meta)}</div>
          <div className="text-[11px] text-[#B9CFC2]">{state.deficit > 0 ? `déficit de ${fmtInt(state.deficit)}` : state.deficit < 0 ? `superávit de ${fmtInt(-state.deficit)}` : "manutenção"} kcal</div>
        </div>
      </Card>

      <SectionLabel>Macros do dia</SectionLabel>
      <Card className="p-4 flex flex-col gap-3">
        <div className="flex h-3 rounded-full overflow-hidden">
          {macros.map((x) => <div key={x.l} style={{ width: `${(x.k / Math.max(1, m.meta)) * 100}%`, background: x.c }} />)}
        </div>
        {macros.map((x) => (
          <div key={x.l} className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: x.c }} />{x.l}</span>
            <span className="font-mono">{fmtInt(x.g)} g · {fmtInt(x.k)} kcal</span>
          </div>
        ))}
        <Field label={`Proteína: ${fmtDec(state.protPerKg)} g por kg`}>
          <input type="range" min={1.2} max={2.6} step={0.1} value={state.protPerKg} onChange={(e) => set({ protPerKg: Number(e.target.value) })} />
        </Field>
        <Field label={`Gorduras: ${state.fatPct}% das calorias`}>
          <input type="range" min={15} max={40} value={state.fatPct} onChange={(e) => set({ fatPct: Number(e.target.value) })} />
        </Field>
      </Card>

      <SectionLabel>Planejar o ritmo</SectionLabel>
      {vermelho && <SafetyCard compact />}
      <Card className="p-4 flex flex-col gap-3">
        {r.direcao === "manutencao" ? (
          <Muted className="text-[12.5px]">Seu peso atual já é o desejado ({fmtDec(p.pesoDesejado)} kg). Mantenha o ajuste perto de zero.</Muted>
        ) : (
          <>
            <span className="text-[13px]">{fmtDec(p.peso)} kg → <b>{fmtDec(p.pesoDesejado)} kg</b> ({r.direcao === "deficit" ? "perder" : "ganhar"} {fmtDec(r.kgAlvo)} kg)</span>
            <Chips value={ritmo} onChange={setRitmo} options={[0.25, 0.5, 0.75].map((x) => ({ v: x, label: `${String(x).replace(".", ",")}% /sem` }))} />
            <div className="grid grid-cols-2 gap-3">
              <Box l={r.direcao === "deficit" ? "Déficit" : "Superávit"} v={`${fmtInt(Math.abs(r.kcalPorDia))} kcal/dia`} />
              <Box l="Tempo estimado" v={`~${Math.ceil(r.semanas)} semanas`} />
            </div>
            {impossivel && <span className="text-[12px] text-danger">Esse ritmo pede um déficit maior que o seu gasto. Escolha um mais lento.</span>}
            {baixo && <span className="text-[12px] text-warn">Consumo bem abaixo do gasto — um ritmo mais lento é mais sustentável.</span>}
            <Button disabled={impossivel || vermelho} onClick={() => { set({ deficit: r.kcalPorDia }); notify("Meta atualizada"); }}>Aplicar: comer ≈ {fmtInt(consumo)} kcal/dia</Button>
            <Muted className="text-[11px]">Referência de ~7.700 kcal por kg. Ritmos acima de 1% por semana aumentam a perda de massa magra.</Muted>
          </>
        )}
      </Card>

      <Collapse title="Ajuste fino do déficit" subtitle={`${state.deficit >= 0 ? "Déficit" : "Superávit"} atual: ${fmtInt(Math.abs(state.deficit))} kcal`}>
        <input type="range" min={-800} max={1000} step={50} value={state.deficit} onChange={(e) => set({ deficit: Number(e.target.value) })} />
        <Muted className="text-[11.5px]">Direita: comer menos que o gasto. Esquerda: comer mais.</Muted>
      </Collapse>

      <Collapse title="Seu gasto calórico" subtitle={m.usandoGastoManual ? "Usando o valor do seu relógio" : "Calculado pela fórmula"}>
        <Chips value={state.gastoManualAtivo ? "m" : "c"} onChange={(v) => set({ gastoManualAtivo: v === "m" })} options={[{ v: "c", label: "Fórmula" }, { v: "m", label: "Informar (relógio)" }]} />
        {state.gastoManualAtivo && (
          <div className="flex gap-2">
            <Input inputMode="numeric" value={gasto} onChange={(e) => setGasto(e.target.value)} placeholder="Ex.: 2800" />
            <Button variant="secondary" onClick={() => { const v = Math.round(Number(gasto)); if (v > 0) { set({ gastoManualKcal: v }); notify("Gasto atualizado"); } }}>Salvar</Button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Box l="TMB (Mifflin-St Jeor)" v={`${fmtInt(m.tmb)} kcal`} />
          <Box l="Fator de atividade" v={`× ${m.fator}`} />
        </div>
        <Field label="Nível de atividade">
          <Chips small value={p.atividade} onChange={(v) => dispatch({ type: "UPDATE_PROFILE", patch: { atividade: v } })} options={ATIVIDADES.map(([a]) => ({ v: a, label: a }))} />
        </Field>
        <Muted className="text-[11px]">Pela fórmula: {fmtInt(m.getCalculado)} kcal/dia. Quem pesa mais gasta mais, mesmo parado.</Muted>
      </Collapse>
    </>
  );
}

function Box({ l, v }: { l: string; v: string }) {
  return (
    <div className="p-3 rounded-xl bg-surface-raised dark:bg-surface-raisedDark">
      <div className="text-[11px] text-ink-mute font-semibold">{l}</div>
      <div className="font-mono text-[14px] mt-0.5">{v}</div>
    </div>
  );
}
