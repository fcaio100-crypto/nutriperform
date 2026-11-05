export const emailValido = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e.trim().toLowerCase());

export const regrasSenha = (s: string) => [
  { id: "len", label: "8+ caracteres", ok: s.length >= 8 },
  { id: "up", label: "Maiúscula", ok: /[A-Z]/.test(s) },
  { id: "num", label: "Número", ok: /[0-9]/.test(s) },
  { id: "sym", label: "Símbolo", ok: /[^A-Za-z0-9]/.test(s) },
];
