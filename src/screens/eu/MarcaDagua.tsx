import { useEffect, useRef, useState } from "react";
import { Download, ImagePlus, Share2 } from "lucide-react";
import { useStore } from "../../state/store";
import { useUi } from "../../state/ui";
import { Button, Card, Field, Input, Muted, cx } from "../../components/ui";

import { desenhar, type Opcoes } from "../../lib/marcaDagua";

export default function MarcaDagua() {
  const { state } = useStore();
  const { notify } = useUi();
  const cv = useRef<HTMLCanvasElement>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [nomeArq, setNomeArq] = useState("foto");
  const [o, setO] = useState<Opcoes>({ estilo: "completa", cor: "branca", pos: "id", tamanho: 100, opacidade: 85, texto: "" });
  const [preview, setPreview] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const up = (p: Partial<Opcoes>) => setO((x) => ({ ...x, ...p }));

  useEffect(() => {
    if (!cv.current) return;
    let vivo = true;
    desenhar(cv.current, foto, o).then(() => { if (vivo && cv.current) setPreview(cv.current.toDataURL(foto ? "image/jpeg" : "image/png", 0.85)); }).catch(() => notify("Não consegui abrir essa foto."));
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foto, o]);

  function escolher(f?: File) {
    if (!f) return;
    setNomeArq(f.name.replace(/\.[^.]+$/, "") || "foto");
    const r = new FileReader();
    r.onload = () => setFoto(String(r.result));
    r.readAsDataURL(f);
  }

  const tipo = foto ? "image/jpeg" : "image/png";
  const arquivo = () => (foto ? `${nomeArq}-nutriperform.jpg` : "marca-dagua-nutriperform.png");
  const blob = () => new Promise<Blob | null>((ok) => cv.current?.toBlob(ok, tipo, 0.92));

  async function baixar(b?: Blob | null) {
    const bb = b ?? (await blob());
    if (!bb) return;
    const url = URL.createObjectURL(bb);
    const a = document.createElement("a");
    a.href = url; a.download = arquivo();
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    notify("Imagem salva");
  }
  async function compartilhar() {
    setOcupado(true);
    try {
      const b = await blob();
      if (!b) throw new Error();
      const file = new File([b], arquivo(), { type: tipo });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) await nav.share({ files: [file] });
      else await baixar(b);
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") notify("Não deu para compartilhar. Use Baixar.");
    } finally { setOcupado(false); }
  }

  const seg = <T extends string>(v: T, set: (x: T) => void, ops: [T, string][]) => (
    <div className="flex gap-1 p-1 rounded-xl bg-surface-raised dark:bg-surface-raisedDark">
      {ops.map(([k, l]) => (
        <button key={k} type="button" onClick={() => set(k)} className={cx("flex-1 py-2 rounded-lg text-[12px] font-bold", v === k ? "bg-surface-card dark:bg-surface-cardDark text-ink dark:text-white shadow-card" : "text-ink-mute")}>{l}</button>
      ))}
    </div>
  );

  const usuario = state.profile.nome ? "@" + state.profile.nome.split(" ")[0].toLowerCase() : "@seuperfil";

  return (
    <>
      <Muted className="text-[12.5px]">Escolha uma foto e a marca entra no canto. Sem foto, você baixa só a marca em PNG transparente para usar em outros apps.</Muted>
      <div className="flex justify-center rounded-2xl p-3" style={{ background: "repeating-conic-gradient(#d9e0dc 0 25%, #eef2ef 0 50%) 0 0 / 18px 18px" }}>
        <canvas ref={cv} className="hidden" />
        {preview ? <img src={preview} alt="Prévia com marca d'água" className="max-h-[46vh] w-auto rounded-lg shadow-card" /> : <div className="h-[36vh]" />}
      </div>
      <label className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-line dark:border-line-dark text-[13px] font-bold text-ink-soft cursor-pointer">
        <ImagePlus size={17} /> {foto ? "Trocar foto" : "Escolher foto"}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => escolher(e.target.files?.[0])} />
      </label>
      {foto && <button type="button" onClick={() => setFoto(null)} className="self-center text-[12px] font-bold text-ink-mute -mt-2">Tirar foto (só a marca)</button>}

      <Card className="p-4 flex flex-col gap-3">
        <Field label="Modelo">{seg(o.estilo, (v) => up({ estilo: v }), [["completa", "Ícone + nome"], ["icone", "Só ícone"], ["selo", "Selo"]])}</Field>
        {o.estilo !== "selo" && <Field label="Cor">{seg(o.cor, (v) => up({ cor: v }), [["branca", "Branca"], ["lima", "Verde-limão"], ["preta", "Preta"]])}</Field>}
        {foto && <Field label="Posição">{seg(o.pos, (v) => up({ pos: v }), [["se", "↖"], ["sd", "↗"], ["centro", "●"], ["ie", "↙"], ["id", "↘"]])}</Field>}
        <Field label={`Tamanho · ${o.tamanho}%`}><input type="range" min={50} max={200} step={5} value={o.tamanho} onChange={(e) => up({ tamanho: +e.target.value })} className="w-full accent-[#1E8E5A]" /></Field>
        <Field label={`Opacidade · ${o.opacidade}%`}><input type="range" min={20} max={100} step={5} value={o.opacidade} onChange={(e) => up({ opacidade: +e.target.value })} className="w-full accent-[#1E8E5A]" /></Field>
        <Field label="Texto embaixo (opcional)"><Input value={o.texto} placeholder={usuario} maxLength={30} onChange={(e) => up({ texto: e.target.value })} /></Field>
      </Card>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => baixar()} disabled={ocupado}><Download size={16} /> Baixar</Button>
        <Button className="flex-1" onClick={compartilhar} disabled={ocupado}><Share2 size={16} /> {foto ? "Postar / compartilhar" : "Compartilhar marca"}</Button>
      </div>
    </>
  );
}
