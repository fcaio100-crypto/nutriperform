import { useState } from "react";
import { useStore } from "../state/store";
import { useUi } from "../state/ui";
import { ATIVIDADES, OBJETIVOS, PERGUNTAS_SAUDE, fmtInt, metas } from "../lib/calc";
import { Button, Chips, Field, Input, Select, Toggle, cx } from "../components/ui";
import { MODALIDADES } from "../data/exercises";

const ETAPAS = ["Você", "Medidas", "Objetivo", "Saúde", "Rotina", "Pronto"];

export default function Onboarding() {
  const { state, dispatch } = useStore();
  const { close } = useUi();
  const [i, setI] = useState(0);
  const p = state.profile;
  const up = (patch: Partial<typeof p>) => dispatch({ type: "UPDATE_PROFILE", patch });
  const num = (v: string) => parseFloat(v.replace(",", ".")) || 0;
  const m = metas(p, state.deficit, state.protPerKg, state.fatPct, state.gastoManualAtivo ? state.gastoManualKcal : undefined);

  function concluir() {
    dispatch({ type: "SET_ONBOARDING_DONE", done: true });
    close();
  }

  return (
    <div className="fixed inset-0 z-50 bg-surface dark:bg-surface-dark overflow-y-auto anim-fade">
      <div className="max-w-[520px] mx-auto px-5 pt-6 pb-10 flex flex-col gap-5 min-h-full">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[12px] text-brand tracking-wide uppercase">Etapa {i + 1} de {ETAPAS.length}</span>
          {state.onboardingDone && <button type="button" onClick={close} className="text-[12.5px] font-semibold text-ink-mute">Fechar</button>}
        </div>
        <div className="flex gap-1.5">
          {ETAPAS.map((_, k) => <div key={k} className={cx("flex-1 h-1.5 rounded-full", k <= i ? "bg-brand" : "bg-line dark:bg-line-dark")} />)}
        </div>

        {i === 0 && (
          <Step title="Vamos nos conhecer" text="Com isso o app calcula suas metas.">
            <Field label="Nome"><Input value={p.nome} onChange={(e) => up({ nome: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Idade"><Input inputMode="numeric" value={p.idade || ""} onChange={(e) => up({ idade: Math.round(num(e.target.value)) })} /></Field>
              <Field label="Sexo"><Select value={p.sexo} onChange={(e) => up({ sexo: e.target.value as typeof p.sexo })}><option>Masculino</option><option>Feminino</option></Select></Field>
            </div>
          </Step>
        )}
        {i === 1 && (
          <Step title="Medidas de hoje" text="Só peso e altura são obrigatórios.">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Peso (kg)"><Input inputMode="decimal" defaultValue={p.peso || ""} onChange={(e) => up({ peso: num(e.target.value) })} /></Field>
              <Field label="Altura (cm)"><Input inputMode="numeric" defaultValue={p.altura || ""} onChange={(e) => up({ altura: num(e.target.value) })} /></Field>
              <Field label="Abdômen (cm)"><Input inputMode="decimal" defaultValue={p.abdomen || ""} onChange={(e) => up({ abdomen: num(e.target.value) })} /></Field>
              <Field label="% de gordura"><Input inputMode="decimal" defaultValue={p.gordura || ""} onChange={(e) => up({ gordura: num(e.target.value) })} /></Field>
            </div>
          </Step>
        )}
        {i === 2 && (
          <Step title="Qual é o seu objetivo?">
            <div className="flex flex-col gap-2">
              {OBJETIVOS.map((o) => (
                <button key={o} type="button" onClick={() => up({ objetivo: o })} className={cx("p-3.5 rounded-xl text-left font-semibold text-[13px] border-2", p.objetivo === o ? "border-brand bg-brand-soft dark:bg-brand-softDark" : "border-transparent bg-surface-card dark:bg-surface-cardDark")}>{o}</button>
              ))}
            </div>
            <Field label="Peso desejado (kg)" hint="Ritmo seguro: 0,25 a 0,75% do peso por semana. O app não incentiva perda rápida.">
              <Input inputMode="decimal" defaultValue={p.pesoDesejado || ""} onChange={(e) => up({ pesoDesejado: num(e.target.value) })} />
            </Field>
          </Step>
        )}
        {i === 3 && (
          <Step title="Saúde e segurança" text="Só para deixar as sugestões mais seguras. Nada aqui é diagnóstico, e você pode rever em Perfil.">
            {PERGUNTAS_SAUDE.map((q) => (
              <Toggle key={q.key} on={!!state.healthScreening[q.key]} onChange={(v) => dispatch({ type: "UPDATE_HEALTH_SCREENING", patch: { [q.key]: v } })} label={q.pergunta} />
            ))}
          </Step>
        )}
        {i === 4 && (
          <Step title="Sua rotina">
            <Field label="Modalidade principal">
              <Chips value={p.modalidadePrincipal ?? "Musculação"} onChange={(v) => up({ modalidadePrincipal: v })} options={MODALIDADES.map((x) => ({ v: x, label: x }))} small />
            </Field>
            <Field label="Nível de atividade">
              <div className="flex flex-col gap-2">
                {ATIVIDADES.map(([a, , d]) => (
                  <button key={a} type="button" onClick={() => up({ atividade: a })} className={cx("p-3 rounded-xl text-left border-2", p.atividade === a ? "border-brand bg-brand-soft dark:bg-brand-softDark" : "border-transparent bg-surface-card dark:bg-surface-cardDark")}>
                    <div className="font-semibold text-[13px]">{a}</div>
                    <div className="text-[11.5px] text-ink-mute">{d}</div>
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Dias de treino de força por semana">
              <Chips value={p.diasTreinoSemana} onChange={(v) => up({ diasTreinoSemana: v })} options={[1, 2, 3, 4, 5, 6].map((n) => ({ v: n, label: String(n) }))} />
            </Field>
            <Field label="Minutos por sessão">
              <Chips value={p.minutosPorTreino} onChange={(v) => up({ minutosPorTreino: v })} options={[30, 45, 60, 75, 90].map((n) => ({ v: n, label: `${n}` }))} />
            </Field>
          </Step>
        )}
        {i === 5 && (
          <Step title={`Tudo pronto${p.nome ? `, ${p.nome.split(" ")[0]}` : ""}!`} text="Suas metas diárias de partida (dá para ajustar em Progresso › Metas):">
            <div className="grid grid-cols-2 gap-3">
              <Res l="Meta de calorias" v={`${fmtInt(m.meta)} kcal`} />
              <Res l="Gasto estimado" v={`${fmtInt(m.get)} kcal`} />
              <Res l="Proteína" v={`${fmtInt(m.proteina)} g`} />
              <Res l="Carboidrato" v={`${fmtInt(m.carboidrato)} g`} />
            </div>
          </Step>
        )}

        <div className="mt-auto flex gap-3 pt-2">
          {i > 0 && <Button variant="secondary" onClick={() => setI(i - 1)} className="flex-1">Voltar</Button>}
          {i < ETAPAS.length - 1 ? (
            <Button onClick={() => setI(i + 1)} className="flex-[2]">Continuar</Button>
          ) : (
            <Button onClick={concluir} className="flex-[2]">Começar</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 anim-rise">
      <div className="flex flex-col gap-1">
        <h2 className="font-extrabold text-[24px] tracking-tight leading-tight">{title}</h2>
        {text && <span className="text-[13px] text-ink-soft leading-relaxed">{text}</span>}
      </div>
      {children}
    </div>
  );
}

function Res({ l, v }: { l: string; v: string }) {
  return (
    <div className="p-4 rounded-2xl bg-surface-card dark:bg-surface-cardDark border border-line dark:border-line-dark">
      <div className="text-[11.5px] text-ink-mute font-semibold">{l}</div>
      <div className="font-mono text-[18px] mt-0.5">{v}</div>
    </div>
  );
}
