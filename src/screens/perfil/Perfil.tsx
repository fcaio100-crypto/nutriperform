import { useState } from "react";
import { Cloud, CloudOff, LogOut, RefreshCcw, UserPlus } from "lucide-react";
import { useStore } from "../../state/store";
import { useUi } from "../../state/ui";
import { ATIVIDADES, OBJETIVOS, PERGUNTAS_SAUDE } from "../../lib/calc";
import { emailValido, hashPassword, newSalt, regrasSenha, senhaForte } from "../../lib/auth";
import { Button, Card, Chips, Collapse, Field, Input, Muted, PageTitle, Select, Toggle, cx } from "../../components/ui";
import { SafetyCard } from "../../components/shell";

export default function Perfil() {
  const { state, dispatch, sync } = useStore();
  const { openOnboarding, notify } = useUi();
  const p = state.profile;
  const user = state.users.find((u) => u.email === state.auth.currentUserEmail);
  const admin = user?.role === "admin";
  const num = (v: string) => parseFloat(v.replace(",", ".")) || 0;
  const up = (patch: Partial<typeof p>) => dispatch({ type: "UPDATE_PROFILE", patch });
  const iniciais = p.nome.split(" ").filter(Boolean).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <>
      <PageTitle title="Perfil" />
      <Card className="p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-brand text-white font-extrabold text-[18px] flex items-center justify-center flex-none">{iniciais}</div>
        <div className="min-w-0">
          <div className="font-extrabold text-[17px] truncate">{p.nome || "Sem nome"}</div>
          <div className="text-[12px] text-ink-mute truncate">{state.auth.currentUserEmail}</div>
          <div className="text-[12px] text-ink-soft mt-0.5">{p.objetivo} · {p.peso} kg → {p.pesoDesejado} kg</div>
        </div>
      </Card>

      <Collapse title="Dados pessoais" subtitle="Nome, medidas, objetivo e atividade">
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
      </Collapse>

      <Collapse title="Saúde e segurança" subtitle="Triagem que deixa as sugestões mais seguras">
        <SafetyCard />
        {PERGUNTAS_SAUDE.map((q) => (
          <Toggle key={q.key} on={!!state.healthScreening[q.key]} onChange={(v) => dispatch({ type: "UPDATE_HEALTH_SCREENING", patch: { [q.key]: v } })} label={q.pergunta} />
        ))}
        <Muted className="text-[11px]">O app não diagnostica, não prescreve e não incentiva dietas extremas.</Muted>
      </Collapse>

      <Card className="p-4 flex flex-col gap-3">
        <span className="font-bold text-[14px]">Aparência</span>
        <Chips value={state.theme} onChange={(v) => dispatch({ type: "SET_THEME", theme: v })} options={[{ v: "Claro", label: "☀️ Claro" }, { v: "Escuro", label: "🌙 Escuro" }]} />
      </Card>

      <Card className="p-4 flex items-start gap-3">
        {sync === "synced" ? <Cloud size={20} className="text-brand flex-none mt-0.5" /> : <CloudOff size={20} className="text-warn flex-none mt-0.5" />}
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-[13.5px]">{sync === "synced" ? "Dados sincronizados" : sync === "checking" ? "Verificando conexão…" : "Salvo só neste aparelho"}</span>
          <Muted className="text-[11.5px] leading-relaxed">
            {sync === "synced" ? "Seus dados ficam salvos e aparecem em qualquer aparelho em que você abrir o app pelo link." : "Sem conexão com o banco agora; os dados ficam neste navegador."}
          </Muted>
        </div>
      </Card>

      {admin && <Admin />}

      <Button variant="danger" size="lg" onClick={() => { dispatch({ type: "LOGOUT" }); notify("Você saiu da conta"); }}><LogOut size={17} /> Sair da conta</Button>
      <Muted className="text-[10.5px] text-center">NutriPerform 2.0 · {sync === "synced" ? "sincronizado" : "local"}</Muted>
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

  async function criar() {
    const e = email.trim().toLowerCase();
    if (!nome.trim()) return setMsg({ t: "Informe o nome." });
    if (!emailValido(e)) return setMsg({ t: "E-mail inválido." });
    if (state.users.some((u) => u.email === e)) return setMsg({ t: "Já existe uma conta com este e-mail." });
    if (regrasSenha(senha).some((r) => !r.ok)) return setMsg({ t: "A senha não atende aos requisitos." });
    const salt = newSalt();
    dispatch({ type: "ADMIN_CREATE_USER", user: { email: e, name: nome.trim(), passHash: await hashPassword(senha, salt), passSalt: salt, createdAt: new Date().toISOString(), role: papel } });
    setMsg({ t: `Conta de ${papel === "admin" ? "administrador" : "usuário"} criada.`, ok: true });
    setNome(""); setEmail(""); setSenha("");
  }

  return (
    <Collapse title="Administração" subtitle={`${state.users.length} ${state.users.length === 1 ? "conta" : "contas"}`}>
      {state.users.map((u) => (
        <div key={u.email} className="flex justify-between gap-2 text-[12.5px] py-1.5 border-b border-line dark:border-line-dark">
          <span className="truncate">{u.name} · {u.email}</span>
          <span className={cx("font-bold text-[11px] flex-none", u.role === "admin" ? "text-brand" : "text-ink-mute")}>{u.role === "admin" ? "admin" : "usuário"}</span>
        </div>
      ))}
      <span className="font-bold text-[13px] flex items-center gap-1.5 mt-2"><UserPlus size={15} /> Nova conta</span>
      <Field label="Nome"><Input value={nome} onChange={(e) => setNome(e.target.value)} /></Field>
      <Field label="E-mail"><Input value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Field label="Senha">
        <div className="flex gap-2">
          <Input value={senha} onChange={(e) => setSenha(e.target.value)} />
          <Button variant="secondary" size="sm" onClick={() => setSenha(senhaForte())}>Gerar</Button>
        </div>
      </Field>
      <Chips small value={papel} onChange={setPapel} options={[{ v: "user", label: "Usuário" }, { v: "admin", label: "Administrador" }]} />
      {msg && <span className={cx("text-[12px]", msg.ok ? "text-brand" : "text-danger")}>{msg.t}</span>}
      <Button onClick={criar}>Criar conta</Button>
    </Collapse>
  );
}
