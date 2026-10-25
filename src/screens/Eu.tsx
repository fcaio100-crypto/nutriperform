import { useState } from "react";
import { ArrowLeft, CalendarDays, ChevronRight, Cloud, CloudOff, Dumbbell, Flame, LogOut, Pill as PillIcon, RefreshCcw, ShieldCheck, User, UserPlus, Utensils } from "lucide-react";
import { useStore } from "../state/store";
import { useUi } from "../state/ui";
import { ATIVIDADES, OBJETIVOS, PERGUNTAS_SAUDE, fmtInt, metasDoEstado } from "../lib/calc";
import { emailValido, hashPassword, newSalt, regrasSenha, senhaForte } from "../lib/auth";
import { AGENDA_PADRAO, DIAS_SEMANA, OPCOES_TREINO } from "../data/exercises";
import { Button, Card, Chips, Field, Input, Muted, Select, Toggle, cx } from "../components/ui";
import { SafetyCard } from "../components/shell";
import { supabase } from "../lib/supabase";
import Musculacao from "./eu/Musculacao";
import Metas from "./eu/Metas";
import Plano from "./eu/Plano";
import Suplementos from "./eu/Suplementos";

const PAGINAS = {
  dados: { t: "Meus dados", icon: User, C: MeusDados },
  semana: { t: "Minha semana de treino", icon: CalendarDays, C: SemanaTreino },
  musc: { t: "Rotina de musculação", icon: Dumbbell, C: Musculacao },
  metas: { t: "Metas e calorias", icon: Flame, C: Metas },
  plano: { t: "Plano alimentar", icon: Utensils, C: Plano },
  supl: { t: "Suplementos", icon: PillIcon, C: Suplementos },
  saude: { t: "Saúde e segurança", icon: ShieldCheck, C: Saude },
} as const;
type Pag = keyof typeof PAGINAS;

export default function Eu() {
  const { state, dispatch, sync } = useStore();
  const { sub, setSub, notify } = useUi();
  const pag = sub.eu as Pag | "";
  const p = state.profile;
  const m = metasDoEstado(state);
  const user = state.users.find((u) => u.email === state.auth.currentUserEmail);

  if (pag && PAGINAS[pag]) {
    const P = PAGINAS[pag];
    return (
      <>
        <button type="button" onClick={() => setSub("eu", "")} className="self-start flex items-center gap-1.5 text-[13px] font-bold text-ink-soft py-1"><ArrowLeft size={18} /> Eu</button>
        <h1 className="font-extrabold text-[24px] tracking-tight leading-tight -mt-2">{P.t}</h1>
        <P.C />
      </>
    );
  }

  const iniciais = p.nome.split(" ").filter(Boolean).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "?";
  const resumo: Record<Pag, string> = {
    dados: `${p.peso} kg · ${p.altura} cm · ${p.objetivo}`,
    semana: DIAS_SEMANA.map((_, i) => (state.agenda ?? AGENDA_PADRAO)[String((i + 1) % 7)]).filter((x) => x !== "Descanso").length + " dias de treino",
    musc: state.treinoPersonalizadoAtivo ? "Rotina do meu personal" : "Sugestão do app",
    metas: `${fmtInt(m.meta)} kcal/dia`,
    plano: state.planoPersonalizadoAtivo ? "Meu plano" : "Sugestão do app",
    supl: `${state.supplements.length} cadastrados`,
    saude: "Triagem e avisos",
  };

  return (
    <>
      <Card className="p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-brand text-white font-extrabold text-[18px] flex items-center justify-center flex-none">{iniciais}</div>
        <div className="min-w-0">
          <div className="font-extrabold text-[18px] truncate">{p.nome || "Sem nome"}</div>
          <div className="text-[12.5px] text-ink-mute">{p.peso} kg → meta {p.pesoDesejado} kg</div>
        </div>
      </Card>

      <Card className="divide-y divide-line dark:divide-line-dark overflow-hidden">
        {(Object.keys(PAGINAS) as Pag[]).map((k) => {
          const { t, icon: Icon } = PAGINAS[k];
          return (
            <button key={k} type="button" onClick={() => setSub("eu", k)} className="w-full px-4 py-3.5 flex items-center gap-3 text-left">
              <span className="w-9 h-9 rounded-xl bg-brand-soft dark:bg-brand-softDark text-brand flex items-center justify-center flex-none"><Icon size={18} /></span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[14px]">{t}</div>
                <div className="text-[11.5px] text-ink-mute truncate">{resumo[k]}</div>
              </div>
              <ChevronRight size={18} className="text-ink-mute flex-none" />
            </button>
          );
        })}
      </Card>

      <Card className="p-4 flex items-center justify-between gap-3">
        <span className="font-semibold text-[14px]">Tema</span>
        <Chips small value={state.theme} onChange={(v) => dispatch({ type: "SET_THEME", theme: v })} options={[{ v: "Claro", label: "Claro" }, { v: "Escuro", label: "Escuro" }]} />
      </Card>

      <div className="flex items-center gap-2 px-1 text-[12px] text-ink-mute">
        {sync === "synced" ? <Cloud size={15} className="text-brand" /> : <CloudOff size={15} className="text-warn" />}
        {sync === "synced" ? "Dados salvos e sincronizados" : sync === "checking" ? "Verificando conexão…" : "Dados salvos só neste aparelho"}
      </div>

      {user?.role === "admin" && <Admin />}

      <Button variant="danger" size="lg" onClick={() => { if (supabase) supabase.auth.signOut(); dispatch({ type: "LOGOUT" }); notify("Você saiu da conta"); }}><LogOut size={17} /> Sair da conta</Button>
    </>
  );
}

