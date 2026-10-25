import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useStore } from "../../state/store";
import { aguaMetaL, fmtDec } from "../../lib/calc";
import { Button, Card, Field, Input, Muted, Ring } from "../../components/ui";
import { DayNav } from "../../components/shell";

export default function Agua() {
  const { state, dispatch } = useStore();
  const [outro, setOutro] = useState("");
  const l = state.waterMl / 1000;
  const meta = aguaMetaL(state);
  const copos = Math.round(state.waterMl / 250);
  const falta = Math.max(0, meta * 1000 - state.waterMl);
  const add = (ml: number) => dispatch({ type: "ADD_WATER", ml });

  return (
    <>
      <DayNav />
      <Card className="p-5 flex flex-col items-center gap-4">
        <Ring pct={meta > 0 ? (l / meta) * 100 : 0} size={150} stroke={14} color="#3B82C4">
          <span className="font-mono text-[28px] leading-none">{fmtDec(l)}</span>
          <span className="text-[11px] text-ink-mute font-semibold mt-1">de {fmtDec(meta)} L</span>
        </Ring>
        <Muted className="text-[12.5px] font-semibold">{copos} copos de 250 ml · {falta > 0 ? `faltam ${fmtDec(falta / 1000)} L` : "meta batida 🎉"}</Muted>
        <div className="grid grid-cols-3 gap-2 w-full">
          <Button variant="ghost" onClick={() => add(-250)}><Minus size={16} /> 250</Button>
          <Button onClick={() => add(250)} className="!bg-water"><Plus size={16} /> 250 ml</Button>
          <Button onClick={() => add(500)} className="!bg-water"><Plus size={16} /> 500 ml</Button>
        </div>
        <div className="flex gap-2 w-full">
          <Input inputMode="numeric" value={outro} onChange={(e) => setOutro(e.target.value.replace(/\D/g, ""))} placeholder="Outra quantidade (ml)" />
          <Button variant="secondary" onClick={() => { const v = Number(outro); if (v) { add(v); setOutro(""); } }}>Adicionar</Button>
        </div>
      </Card>
      <Card className="p-4 flex flex-col gap-3">
        <Field label={`Meta: ${state.mlPerKg} ml por kg (${fmtDec(meta)} L/dia)`} hint="Referência de 30 a 40 ml/kg. Ajuste conforme clima e suor.">
          <input type="range" min={25} max={50} value={state.mlPerKg} onChange={(e) => dispatch({ type: "SET_GOALS", patch: { mlPerKg: Number(e.target.value) } })} />
        </Field>
        <Muted className="text-[12px]">Em dia de jogo ou treino longo: +500 a 750 ml por hora de exercício, com eletrólitos acima de 60 min.</Muted>
      </Card>
    </>
  );
}
