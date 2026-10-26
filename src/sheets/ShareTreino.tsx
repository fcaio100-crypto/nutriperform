import { useEffect, useRef, useState } from "react";
import { Download, ImagePlus, Share2 } from "lucide-react";
import { useStore } from "../state/store";
import { useUi } from "../state/ui";
import { addDays, parseISO } from "../lib/calc";
import { corDe, fmtDur, fmtKm, inicioSemana, isoDoTreino, kmDoTreino, pace, tituloTreino } from "../lib/treinos";
import type { Workout } from "../lib/types";
import { Button, Muted, Sheet, cx } from "../components/ui";

type Estilo = "foto" | "escuro" | "transparente";
type Formato = "post" | "story" | "quadrado";

const LIMA = "#A3E635";
const PRETO = "#0B0F0C";
const FONTE = '"Plus Jakarta Sans", system-ui, sans-serif';

/** Logomarca (haltere em ascensão) como imagem para o canvas */
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="${PRETO}"/><g transform="rotate(-35 34 32)" fill="${LIMA}"><rect x="20" y="29.5" width="28" height="5" rx="2.5"/><rect x="15" y="20" width="7" height="24" rx="2.5"/><rect x="10" y="24.5" width="5" height="15" rx="2"/><rect x="46" y="20" width="7" height="24" rx="2.5"/><rect x="53" y="24.5" width="5" height="15" rx="2"/></g><g stroke="${LIMA}" stroke-width="2.6" stroke-linecap="round" opacity="0.55"><line x1="7" y1="50" x2="15" y2="50"/><line x1="9" y1="56" x2="20" y2="56"/></g></svg>`;

const carregar = (src: string) =>
  new Promise<HTMLImageElement>((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = src; });

function retangulo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Os números que vão no card: um destaque grande e até três menores */
function numerosDoCard(w: Workout) {
  const km = kmDoTreino(w);
  const destaque: [string, string] = km > 0 ? [fmtKm(km), "km"] : [fmtDur(w.duracaoMin), ""];
  const outros: [string, string][] = [];
  if (km > 0) { outros.push(["Pace", `${pace(w.duracaoMin, km)} /km`]); outros.push(["Tempo", fmtDur(w.duracaoMin)]); }
  if (w.kcal) outros.push(["Calorias", `${Math.round(w.kcal)} kcal`]);
  if (w.fcMedia) outros.push(["FC média", `${w.fcMedia} bpm`]);
  if (w.pse) outros.push(["Esforço", `${w.pse}/10`]);
  return { destaque, outros: outros.slice(0, 3) };
}

export async function desenhar(cv: HTMLCanvasElement, w: Workout, todos: Workout[], estilo: Estilo, formato: Formato, foto: string | null, nome: string) {
  const W = 1080;
  const H = formato === "story" ? 1920 : formato === "quadrado" ? 1080 : 1350;
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  try { await Promise.all([document.fonts.load(`800 200px ${FONTE}`), document.fonts.load(`600 30px ${FONTE}`)]); } catch { /* usa a fonte do sistema */ }
  const cor = corDe(w.modalidade);
  const M = 72;
  const sombra = (on: boolean) => {
    ctx.shadowColor = on ? "rgba(0,0,0,.45)" : "transparent";
    ctx.shadowBlur = on ? 18 : 0;
    ctx.shadowOffsetY = on ? 3 : 0;
  };
  ctx.clearRect(0, 0, W, H);

  // ===== fundo =====
  if (estilo === "foto" && foto) {
    const img = await carregar(foto);
    const s = Math.max(W / img.width, H / img.height);
    ctx.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s);
    const g = ctx.createLinearGradient(0, H * 0.35, 0, H);
    g.addColorStop(0, "rgba(5,8,6,0)");
    g.addColorStop(1, "rgba(5,8,6,.9)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const g2 = ctx.createLinearGradient(0, 0, 0, 280);
    g2.addColorStop(0, "rgba(5,8,6,.55)");
    g2.addColorStop(1, "rgba(5,8,6,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, 280);
  } else if (estilo !== "transparente") {
    ctx.fillStyle = PRETO;
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W * 0.88, H * 0.12, 40, W * 0.88, H * 0.12, W * 1.05);
    g.addColorStop(0, "rgba(163,230,53,.38)");
    g.addColorStop(1, "rgba(11,15,12,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // traços em diagonal, como os da logomarca
    ctx.save();
    ctx.strokeStyle = "rgba(163,230,53,.08)";
    ctx.lineWidth = 26;
    ctx.lineCap = "round";
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(W * 0.45 + i * 120, -40); ctx.lineTo(W + 200 + i * 120, H * 0.55); ctx.stroke(); }
    ctx.restore();
    if (estilo === "foto") {
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.font = `600 32px ${FONTE}`;
      ctx.textAlign = "center";
      ctx.fillText("Escolha uma foto abaixo", W / 2, H * 0.4);
      ctx.textAlign = "left";
    }
  }
  const comSombra = estilo !== "escuro";

  // ===== marca =====
  sombra(comSombra);
  try { const lg = await carregar("data:image/svg+xml;charset=utf-8," + encodeURIComponent(LOGO_SVG)); ctx.drawImage(lg, M, M, 84, 84); } catch { /* sem logo */ }
  ctx.font = `italic 800 50px ${FONTE}`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.fillText("NUTRI", M + 104, M + 44);
  const nw = ctx.measureText("NUTRI").width;
  ctx.fillStyle = LIMA;
  ctx.fillText("PERFORM", M + 104 + nw, M + 44);
  ctx.textBaseline = "alphabetic";

  const iso = isoDoTreino(w);
  ctx.fillStyle = "rgba(255,255,255,.85)";
  ctx.font = `600 30px ${FONTE}`;
  ctx.textAlign = "right";
  ctx.fillText(parseISO(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }), W - M, M + 140);
  if (nome) ctx.fillText(nome, W - M, M + 184);
  ctx.textAlign = "left";

  // ===== bloco de baixo =====
  const { destaque, outros } = numerosDoCard(w);
  let y = H - M;
  const col = (W - 2 * M) / 3;
  outros.forEach(([k, v], i) => {
    const x = M + i * col;
    ctx.fillStyle = "rgba(255,255,255,.7)";
    ctx.font = `700 26px ${FONTE}`;
    ctx.fillText(k.toUpperCase(), x, y - 64);
    ctx.fillStyle = "#fff";
    ctx.font = `800 54px ${FONTE}`;
    ctx.fillText(v, x, y);
  });
  y -= 124;
  sombra(false);
  ctx.fillStyle = "rgba(255,255,255,.25)";
  ctx.fillRect(M, y, W - 2 * M, 3);
  sombra(comSombra);
  y -= 44;

  const grande = formato === "quadrado" ? 170 : 220;
  ctx.fillStyle = "#fff";
  ctx.font = `italic 800 ${grande}px ${FONTE}`;
  ctx.fillText(destaque[0], M - 8, y);
  const dw = ctx.measureText(destaque[0]).width;
  if (destaque[1]) {
    ctx.fillStyle = LIMA;
    ctx.font = `italic 800 76px ${FONTE}`;
    ctx.fillText(destaque[1], M + dw + 12, y);
  }
  y -= grande * 0.9;

  ctx.fillStyle = "#fff";
  ctx.font = `800 46px ${FONTE}`;
  let t = tituloTreino(w);
  while (ctx.measureText(t).width > W - 2 * M && t.length > 4) t = t.slice(0, -2) + "…";
  ctx.fillText(t, M, y);
  y -= 66;

  sombra(false);
  ctx.font = `800 28px ${FONTE}`;
  const tag = (w.modalidade + (w.nivel ? ` · Nível ${w.nivel}` : w.sensacao ? ` · ${w.sensacao}` : "")).toUpperCase();
  const tw = ctx.measureText(tag).width;
  ctx.fillStyle = cor;
  retangulo(ctx, M, y - 42, tw + 48, 58, 29);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillText(tag, M + 24, y - 3);

  // ===== semana (estilo escuro) =====
  if (estilo === "escuro" && formato !== "quadrado") {
    const ini = inicioSemana(iso);
    const topo = M + 260;
    const vals = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(ini, i);
      return todos.filter((x) => isoDoTreino(x) === d).reduce((s, x) => s + (x.duracaoMin || 0), 0);
    });
    const mx = Math.max(30, ...vals);
    const bw = (W - 2 * M) / 7;
    ctx.fillStyle = "rgba(255,255,255,.7)";
    ctx.font = `700 26px ${FONTE}`;
    ctx.fillText("MINHA SEMANA", M, topo);
    vals.forEach((v, i) => {
      const h = Math.max(8, (v / mx) * 160);
      const x = M + i * bw + bw * 0.2;
      ctx.fillStyle = addDays(ini, i) === iso ? LIMA : v ? "rgba(255,255,255,.45)" : "rgba(255,255,255,.14)";
      retangulo(ctx, x, topo + 30 + 160 - h, bw * 0.6, h, 10);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.6)";
      ctx.font = `700 24px ${FONTE}`;
      ctx.textAlign = "center";
      ctx.fillText("STQQSSD"[i], x + bw * 0.3, topo + 232);
      ctx.textAlign = "left";
    });
  }
  sombra(false);
}

export default function ShareTreino() {
  const { state } = useStore();
  const { shareWorkout: w, close, notify } = useUi();
  const cv = useRef<HTMLCanvasElement>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [estilo, setEstilo] = useState<Estilo>("escuro");
  const [formato, setFormato] = useState<Formato>("post");
  const [ocupado, setOcupado] = useState(false);
  const [preview, setPreview] = useState("");
  const nome = state.profile.nome ? state.profile.nome.split(" ")[0] : "";

  useEffect(() => {
    if (!w || !cv.current) return;
    let vivo = true;
    desenhar(cv.current, w, state.workouts, estilo, formato, foto, nome).then(() => {
      if (vivo && cv.current) setPreview(cv.current.toDataURL("image/png"));
    });
    return () => { vivo = false; };
  }, [w, estilo, formato, foto, nome, state.workouts]);

  if (!w) return null;

  function escolherFoto(f?: File) {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { setFoto(String(r.result)); setEstilo("foto"); };
    r.readAsDataURL(f);
  }

  const arquivo = () => `nutriperform-${isoDoTreino(w).replace(/-/g, "")}-${w.modalidade.toLowerCase().replace(/\s+/g, "-")}.png`;
  const blob = () => new Promise<Blob | null>((ok) => cv.current?.toBlob(ok, "image/png"));

  async function compartilhar() {
    setOcupado(true);
    try {
      const b = await blob();
      if (!b) throw new Error();
      const file = new File([b], arquivo(), { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: tituloTreino(w!) });
      } else {
        baixar(b);
      }
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") notify("Não deu para compartilhar. Use Baixar imagem.");
    } finally {
      setOcupado(false);
    }
  }

  async function baixar(b?: Blob | null) {
    const bb = b ?? (await blob());
    if (!bb) return;
    const url = URL.createObjectURL(bb);
    const a = document.createElement("a");
    a.href = url;
    a.download = arquivo();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    notify("Imagem salva");
  }

  const seg = <T extends string>(v: T, set: (x: T) => void, ops: [T, string][]) => (
    <div className="flex gap-1 p-1 rounded-xl bg-surface-raised dark:bg-surface-raisedDark">
      {ops.map(([k, l]) => (
        <button key={k} type="button" onClick={() => set(k)} className={cx("flex-1 py-2 rounded-lg text-[12px] font-bold transition-colors", v === k ? "bg-surface-card dark:bg-surface-cardDark text-ink dark:text-white shadow-card" : "text-ink-mute")}>
          {l}
        </button>
      ))}
    </div>
  );

  return (
    <Sheet
      title="Compartilhar treino"
      onClose={close}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => baixar()} disabled={ocupado}><Download size={16} /> Baixar</Button>
          <Button className="flex-1" onClick={compartilhar} disabled={ocupado}><Share2 size={16} /> Compartilhar</Button>
        </div>
      }
    >
      {seg(estilo, setEstilo, [["escuro", "Escuro"], ["foto", "Com foto"], ["transparente", "Transparente"]])}
      {seg(formato, setFormato, [["post", "Post 4:5"], ["story", "Story 9:16"], ["quadrado", "Quadrado"]])}
      <div className="flex justify-center rounded-2xl p-3" style={{ background: "repeating-conic-gradient(#d9e0dc 0 25%, #eef2ef 0 50%) 0 0 / 18px 18px" }}>
        <canvas ref={cv} className="hidden" />
        {preview ? <img src={preview} alt="Card do treino" className="max-h-[48vh] w-auto rounded-lg shadow-card" /> : <div className="h-[40vh]" />}
      </div>
      <label className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-line dark:border-line-dark text-[13px] font-bold text-ink-soft cursor-pointer">
        <ImagePlus size={17} /> {foto ? "Trocar foto" : "Usar uma foto do treino"}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => escolherFoto(e.target.files?.[0])} />
      </label>
      <Muted className="text-[11.5px] text-center">
        “Transparente” gera um adesivo PNG para colocar por cima da sua própria foto no Instagram. No celular, “Compartilhar” abre direto o Instagram, WhatsApp e outros apps.
      </Muted>
    </Sheet>
  );
}