function MeusDados() {
  const { state, dispatch } = useStore();
  const { openOnboarding } = useUi();
  const p = state.profile;
  const num = (v: string) => parseFloat(v.replace(",", ".")) || 0;
  const up = (patch: Partial<typeof p>) => dispatch({ type: "UPDATE_PROFILE", patch });
  return (
    <Card className="p-4 flex flex-col gap-3">
      <Field label="Nome"><Input value={p.nome} onChange={(e) => up({ nome: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Idade"><Input inputMode="numeric" defaultValue={p.idade} onChange={(e) => up({ idade: Math.round(num(e.target.value)) })} /></Field>
        <Field label="Sexo"><Select value={p.sexo} onChange={(e) => up({ sexo: e.target.value as typeof p.sexo })}><option>Masculino</option><option>Feminino</option></Select></Field>
        <Field label="Peso (kg)"><Input inputMode="decimal" defaultValue={p.peso} onChange={(e) => up({ peso: num(e.target.value) })} /></Field>
        <Field label="Altura (cm)"><Input inputMode="numeric" defaultValue={p.altura} onChange={(e) => up({ altura: num(e.target.value) })} /></Field>
        <Field label="Peso desejado (kg)"><Input inputMode="decimal" defaultValue={p.pesoDesejado} onChange={(e) => up({ pesoDesejado: num(e.target.value) })} /></Field>
        <Field label="% de gordura"><Input inputMode="decimal" defaultValue={p.gordura || ""} onChange={(e) => up({ gordura: num(e.target.value) })} /></Field>
      </div>
      <Field label="Objetivo"><Select value={p.objetivo} onChange={(e) => up({ objetivo: e.target.value })}>{OBJETIVOS.map((o) => <option key={o}>{o}</option>)}</Select></Field>
      <Field label="Nível de atividade"><Select value={p.atividade} onChange={(e) => up({ atividade: e.target.value })}>{ATIVIDADES.map(([a]) => <option key={a}>{a}</option>)}</Select></Field>
      <Button variant="secondary" onClick={openOnboarding}><RefreshCcw size={15} /> Refazer cadastro guiado</Button>
    </Card>
  );
}

function SemanaTreino() {
  const { state, dispatch } = useStore();
  const ag = state.agenda ?? AGENDA_PADRAO;
  const ordem = [1, 2, 3, 4, 5, 6, 0];
  return (
    <>
      <Muted className="text-[12.5px]">Escolha o treino de cada dia. A tela Hoje mostra o treino do dia automaticamente.</Muted>
      <Card className="divide-y divide-line dark:divide-line-dark">
        {ordem.map((d) => (
          <div key={d} className="px-4 py-3 flex items-center justify-between gap-3">
            <span className="font-semibold text-[14px] w-20">{DIAS_SEMANA[d]}</span>
            <Select value={ag[String(d)]} onChange={(e) => dispatch({ type: "SET_AGENDA", dia: String(d), mod: e.target.value })} className={cx("flex-1 py-2.5", ag[String(d)] === "Descanso" && "text-ink-mute")}>
              {OPCOES_TREINO.map((o) => <option key={o}>{o}</option>)}
            </Select>
          </div>
        ))}
      </Card>
      <Muted className="text-[11.5px]">Dica: alterne treinos fortes com dias leves (mobilidade ou descanso). Antes de jogo, prefira mobilidade.</Muted>
    </>
  );
}

function Saude() {
  const { state, dispatch } = useStore();
  return (
    <>
      <SafetyCard />
      {PERGUNTAS_SAUDE.map((q) => (
        <Toggle key={q.key} on={!!state.healthScreening[q.key]} onChange={(v) => dispatch({ type: "UPDATE_HEALTH_SCREENING", patch: { [q.key]: v } })} label={q.pergunta} />
      ))}
      <Muted className="text-[11px]">O app não diagnostica, não prescreve e não incentiva dietas extremas.</Muted>
    </>
  );
}

function Admin() {
  const { state, dispatch } = useStore();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState<"user" | "admin">("user");
  const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null);
  const [aberto, setAberto] = useState(false);

  async function criar() {
    const e = email.trim().toLowerCase();
    if (!nome.trim()) return setMsg({ t: "Informe o nome." });
    if (!emailValido(e)) return setMsg({ t: "E-mail inválido." });
    if (state.users.some((u) => u.email === e)) return setMsg({ t: "Já existe uma conta com este e-mail." });
    if (regrasSenha(senha).some((r) => !r.ok)) return setMsg({ t: "A senha não atende aos requisitos." });
    const salt = newSalt();
    dispatch({ type: "ADMIN_CREATE_USER", user: { email: e, name: nome.trim(), passHash: await hashPassword(senha, salt), passSalt: salt, createdAt: new Date().toISOString(), role: papel } });
    setMsg({ t: "Conta criada.", ok: true });
    setNome(""); setEmail(""); setSenha("");
  }

  return (
    <Card className="p-4 flex flex-col gap-3">
      <button type="button" onClick={() => setAberto(!aberto)} className="flex items-center justify-between text-left">
        <span className="font-semibold text-[14px] flex items-center gap-2"><UserPlus size={16} /> Administração · {state.users.length} contas</span>
        <ChevronRight size={18} className={cx("text-ink-mute transition-transform", aberto && "rotate-90")} />
      </button>
      {aberto && (
        <>
          {state.users.map((u) => (
            <div key={u.email} className="flex justify-between gap-2 text-[12.5px] py-1 border-b border-line dark:border-line-dark">
              <span className="truncate">{u.name} · {u.email}</span>
              <span className="text-[11px] font-bold text-ink-mute">{u.role === "admin" ? "admin" : "usuário"}</span>
            </div>
          ))}
          <Field label="Nome"><Input value={nome} onChange={(e) => setNome(e.target.value)} /></Field>
          <Field label="E-mail"><Input value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Senha">
            <div className="flex gap-2"><Input value={senha} onChange={(e) => setSenha(e.target.value)} /><Button variant="secondary" size="sm" onClick={() => setSenha(senhaForte())}>Gerar</Button></div>
          </Field>
          <Chips small value={papel} onChange={setPapel} options={[{ v: "user", label: "Usuário" }, { v: "admin", label: "Administrador" }]} />
          {msg && <span className={cx("text-[12px]", msg.ok ? "text-brand" : "text-danger")}>{msg.t}</span>}
          <Button onClick={criar}>Criar conta</Button>
        </>
      )}
    </Card>
  );
}
