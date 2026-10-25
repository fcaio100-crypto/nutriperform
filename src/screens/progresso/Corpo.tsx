import { Plus } from "lucide-react";
import { useStore } from "../../state/store";
import { useUi } from "../../state/ui";
import { fmtDec, metasDoEstado } from "../../lib/calc";
import { Button, Card, LineChart, Muted, SectionLabel, Stat } from "../../components/ui";

export default function Corpo() {
  const { state } = useStore();
  const { openWeight, openOnboarding } = useUi();
  const p = state.profile;
  const m = metasDoEstado(state);
  const pesos = state.weights.length ? state.weights : [{ data: "hoje", peso: p.peso }];
  const atual = pesos[pesos.length - 1].peso;
  const inicial = pesos[0].peso;
  const ult4 = pesos.slice(-4);
  const media = ult4.reduce((s, x) => s + x.peso, 0) / ult4.length;
  const diff = atual - inicial;
  const falta = Math.abs(atual - p.pesoDesejado);
  const caminho = Math.abs(inicial - p.pesoDesejado);
  const pctMeta = caminho > 0 ? Math.min(100, (Math.abs(inicial - atual) / caminho) * 100) : 100;

  return (
    <>
      <Card className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11.5px] font-semibold text-ink-mute">Peso atual</div>
            <div className="font-mono text-[34px] leading-none mt-1">{fmtDec(atual)}<span className="text-[14px] text-ink-mute"> kg</span></div>
          </div>
          <Button size="sm" onClick={openWeight}><Plus size={15} /> Registrar</Button>
        </div>
        <span className="text-[12.5px] font-semibold text-brand">{diff <= 0 ? "−" : "+"}{fmtDec(Math.abs(diff))} kg desde o início · faltam {fmtDec(falta)} kg para {fmtDec(p.pesoDesejado)} kg</span>
        {pesos.length > 1 ? <LineChart values={pesos.map((x) => x.peso)} height={130} /> : <Muted className="text-[12px] py-4 text-center">Registre seu peso algumas vezes para ver o gráfico.</Muted>}
        <div className="h-2 rounded-full bg-surface-raised dark:bg-surface-raisedDark overflow-hidden"><div className="h-full bg-brand rounded-full" style={{ width: `${pctMeta}%` }} /></div>
        <span className="text-[11px] text-ink-mute">{Math.round(pctMeta)}% do caminho até a meta</span>
      </Card>

      <div className="grid grid-cols-3 gap-2.5">
        <Stat label="Média (4)" value={fmtDec(media)} unit="kg" />
        <Stat label="Inicial" value={fmtDec(inicial)} unit="kg" />
        <Stat label="Meta" value={fmtDec(p.pesoDesejado)} unit="kg" />
      </div>

      <SectionLabel action={<button type="button" onClick={openOnboarding} className="text-[12px] font-bold text-brand">Atualizar medidas</button>}>Medidas</SectionLabel>
      <div className="grid grid-cols-2 gap-2.5">
        <Card tone="soft" className="p-4 col-span-2 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-brand uppercase tracking-wide">IMC</div>
            <div className="font-mono text-[26px]">{fmtDec(m.imc)}</div>
          </div>
          <span className="font-bold text-[13px]">{m.imcClasse}</span>
        </Card>
        <Stat label="Abdômen" value={p.abdomen ? fmtDec(p.abdomen) : "—"} unit={p.abdomen ? "cm" : undefined} />
        <Stat label="% de gordura" value={p.gordura ? fmtDec(p.gordura) : "—"} unit={p.gordura ? "%" : undefined} />
        <Stat label="Altura" value={p.altura} unit="cm" />
        <Stat label="Objetivo" value={<span className="text-[13px] font-sans font-bold">{p.objetivo}</span>} />
      </div>
      <Muted className="text-[11px]">O IMC não diferencia músculo de gordura. Em quem treina, olhe junto com medidas e % de gordura.</Muted>
    </>
  );
}
