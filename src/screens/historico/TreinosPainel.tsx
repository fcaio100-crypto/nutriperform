import { useState } from "react";
import { Flame, Plus, Share2, Trash2 } from "lucide-react";
import { useStore } from "../../state/store";
import { useUi } from "../../state/ui";
import { addDays, fmtInt, parseISO, todayISO } from "../../lib/calc";
import { corDe, entre, fmtDur, fmtKm, inicioSemana, isoDoTreino, kmDoTreino, pace, sequencia, tituloTreino, totaisTreino } from "../../lib/treinos";
import type { Workout } from "../../lib/types";
import { Button, Card, Empty, Muted, Pill, Ring, SectionLabel, cx } from "../../components/ui";

const curtaData = (iso: string) => parseISO(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");

function Variacao({ a, b }: { a: number; b: number }) {
  if (!b) return <span className="text-[10.5px] text-ink-mute">sem semana anterior</span>;
  const pct = Math.round(((a - b) / b) * 100);
  return <span className={cx("text-[10.5px] font-bold", pct >= 0 ? "text-brand" : "text-danger")}>{pct >= 0 ? "▲" : "▼"} {Math.abs(pct)}% <span className="font-medium text-ink-mute">vs anterior</span></span>;
}

function Num({ l, v, u, d }: { l: string; v: string; u?: string; d?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[11px] font-semibold text-ink-mute">{l}</span>
      <span className="font-mono text-[22px] leading-none">{v}{u && <span className="text-[12px] text-ink-mute"> {u}</span>}</span>
      {d}
    </div>
  );
}

export default function TreinosPainel() {
  const { state, dispatch } = useStore();
  const { openWorkout, openShare } = useUi();
  const [filtro, setFiltro] = useState("Todos");
  const ws = state.workouts;
  const hoje = todayISO();
  const ini = inicioSemana(hoje);
  const semana = entre(ws, ini, hoje);
  const anterior = entre(ws, addDays(ini, -7), addDays(ini, -1));
  const s = totaisTreino(semana);
  const p = totaisTreino(anterior);
  const meta = Math.max(1, state.profile.diasTreinoSemana || 3);
  const seq = sequencia(ws);

  if (ws.length === 0)
    return (
      <Card>
        <Empty title="Nenhum treino ainda" text="Registre seu primeiro treino para ver volume, recordes, constância e criar o card para postar." action={<Button size="sm" onClick={() => openWorkout()}><Plus size={15} /> Registrar treino</Button>} />
      </Card>
    );

  // 8 semanas empilhadas por modalidade
  const semanas = Array.from({ length: 8 }, (_, i) => {
    const a = addDays(ini, -7 * (7 - i));
    const lista = entre(ws, a, addDays(a, 6));
    const por: Record<string, number> = {};
    lista.forEach((w) => { por[w.modalidade] = (por[w.modalidade] ?? 0) + w.duracaoMin; });
    return { a, por, tot: lista.reduce((q, w) => q + w.duracaoMin, 0) };
  });
  const yMax = Math.max(60, Math.ceil(Math.max(...semanas.map((x) => x.tot)) / 60) * 60);
  const modsNoGrafico = [...new Set(semanas.flatMap((x) => Object.keys(x.por)))];

  // 30 dias por modalidade
  const ult30 = entre(ws, addDays(hoje, -29), hoje);
  const t30 = totaisTreino(ult30);
  const porMod = Object.entries(
    ult30.reduce<Record<string, { n: number; min: number }>>((acc, w) => {
      const o = acc[w.modalidade] ?? { n: 0, min: 0 };
      acc[w.modalidade] = { n: o.n + 1, min: o.min + w.duracaoMin };
      return acc;
    }, {}),
  ).sort((a, b) => b[1].min - a[1].min);
  const maxMod = Math.max(1, ...porMod.map(([, v]) => v.min));

  // constância: 12 semanas
  const minDia: Record<string, number> = {};
  ws.forEach((w) => { const d = isoDoTreino(w); minDia[d] = (minDia[d] ?? 0) + w.duracaoMin; });
  const iniHeat = addDays(ini, -77);
  const diasAtivos12 = Array.from({ length: 84 }, (_, i) => addDays(iniHeat, i)).filter((d) => d <= hoje && minDia[d]).length;

  // recordes de corrida
  const corridas = ws.filter((w) => w.modalidade === "Corrida" && kmDoTreino(w) > 0);
  const maiorDist = [...corridas].sort((a, b) => kmDoTreino(b) - kmDoTreino(a))[0];
  const ritmo = (w: Workout) => w.duracaoMin / kmDoTreino(w);
  const melhorPace = corridas.filter((w) => kmDoTreino(w) >= 1).sort((a, b) => ritmo(a) - ritmo(b))[0];
  const melhor5 = corridas.filter((w) => kmDoTreino(w) >= 5).sort((a, b) => ritmo(a) - ritmo(b))[0];
  const maisLongo = [...ws].sort((a, b) => b.duracaoMin - a.duracaoMin)[0];

  // pace das últimas corridas
  const ultCorr = [...corridas].sort((a, b) => (isoDoTreino(a) < isoDoTreino(b) ? -1 : 1)).slice(-10);

  const mods = ["Todos", ...new Set(ws.map((w) => w.modalidade))];
  const lista = [...ws].filter((w) => filtro === "Todos" || w.modalidade === filtro).sort((a, b) => (isoDoTreino(b) + (b.hora || "")).localeCompare(isoDoTreino(a) + (a.hora || "")));
  const tl = totaisTreino(lista);

  return (
    <>
      <Card className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Ring pct={Math.min(100, (s.n / meta) * 100)} size={104} stroke={11}>
            <div className="flex flex-col items-center leading-none">
              <span className="font-mono text-[26px]">{s.n}/{meta}</span>
              <span className="text-[9.5px] font-bold text-ink-mute mt-1">TREINOS</span>
            </div>
          </Ring>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-extrabold text-[17px]">Esta semana</span>
            <Muted className="text-[12px]">{curtaData(ini)} – {curtaData(addDays(ini, 6))}</Muted>
            <span className="text-[12px] font-semibold">{s.n >= meta ? "Meta da semana batida ✓" : `Faltam ${meta - s.n} para a meta`}</span>
            {seq > 0 && <span className="inline-flex items-center gap-1 text-[12px] font-bold text-warn"><Flame size={14} /> {seq} {seq > 1 ? "dias seguidos" : "dia seguido"}</span>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Num l="Tempo total" v={fmtDur(s.min)} d={<Variacao a={s.min} b={p.min} />} />
          <Num l="Distância total" v={fmtKm(s.km)} u="km" d={<Variacao a={s.km} b={p.km} />} />
          <Num l="Calorias totais" v={fmtInt(s.kcal)} u="kcal" d={<Variacao a={s.kcal} b={p.kcal} />} />
          <Num l="Esforço médio" v={semana.length ? (semana.reduce((q, w) => q + (w.pse || 0), 0) / semana.length).toFixed(1).replace(".", ",") : "—"} u="/10" />
        </div>
      </Card>

      <SectionLabel>Volume por semana</SectionLabel>
      <Card className="p-4 flex flex-col gap-3">
        <svg viewBox="0 0 340 170" className="w-full h-auto" role="img" aria-label="Minutos de treino por semana">
          {[0, 1, 2, 3].map((k) => {
            const v = (yMax / 3) * k;
            const y = 148 - (v / yMax) * 136;
            return (
              <g key={k}>
                <line x1="32" x2="340" y1={y} y2={y} className="stroke-line dark:stroke-line-dark" strokeWidth="1" />
                <text x="26" y={y + 4} textAnchor="end" className="fill-ink-mute" fontSize="10">{Math.round(v / 60)}h</text>
              </g>
            );
          })}
          {semanas.map((sm, i) => {
            const bw = 38;
            const x = 36 + i * bw;
            let y = 148;
            return (
              <g key={sm.a}>
                {Object.entries(sm.por).map(([m, v]) => {
                  const h = (v / yMax) * 136;
                  y -= h;
                  return <rect key={m} x={x + 4} y={y} width={bw - 8} height={h} rx="3" fill={corDe(m)}><title>{`${m}: ${fmtDur(v)}`}</title></rect>;
                })}
                <text x={x + bw / 2} y="164" textAnchor="middle" fontSize="9.5" className={i === 7 ? "fill-ink dark:fill-white font-bold" : "fill-ink-mute"}>{i === 7 ? "Atual" : curtaData(sm.a).split(" ")[0] + "/" + String(parseISO(sm.a).getMonth() + 1).padStart(2, "0")}</text>
              </g>
            );
          })}
        </svg>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {modsNoGrafico.map((m) => (
            <span key={m} className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft"><i className="w-2.5 h-2.5 rounded-sm" style={{ background: corDe(m) }} />{m}</span>
          ))}
        </div>
      </Card>

      <SectionLabel>Últimos 30 dias</SectionLabel>
      <Card className="p-4 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3">
          <Num l="Treinos" v={String(t30.n)} />
          <Num l="Tempo total" v={fmtDur(t30.min)} />
          <Num l="Calorias totais" v={fmtInt(t30.kcal)} />
        </div>
        <div className="flex flex-col gap-2.5">
          {porMod.map(([m, v]) => (
            <div key={m} className="grid grid-cols-[96px_1fr_auto] items-center gap-2.5 text-[12px]">
              <span className="font-semibold truncate">{m}</span>
              <div className="h-2 rounded-full bg-surface-raised dark:bg-surface-raisedDark overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(v.min / maxMod) * 100}%`, background: corDe(m) }} /></div>
              <span className="font-mono text-[11px] text-ink-soft">{v.n}× · {fmtDur(v.min)}</span>
            </div>
          ))}
        </div>
      </Card>

      <SectionLabel>Constância · 12 semanas</SectionLabel>
      <Card className="p-4 flex flex-col gap-2.5">
        <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
          {Array.from({ length: 84 }, (_, i) => {
            const d = addDays(iniHeat, i);
            const m = minDia[d] ?? 0;
            const a = m ? Math.min(1, 0.3 + m / 120) : 0;
            return <i key={d} title={`${curtaData(d)}: ${m ? fmtDur(m) : "descanso"}`} className={cx("aspect-square rounded-[3px] bg-surface-raised dark:bg-surface-raisedDark", d > hoje && "opacity-30")} style={m ? { background: `rgba(30,142,90,${a})` } : undefined} />;
          })}
        </div>
        <Muted className="text-[11px]">{diasAtivos12} dias com treino nas últimas 12 semanas. Cada coluna é uma semana (seg → dom); mais escuro, mais minutos.</Muted>
      </Card>

      <SectionLabel>Recordes</SectionLabel>
      <div className="grid grid-cols-2 gap-2.5">
        <Recorde l="Maior corrida" v={maiorDist ? `${fmtKm(kmDoTreino(maiorDist))} km` : "—"} s={maiorDist ? curtaData(isoDoTreino(maiorDist)) : "registre a distância"} />
        <Recorde l="Melhor pace" v={melhorPace ? `${pace(melhorPace.duracaoMin, kmDoTreino(melhorPace))} /km` : "—"} s={melhorPace ? `${fmtKm(kmDoTreino(melhorPace))} km · ${curtaData(isoDoTreino(melhorPace))}` : "corridas de 1 km+"} />
        <Recorde l="5 km estimado" v={melhor5 ? fmtDur(ritmo(melhor5) * 5) : "—"} s={melhor5 ? "pelo melhor pace em 5 km+" : "corridas de 5 km+"} />
        <Recorde l="Treino mais longo" v={fmtDur(maisLongo.duracaoMin)} s={`${maisLongo.modalidade} · ${curtaData(isoDoTreino(maisLongo))}`} />
      </div>

      {ultCorr.length >= 2 && (
        <>
          <SectionLabel>Pace das últimas corridas</SectionLabel>
          <Card className="p-4 flex flex-col gap-2">
            <PaceChart runs={ultCorr} />
            <Muted className="text-[11px]">Quanto mais alto o ponto, mais rápido. Último treino em destaque.</Muted>
          </Card>
        </>
      )}

      <SectionLabel action={<button type="button" onClick={() => openWorkout()} className="text-[12px] font-bold text-brand">+ Registrar</button>}>Todos os treinos</SectionLabel>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4">
        {mods.map((m) => (
          <button key={m} type="button" onClick={() => setFiltro(m)} className={cx("px-3 py-1.5 rounded-full text-[11.5px] font-bold whitespace-nowrap flex-none border", filtro === m ? "bg-ink text-white border-ink dark:bg-white dark:text-ink" : "bg-surface-card dark:bg-surface-cardDark border-line dark:border-line-dark text-ink-soft")}>{m}</button>
        ))}
      </div>
      <Muted className="text-[11.5px] px-1">{tl.n} treinos · {fmtDur(tl.min)} · {fmtKm(tl.km)} km · {fmtInt(tl.kcal)} kcal no total</Muted>
      <div className="flex flex-col gap-2.5">
        {lista.slice(0, 60).map((w) => {
          const km = kmDoTreino(w);
          return (
            <Card key={w.id} className="p-4 flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold text-white" style={{ background: corDe(w.modalidade) }}>{w.modalidade}</span>
                    {w.nivel ? <Pill>Nível {w.nivel}</Pill> : null}
                    {w.sensacao ? <Pill tone="mute">{w.sensacao}</Pill> : null}
                  </div>
                  <span className="font-bold text-[14px] leading-snug">{tituloTreino(w)}</span>
                  <span className="text-[11px] text-ink-mute">{curtaData(isoDoTreino(w))}{w.hora ? ` · ${w.hora}` : ""}</span>
                </div>
                <button type="button" aria-label="Apagar" onClick={() => { if (confirm("Apagar este treino?")) dispatch({ type: "REMOVE_WORKOUT", id: w.id }); }} className="text-ink-mute hover:text-danger p-1"><Trash2 size={15} /></button>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                {km > 0 && <Dado l="Distância" v={`${fmtKm(km)} km`} />}
                {km > 0 && <Dado l="Pace" v={`${pace(w.duracaoMin, km)} /km`} />}
                <Dado l="Tempo" v={fmtDur(w.duracaoMin)} />
                <Dado l="Calorias" v={`${fmtInt(w.kcal)}${w.kcalInformado ? "" : " est."}`} />
                {w.fcMedia ? <Dado l="FC média" v={`${w.fcMedia} bpm`} /> : null}
                {w.pse ? <Dado l="Esforço" v={`${w.pse}/10`} /> : null}
              </div>
              {w.notas && <Muted className="text-[12.5px]">{w.notas}</Muted>}
              <Button size="sm" variant="ghost" className="self-start" onClick={() => openShare(w)}><Share2 size={14} /> Criar card para postar</Button>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function Recorde({ l, v, s }: { l: string; v: string; s: string }) {
  return (
    <Card className="p-3.5 flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold text-ink-mute">{l}</span>
      <span className="font-mono text-[19px] leading-tight">{v}</span>
      <span className="text-[10.5px] text-ink-mute truncate">{s}</span>
    </Card>
  );
}

function Dado({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold tracking-wide uppercase text-ink-mute">{l}</span>
      <span className="font-mono text-[15px]">{v}</span>
    </div>
  );
}

function PaceChart({ runs }: { runs: Workout[] }) {
  const ps = runs.map((w) => w.duracaoMin / kmDoTreino(w));
  const mn = Math.floor(Math.min(...ps) * 2) / 2 - 0.5;
  const mx = Math.ceil(Math.max(...ps) * 2) / 2 + 0.5;
  const W = 340, H = 130, L = 40, B = 18;
  const xs = (i: number) => L + 8 + (i * (W - L - 16)) / (runs.length - 1);
  const ys = (v: number) => 8 + ((v - mn) / (mx - mn)) * (H - B - 8);
  const pts = ps.map((v, i) => `${xs(i)},${ys(v)}`).join(" ");
  const cor = corDe("Corrida");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Pace das últimas corridas">
      {[0, 1, 2].map((k) => {
        const v = mn + ((mx - mn) / 2) * k;
        return (
          <g key={k}>
            <line x1={L} x2={W} y1={ys(v)} y2={ys(v)} className="stroke-line dark:stroke-line-dark" />
            <text x={L - 6} y={ys(v) + 4} textAnchor="end" fontSize="10" className="fill-ink-mute">{pace(v, 1)}</text>
          </g>
        );
      })}
      <polygon points={`${xs(0)},${H - B} ${pts} ${xs(ps.length - 1)},${H - B}`} fill={cor} opacity="0.12" />
      <polyline points={pts} fill="none" stroke={cor} strokeWidth="2.5" strokeLinejoin="round" />
      {ps.map((v, i) => (
        <circle key={i} cx={xs(i)} cy={ys(v)} r={i === ps.length - 1 ? 5 : 3} fill={cor}>
          <title>{`${curtaData(isoDoTreino(runs[i]))}: ${pace(v, 1)} /km`}</title>
        </circle>
      ))}
    </svg>
  );
}
