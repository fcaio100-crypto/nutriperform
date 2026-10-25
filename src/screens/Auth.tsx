import { useState } from "react";
import { useStore } from "../state/store";
import { BLOQUEIO_MS, MAX_TENTATIVAS, emailValido, hashPassword, newSalt, regrasSenha } from "../lib/auth";
import { Button, Card, Field, Input, cx } from "../components/ui";
import { supabase } from "../lib/supabase";
import { LogoMark, Wordmark } from "../components/Logo";

type Modo = "login" | "signup" | "forgot";

export default function Auth() {
  const { state, dispatch } = useStore();
  const [modo, setModo] = useState<Modo>("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [conf, setConf] = useState("");
  const [nome, setNome] = useState("");
  const [ver, setVer] = useState(false);
  const [aceite, setAceite] = useState(false);
  const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const bloqueado = !!state.auth.lockedUntil && state.auth.lockedUntil > Date.now();
  const regras = regrasSenha(senha);

  async function enviar() {
    const e = email.trim().toLowerCase();
    if (!emailValido(e)) return setMsg({ t: "Informe um e-mail válido." });
    if (supabase) return enviarNuvem(e);
    if (modo === "forgot") return setMsg({ t: "Se este e-mail tiver conta, enviaremos um link de redefinição.", ok: true });
    if (bloqueado) return setMsg({ t: "Conta temporariamente bloqueada. Tente em alguns minutos." });
    setBusy(true);
    try {
      if (modo === "signup") {
        if (!nome.trim()) return setMsg({ t: "Informe o seu nome." });
        if (regras.some((r) => !r.ok)) return setMsg({ t: "A senha não atende aos requisitos." });
        if (senha !== conf) return setMsg({ t: "As senhas não coincidem." });
        if (!aceite) return setMsg({ t: "Aceite os termos e o tratamento de dados de saúde para continuar." });
        if (state.users.some((u) => u.email === e)) return setMsg({ t: "Já existe uma conta com este e-mail." });
        const salt = newSalt();
        const passHash = await hashPassword(senha, salt);
        dispatch({ type: "REGISTER_USER", user: { email: e, name: nome.trim(), passHash, passSalt: salt, createdAt: new Date().toISOString(), role: "user" } });
        dispatch({ type: "SET_ONBOARDING_DONE", done: false });
        return;
      }
      const u = state.users.find((x) => x.email === e);
      const h = u ? await hashPassword(senha, u.passSalt) : null;
      if (!u || h !== u.passHash) {
        dispatch({ type: "LOGIN_FAIL", lockoutTries: MAX_TENTATIVAS, lockoutDurationMs: BLOQUEIO_MS });
        const n = state.auth.loginTries + 1;
        return setMsg({ t: n >= MAX_TENTATIVAS ? "Muitas tentativas. Conta bloqueada por 15 minutos." : `E-mail ou senha incorretos (${n} de ${MAX_TENTATIVAS}).` });
      }
      dispatch({ type: "LOGIN_SUCCESS", email: u.email });
      dispatch({ type: "UPDATE_PROFILE", patch: { nome: u.name } });
    } finally {
      setBusy(false);
    }
  }

  async function enviarNuvem(e: string) {
    const sb = supabase!;
    setBusy(true);
    try {
      if (modo === "forgot") {
        await sb.auth.resetPasswordForEmail(e, { redirectTo: window.location.origin });
        return setMsg({ t: "Se este e-mail tiver conta, enviamos um link para redefinir a senha.", ok: true });
      }
      if (modo === "signup") {
        if (!nome.trim()) return setMsg({ t: "Informe o seu nome." });
        if (regras.some((r) => !r.ok)) return setMsg({ t: "A senha não atende aos requisitos." });
        if (senha !== conf) return setMsg({ t: "As senhas não coincidem." });
        if (!aceite) return setMsg({ t: "Aceite os termos e o tratamento de dados de saúde para continuar." });
        const { data, error } = await sb.auth.signUp({ email: e, password: senha, options: { data: { name: nome.trim() }, emailRedirectTo: window.location.origin } });
        if (error) return setMsg({ t: error.message.includes("registered") ? "Já existe uma conta com este e-mail." : "Não foi possível criar a conta. Tente de novo." });
        if (!data.session) return setMsg({ t: "Conta criada! Confirme pelo link que enviamos ao seu e-mail e depois entre.", ok: true });
        return;
      }
      const { error } = await sb.auth.signInWithPassword({ email: e, password: senha });
      if (error) return setMsg({ t: error.message.toLowerCase().includes("confirm") ? "Confirme seu e-mail antes de entrar." : "E-mail ou senha incorretos." });
    } finally {
      setBusy(false);
    }
  }

  const trocar = (m: Modo) => { setModo(m); setMsg(null); setSenha(""); setConf(""); };

  return (
    <div className="min-h-screen flex flex-col justify-center px-5 py-10 max-w-[440px] mx-auto gap-6 anim-fade">
      <div className="flex items-center gap-3">
        <LogoMark size={52} />
        <div className="flex flex-col">
          <Wordmark className="text-[20px] leading-tight" />
          <span className="text-[10.5px] text-ink-mute font-bold tracking-[0.18em] uppercase">Treino · Nutrição · Performance</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="font-extrabold text-[26px] tracking-tight leading-tight">
          {modo === "login" ? "Que bom te ver" : modo === "signup" ? "Crie sua conta" : "Recuperar senha"}
        </h1>
        <span className="text-[13px] text-ink-soft">
          {modo === "login" ? "Entre para continuar seu acompanhamento." : modo === "signup" ? "Leva menos de um minuto." : "Enviaremos um link para o seu e-mail."}
        </span>
      </div>
      <Card className="p-5 flex flex-col gap-4">
        {modo === "signup" && (
          <Field label="Nome">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como quer ser chamado" />
          </Field>
        )}
        <Field label="E-mail">
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
        </Field>
        {modo !== "forgot" && (
          <Field label="Senha">
            <div className="relative">
              <Input type={ver ? "text" : "password"} autoComplete={modo === "signup" ? "new-password" : "current-password"} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Sua senha" className="pr-20" />
              <button type="button" onClick={() => setVer(!ver)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-brand">{ver ? "Ocultar" : "Mostrar"}</button>
            </div>
          </Field>
        )}
        {modo === "signup" && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {regras.map((r) => (
                <span key={r.id} className={cx("px-2.5 py-1 rounded-full text-[11px] font-semibold", r.ok ? "bg-brand-soft text-brand dark:bg-brand-softDark" : "bg-surface-raised dark:bg-surface-raisedDark text-ink-mute")}>
                  {r.ok ? "✓ " : ""}{r.label}
                </span>
              ))}
            </div>
            <Field label="Confirmar senha">
              <Input type="password" autoComplete="new-password" value={conf} onChange={(e) => setConf(e.target.value)} />
            </Field>
            <button type="button" onClick={() => setAceite(!aceite)} className="flex items-start gap-2.5 text-left">
              <span className={cx("w-5 h-5 rounded-md border-2 flex-none flex items-center justify-center text-[11px] text-white mt-0.5", aceite ? "bg-brand border-brand" : "border-[#C5D1CA]")}>{aceite ? "✓" : ""}</span>
              <span className="text-[11.5px] leading-relaxed text-ink-soft">Aceito os termos de uso e autorizo o tratamento dos meus dados de saúde (LGPD, art. 11).</span>
            </button>
          </>
        )}
        {msg && (
          <div className={cx("px-3.5 py-3 rounded-xl text-[12px] font-medium", msg.ok ? "bg-brand-soft text-brand dark:bg-brand-softDark" : "bg-[#FBE6EA] text-danger dark:bg-[#33141B]")}>{msg.t}</div>
        )}
        <Button size="lg" onClick={enviar} disabled={busy}>
          {modo === "login" ? "Entrar" : modo === "signup" ? "Criar conta" : "Enviar link"}
        </Button>
        {modo === "login" && (
          <button type="button" onClick={() => trocar("forgot")} className="text-[12.5px] font-semibold text-brand self-center">Esqueci a senha</button>
        )}
      </Card>
      <div className="flex items-center justify-center gap-1.5 text-[13px]">
        <span className="text-ink-soft">{modo === "login" ? "Ainda não tem conta?" : "Já tem conta?"}</span>
        <button type="button" onClick={() => trocar(modo === "login" ? "signup" : "login")} className="font-bold text-brand">
          {modo === "login" ? "Criar conta" : "Entrar"}
        </button>
      </div>
      <span className="text-[11px] text-ink-mute text-center leading-relaxed">
        {supabase ? "Seus dados ficam salvos na sua conta e aparecem em qualquer aparelho." : "Versão de testes: as contas ficam neste dispositivo e a senha nunca sai dele."}
      </span>
    </div>
  );
}
