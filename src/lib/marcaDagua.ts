export type Estilo = "completa" | "icone" | "selo";
export type Cor = "branca" | "lima" | "preta";
export type Pos = "ie" | "id" | "se" | "sd" | "centro";

const LIMA = "#A3E635";
const PRETO = "#0B0F0C";
const FONTE = '"Plus Jakarta Sans", system-ui, sans-serif';
const MAX = 2160;

/** Haltere em ascensão, sem o quadrado de fundo (marca d'água limpa). */
const haltere = (cor: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="270" height="240" viewBox="6 10 54 48"><g transform="rotate(-35 34 32)" fill="${cor}"><rect x="20" y="29.5" width="28" height="5" rx="2.5"/><rect x="15" y="20" width="7" height="24" rx="2.5"/><rect x="10" y="24.5" width="5" height="15" rx="2"/><rect x="46" y="20" width="7" height="24" rx="2.5"/><rect x="53" y="24.5" width="5" height="15" rx="2"/></g><g stroke="${cor}" stroke-width="2.6" stroke-linecap="round" opacity="0.6"><line x1="7" y1="50" x2="15" y2="50"/><line x1="9" y1="56" x2="20" y2="56"/></g></svg>`;
const selo = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="${PRETO}"/><g transform="rotate(-35 34 32)" fill="${LIMA}"><rect x="20" y="29.5" width="28" height="5" rx="2.5"/><rect x="15" y="20" width="7" height="24" rx="2.5"/><rect x="10" y="24.5" width="5" height="15" rx="2"/><rect x="46" y="20" width="7" height="24" rx="2.5"/><rect x="53" y="24.5" width="5" height="15" rx="2"/></g><g stroke="${LIMA}" stroke-width="2.6" stroke-linecap="round" opacity="0.55"><line x1="7" y1="50" x2="15" y2="50"/><line x1="9" y1="56" x2="20" y2="56"/></g></svg>`;

const carregar = (src: string) =>
  new Promise<HTMLImageElement>((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = src; });
const svgUrl = (s: string) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);

export interface Opcoes { estilo: Estilo; cor: Cor; pos: Pos; tamanho: number; opacidade: number; texto: string }

/** Desenha a marca d'água. Sem foto, gera só a marca em PNG transparente. */
export async function desenhar(cv: HTMLCanvasElement, foto: string | null, o: Opcoes) {
  const ctx = cv.getContext("2d")!;
  try { await document.fonts.load(`italic 800 60px ${FONTE}`); } catch { /* fonte do sistema */ }
  let W = 1080, H = 1080;
  let img: HTMLImageElement | null = null;
  if (foto) {
    img = await carregar(foto);
    const s = Math.min(1, MAX / Math.max(img.width, img.height));
    W = Math.round(img.width * s);
    H = Math.round(img.height * s);
  }

  const principal = o.cor === "branca" ? "#FFFFFF" : o.cor === "lima" ? LIMA : PRETO;
  const destaque = o.cor === "preta" ? "#2E6B0C" : LIMA;
  const base = Math.min(W, H);
  const icone = img ? Math.round(base * (o.tamanho / 100) * 0.13) : 240; // altura do ícone
  const fonte = Math.round(icone * 0.5);
  const margem = Math.round(base * 0.045);

  ctx.font = `italic 800 ${fonte}px ${FONTE}`;
  const wN = ctx.measureText("NUTRI").width;
  const wP = ctx.measureText("PERFORM").width;
  const comNome = o.estilo !== "icone";
  const larguraNome = comNome ? wN + wP : 0;
  const gap = comNome ? Math.round(icone * 0.1) : 0;
  const larguraIcone = o.estilo === "selo" ? icone : Math.round(icone * (54 / 48));
  ctx.font = `700 ${Math.round(fonte * 0.62)}px ${FONTE}`;
  const wT = o.texto ? ctx.measureText(o.texto).width : 0;
  const larg = Math.max(larguraIcone + gap + larguraNome, wT);
  const alt = icone + (o.texto ? Math.round(fonte * 0.95) : 0);

  if (!img) { W = Math.ceil(larg + 2 * margem); H = Math.ceil(alt + 2 * margem); }
  cv.width = W;
  cv.height = H;
  ctx.clearRect(0, 0, W, H);
  if (img) ctx.drawImage(img, 0, 0, W, H);

  let x = margem, y = margem;
  if (o.pos === "sd" || o.pos === "id") x = W - margem - larg;
  if (o.pos === "ie" || o.pos === "id") y = H - margem - alt;
  if (o.pos === "centro") { x = (W - larg) / 2; y = (H - alt) / 2; }
  if (!img) { x = (W - larg) / 2; y = (H - alt) / 2; }

  ctx.save();
  ctx.globalAlpha = o.opacidade / 100;
  if (img && o.cor !== "preta") { ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = Math.round(icone * 0.12); ctx.shadowOffsetY = Math.round(icone * 0.02); }
  const marca = await carregar(svgUrl(o.estilo === "selo" ? selo() : haltere(principal)));
  ctx.drawImage(marca, x, y, larguraIcone, icone);
  if (comNome) {
    ctx.font = `italic 800 ${fonte}px ${FONTE}`;
    ctx.textBaseline = "middle";
    const ty = y + icone / 2;
    const tx = x + larguraIcone + gap;
    ctx.fillStyle = principal === LIMA ? "#FFFFFF" : principal;
    ctx.fillText("NUTRI", tx, ty);
    ctx.fillStyle = destaque;
    ctx.fillText("PERFORM", tx + wN, ty);
  }
  if (o.texto) {
    ctx.font = `700 ${Math.round(fonte * 0.62)}px ${FONTE}`;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = principal === LIMA ? "#FFFFFF" : principal;
    const tx = o.pos === "sd" || o.pos === "id" ? x + larg - wT : o.pos === "centro" || !img ? x + (larg - wT) / 2 : x;
    ctx.fillText(o.texto, tx, y + alt);
  }
  ctx.restore();
}

