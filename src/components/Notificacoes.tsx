import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, CheckCircle2, Download, Send, Share, SquarePlus } from "lucide-react";
import { useStore } from "../state/store";
import { useUi } from "../state/ui";
import { Button, Card, Muted, cx } from "./ui";
import { ativar, ativoNesteAparelho, desativar, ehAndroid, ehIOS, instalado, montarAgenda, permissao, resumoAgenda, salvarAgenda, testar } from "../lib/lembretes";

function Passo({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="w-6 h-6 rounded-full bg-brand text-white text-[12px] font-extrabold flex items-center justify-center flex-none mt-0.5">{n}</span>
      <span className="text-[13px] leading-relaxed text-ink-soft">{children}</span>
    </li>
  );
}

/** Passo a passo para colocar o ícone na Tela de Início (iPhone e Android). */
export function GuiaInstalacao({ compacto = false }: { compacto?: boolean }) {
  const ios = ehIOS();
  const android = ehAndroid();
  const [aba, setAba] = useState<"iphone" | "android">(android ? "android" : "iphone");
  if (instalado()) {
    return (
      <div className="flex items-center gap-2 text-[13px] font-semibold text-brand">
        <CheckCircle2 size={17} /> App instalado na Tela de Início
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {!compacto && (
        <Muted className="text-[12.5px]">Instale o ícone para abrir o NutriPerform como app e receber os lembretes. Leva 30 segundos.</Muted>
      )}
      {!ios && !android && (
        <div className="flex gap-1.5">
          {(["iphone", "android"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setAba(k)} className={cx("px-3 py-1.5 rounded-full text-[12px] font-bold", aba === k ? "bg-brand text-white" : "bg-surface-raised dark:bg-surface-raisedDark text-ink-soft")}>
              {k === "iphone" ? "iPhone" : "Android"}
            </button>
          ))}
        </div>
      )}
      {(ios || (!android && aba === "iphone")) ? (
        <ol className="flex flex-col gap-2.5">
          <Passo n={1}>Abra este link no <b>Safari</b> (não funciona pelo Instagram, WhatsApp ou Chrome do iPhone).</Passo>
          <Passo n={2}>Toque em <b>Compartilhar</b> <Share size={14} className="inline -mt-0.5" /> na barra de baixo (ou nos ••• ao lado do endereço).</Passo>
          <Passo n={3}>Role e toque em <b>Adicionar à Tela de Início</b> <SquarePlus size={14} className="inline -mt-0.5" />.</Passo>
          <Passo n={4}>Deixe “Abrir como App Web” ligado e toque em <b>Adicionar</b>.</Passo>
          <Passo n={5}>Feche o Safari e abra o NutriPerform <b>pelo ícone novo</b>. Entre na conta e vá em <b>Eu › Notificações</b>.</Passo>
        </ol>
      ) : (
        <ol className="flex flex-col gap-2.5">
          <Passo n={1}>Abra este link no <b>Chrome</b>.</Passo>
          <Passo n={2}>Toque nos <b>⋮</b> no canto de cima.</Passo>
          <Passo n={3}>Toque em <b>Instalar app</b> <Download size={14} className="inline -mt-0.5" /> (ou “Adicionar à tela inicial”) e confirme.</Passo>
          <Passo n={4}>Abra o NutriPerform <b>pelo ícone</b>, entre na conta e vá em <b>Eu › Notificações</b>.</Passo>
        </ol>
      )}
    </div>
  );
}

/** Página Eu › Notificações */
export default function Notificacoes() {
  const { state } = useStore();
  const { notify } = useUi();
  const [ativo, setAtivo] = useState(ativoNesteAparelho());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null);
  const ios = ehIOS();
  const podeAtivar = !ios || instalado();
  const perm = permissao();

  async function ligar() {
    setBusy(true); setMsg(null);
    try {
      const erro = await ativar(state);
      if (erro) setMsg({ t: erro });
      else { setAtivo(true); setMsg({ t: "Notificações ativas neste aparelho. Toque em Enviar teste.", ok: true }); }
    } catch {
      setMsg({ t: "Não consegui ativar. Feche e abra o app pelo ícone e tente de novo." });
    }
    setBusy(false);
  }
  async function desligar() {
    setBusy(true);
    await desativar().catch(() => {});
    setAtivo(false); setBusy(false);
    notify("Notificações desativadas neste aparelho");
  }
  async function teste() {
    setBusy(true);
    setMsg({ t: await testar(), ok: true });
    setBusy(false);
  }

  return (
    <>
      <Card className="p-4 flex flex-col gap-3">
        <span className="font-bold text-[14px] flex items-center gap-2"><Download size={16} /> 1. Instalar o ícone</span>
        <GuiaInstalacao />
      </Card>

      <Card className="p-4 flex flex-col gap-3">
        <span className="font-bold text-[14px] flex items-center gap-2"><Bell size={16} /> 2. Ativar lembretes</span>
        {ativo ? (
          <>
            <div className="flex items-center gap-2 text-[13px] font-semibold text-brand"><CheckCircle2 size={17} /> Ativas neste aparelho</div>
            <Muted className="text-[12px]">Você recebe: {resumoAgenda(state)}. A agenda se atualiza sozinha quando você muda o plano ou a semana de treino.</Muted>
            <Button onClick={teste} disabled={busy}><Send size={16} /> Enviar teste</Button>
            <Button variant="secondary" onClick={ligar} disabled={busy}>Reconectar este aparelho</Button>
            <Button variant="ghost" onClick={desligar} disabled={busy}><BellOff size={16} /> Desativar</Button>
          </>
        ) : (
          <>
            <Muted className="text-[12px]">
              {podeAtivar ? "Lembretes de refeições, treino e água no horário do seu plano." : "No iPhone, primeiro instale o ícone (passo 1) e abra o app por ele."}
            </Muted>
            {perm === "denied" && <Muted className="text-[12px] text-danger">As notificações estão bloqueadas. Libere em Ajustes › Notificações › NutriPerform.</Muted>}
            <Button onClick={ligar} disabled={busy || !podeAtivar}><Bell size={16} /> Ativar notificações</Button>
          </>
        )}
        {msg && <div className={cx("px-3.5 py-3 rounded-xl text-[12px] font-medium", msg.ok ? "bg-brand-soft text-brand dark:bg-brand-softDark" : "bg-[#FBE6EA] text-danger dark:bg-[#33141B]")}>{msg.t}</div>}
      </Card>

      <Muted className="text-[11.5px]">Não chegou? Confira em Ajustes › Notificações › NutriPerform e se algum modo Foco está ligado.</Muted>
    </>
  );
}

/** Mantém a agenda do servidor igual ao plano/semana atuais (quando ativo neste aparelho). */
export function useSyncLembretes() {
  const { state } = useStore();
  const ultimo = useRef("");
  const json = ativoNesteAparelho() && state.auth.currentUserEmail ? JSON.stringify(montarAgenda(state)) : "";
  useEffect(() => {
    if (!json || json === ultimo.current) return;
    const t = setTimeout(() => {
      ultimo.current = json;
      salvarAgenda(state).catch(() => { ultimo.current = ""; });
    }, 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json]);
}
