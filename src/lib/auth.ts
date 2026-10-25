// Autenticação local do MVP — compatível com as contas já criadas (SHA-256 de "salt:senha").
const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

export function newSalt() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return hex(b.buffer);
}

export async function hashPassword(senha: string, salt: string) {
  const data = new TextEncoder().encode(salt + ":" + senha);
  return hex(await crypto.subtle.digest("SHA-256", data));
}

export const emailValido = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e.trim().toLowerCase());

export const regrasSenha = (s: string) => [
  { id: "len", label: "8+ caracteres", ok: s.length >= 8 },
  { id: "up", label: "Maiúscula", ok: /[A-Z]/.test(s) },
  { id: "num", label: "Número", ok: /[0-9]/.test(s) },
  { id: "sym", label: "Símbolo", ok: /[^A-Za-z0-9]/.test(s) },
];

export const MAX_TENTATIVAS = 5;
export const BLOQUEIO_MS = 15 * 60 * 1000;

export function senhaForte(len = 14) {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "!@#%*+-"];
  const all = sets.join("");
  const rnd = (n: number) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  const out = sets.map((s) => s[rnd(s.length)]);
  while (out.length < len) out.push(all[rnd(all.length)]);
  for (let i = out.length - 1; i > 0; i--) { const j = rnd(i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out.join("");
}
