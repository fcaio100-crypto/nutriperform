import type { AppState, HealthScreening, Meal, MealItem, PlanMeal, Profile } from "./types";
import { foodById } from "../data/foods";

// ===== Datas =====
export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayISO = () => isoDate(new Date());
export const parseISO = (s: string) => {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
export const addDays = (s: string, n: number) => {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return isoDate(d);
};
export const isoToDM = (s: string) => {
  const [, m, d] = s.split("-");
  return `${d}/${m}`;
};
export const nowHM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
export function longDate(d: Date) {
  const t = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(d);
  return t.charAt(0).toUpperCase() + t.slice(1);
}
export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}
/** dias desde uma data "dd/mm" (registros de treino), considerando o ano mais recente possível */
export function daysAgoDM(dm: string) {
  if (!dm || !/^\d{2}\/\d{2}$/.test(dm)) return 999;
  const [d, m] = dm.split("/").map(Number);
  const h = new Date();
  const dt = new Date(h.getFullYear(), m - 1, d);
  if (dt > h) dt.setFullYear(dt.getFullYear() - 1);
  return Math.floor((new Date(h.getFullYear(), h.getMonth(), h.getDate()).getTime() - dt.getTime()) / 864e5);
}

// ===== Formatação =====
export const fmtInt = (n: number) => Math.round(n).toLocaleString("pt-BR");
export const fmtDec = (n: number, d = 1) =>
  (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

// ===== Nutrição =====
export function itemMacros(it: MealItem) {
  const f = foodById(it.foodId);
  const k = it.qtdGramas / 100;
  return { kcal: f.kcal * k, proteina: f.proteina * k, carbo: f.carbo * k, gordura: f.gordura * k, fibra: f.fibra * k, nome: f.nome };
}
export function totals(meals: Meal[]) {
  const t = { kcal: 0, proteina: 0, carbo: 0, gordura: 0, fibra: 0 };
  for (const m of meals)
    for (const it of m.items) {
      const x = itemMacros(it);
      t.kcal += x.kcal;
      t.proteina += x.proteina;
      t.carbo += x.carbo;
      t.gordura += x.gordura;
      t.fibra += x.fibra;
    }
  return t;
}
export function roundedTotals(meals: Meal[]) {
  const t = totals(meals);
  return { kcal: Math.round(t.kcal), proteina: Math.round(t.proteina), carbo: Math.round(t.carbo), gordura: Math.round(t.gordura) };
}

export const ATIVIDADES: [string, number, string][] = [
  ["Sedentário", 1.2, "Pouco ou nenhum exercício"],
  ["Levemente ativo", 1.375, "Exercício leve, 1 a 3x por semana"],
  ["Moderadamente ativo", 1.55, "Exercício moderado, 3 a 5x por semana"],
  ["Muito ativo", 1.725, "Exercício intenso, 6 a 7x por semana"],
  ["Extremamente ativo", 1.9, "Treino muito intenso + trabalho físico pesado"],
];
export const OBJETIVOS = ["Emagrecimento", "Manutenção", "Ganho de massa muscular", "Recomposição corporal", "Melhora de performance", "Saúde geral"];

export const tmb = (p: Profile) => {
  const b = 10 * p.peso + 6.25 * p.altura - 5 * p.idade;
  return p.sexo === "Feminino" ? b - 161 : b + 5;
};
export const fatorAtividade = (a: string) => ATIVIDADES.find((x) => x[0] === a)?.[1] ?? 1.55;
export const imcClasse = (v: number) => (v < 18.5 ? "Abaixo do peso" : v < 25 ? "Eutrofia" : v < 30 ? "Sobrepeso" : "Obesidade grau I+");

/** Metas diárias (Mifflin-St Jeor × fator de atividade, ou gasto informado), menos o déficit. */
export function metas(p: Profile, deficit: number, protPerKg: number, fatPct: number, gastoManual?: number) {
  const base = tmb(p);
  const fator = fatorAtividade(p.atividade);
  const getCalc = base * fator;
  const usandoManual = !!gastoManual && gastoManual > 0;
  const get = usandoManual ? (gastoManual as number) : getCalc;
  const meta = get - deficit;
  const proteina = p.peso * protPerKg;
  const gordura = (meta * (fatPct / 100)) / 9;
  const carboidrato = Math.max(0, (meta - proteina * 4 - gordura * 9) / 4);
  const imc = p.peso / Math.pow(p.altura / 100, 2);
  return { tmb: base, get, getCalculado: getCalc, usandoGastoManual: usandoManual, fator, meta, proteina, gordura, carboidrato, imc, imcClasse: imcClasse(imc) };
}
export const metasDoEstado = (s: AppState) => metas(s.profile, s.deficit, s.protPerKg, s.fatPct, s.gastoManualAtivo ? s.gastoManualKcal : undefined);

/** Ritmo de mudança de peso → kcal/dia (≈7700 kcal por kg). ritmoPct = % do peso por semana. */
export function ritmoPeso(peso: number, desejado: number, ritmoPct: number) {
  const diff = desejado - peso;
  if (!peso || Math.abs(diff) < 0.1) return { direcao: "manutencao" as const, kgAlvo: 0, kgPorSemana: 0, kcalPorDia: 0, semanas: 0 };
  const direcao = diff < 0 ? ("deficit" as const) : ("superavit" as const);
  const kgSem = peso * (ritmoPct / 100);
  const kcal = Math.round((kgSem * 7700) / 7);
  return { direcao, kgAlvo: Math.abs(diff), kgPorSemana: kgSem, kcalPorDia: direcao === "deficit" ? kcal : -kcal, semanas: kgSem > 0 ? Math.abs(diff) / kgSem : 0 };
}

export function aguaMetaL(s: AppState) {
  return Math.round(((s.profile.peso * s.mlPerKg) / 1000) * 10) / 10;
}

// ===== Central de segurança =====
export type Nivel = "verde" | "amarelo" | "vermelho";
export const PERGUNTAS_SAUDE: { key: keyof HealthScreening; pergunta: string }[] = [
  { key: "dorPeitoOuTontura", pergunta: "Sente dor no peito, tontura forte ou falta de ar incomum ao esforço?" },
  { key: "condicaoCardiaca", pergunta: "Tem alguma condição cardíaca diagnosticada?" },
  { key: "gestanteOuLactante", pergunta: "Está grávida ou amamentando?" },
  { key: "cirurgiaOuLesaoRecente", pergunta: "Fez cirurgia ou teve lesão grave nos últimos 3 meses?" },
  { key: "cirurgiaBariatrica", pergunta: "Já fez cirurgia bariátrica?" },
  { key: "doencaRenal", pergunta: "Tem doença renal diagnosticada?" },
  { key: "doencaHepatica", pergunta: "Tem doença hepática relevante diagnosticada?" },
  { key: "diabetesRiscoHipoglicemia", pergunta: "Trata diabetes com insulina ou remédio com risco de hipoglicemia?" },
  { key: "condicaoCronicaControlada", pergunta: "Tem outra condição crônica controlada (ex.: hipertensão, tireoide)?" },
  { key: "dorArticular", pergunta: "Sente dor articular ou nas costas que limita alguns movimentos?" },
  { key: "usoMedicacaoContinua", pergunta: "Usa alguma medicação contínua?" },
  { key: "sinalComportamentoAlimentar", pergunta: "Sua relação com a comida já te trouxe sofrimento ou preocupação intensa?" },
];

export function triagem(h: HealthScreening, imc: number, idade?: number) {
  const motivos: string[] = [];
  let nivel: Nivel = "verde";
  const red = (m: string) => { nivel = "vermelho"; motivos.push(m); };
  const yellow = (m: string) => { if (nivel !== "vermelho") nivel = "amarelo"; motivos.push(m); };
  if (h.dorPeitoOuTontura) red("Dor no peito, tontura forte ou falta de ar ao esforço pedem avaliação médica antes de ajustar treino ou dieta.");
  if (h.condicaoCardiaca) red("Condição cardíaca: treino e déficit calórico precisam de orientação médica.");
  if (h.gestanteOuLactante) red("Gestação/lactação: as fórmulas de déficit e treinos intensos do app não se aplicam sem acompanhamento.");
  if (h.cirurgiaOuLesaoRecente) red("Cirurgia ou lesão recente: retome treino e dieta só com liberação profissional.");
  if (h.cirurgiaBariatrica) red("Cirurgia bariátrica: nutrição e treino pedem acompanhamento especializado.");
  if (h.doencaRenal) red("Doença renal: proteína e déficit precisam ser definidos com um profissional.");
  if (h.doencaHepatica) red("Doença hepática: ajustes de dieta e treino intenso pedem avaliação médica.");
  if (h.diabetesRiscoHipoglicemia) red("Diabetes com risco de hipoglicemia: ajuste déficit e treino com a sua equipe de saúde.");
  if (idade != null && idade > 0 && idade < 18) red("Menor de idade: o motor automático do app é pensado para adultos.");
  if (h.sinalComportamentoAlimentar) red("Você sinalizou uma relação difícil com a comida: o app não vai gerar planos de déficit. Um nutricionista ou psicólogo pode ajudar.");
  if (imc > 0 && imc < 16) red(`IMC (${imc.toFixed(1)}) muito baixo: priorize avaliação profissional.`);
  if (imc > 40) red(`IMC (${imc.toFixed(1)}) alto: acompanhamento profissional deixa o plano mais seguro e eficaz.`);
  if (h.condicaoCronicaControlada) yellow("Condição crônica controlada: mantenha o acompanhamento médico habitual.");
  if (h.dorArticular) yellow("Dor articular/nas costas: prefira versões de menor impacto dos exercícios.");
  if (h.usoMedicacaoContinua) yellow("Medicação contínua: variações de peso/apetite podem ter outras causas.");
  if (nivel === "verde") motivos.push("Nenhum sinal de atenção na triagem.");
  return { nivel: nivel as Nivel, motivos };
}

// ===== Plano alimentar gerado =====
const MODELO = [
  { nome: "Café da manhã", hora: "07:00", pct: 0.19, itens: [["cuscuz", 0.45], ["ovo", 0.35], ["banana", 0.2]], sub: "tapioca" },
  { nome: "Lanche", hora: "10:00", pct: 0.11, itens: [["iogurte", 0.4], ["aveia", 0.35], ["banana", 0.25]], sub: "maca" },
  { nome: "Almoço", hora: "12:30", pct: 0.28, itens: [["arroz", 0.28], ["feijao", 0.17], ["frango", 0.55]], sub: "macaxeira" },
  { nome: "Pré-treino", hora: "17:30", pct: 0.09, itens: [["pao", 0.6], ["banana", 0.4]], sub: "bdoce" },
  { nome: "Pós-treino", hora: "20:45", pct: 0.11, itens: [["whey", 0.4], ["tapioca", 0.6]], sub: "batata" },
  { nome: "Jantar", hora: "21:30", pct: 0.22, itens: [["carne", 0.5], ["bdoce", 0.5]], sub: "frango" },
] as const;
const r5 = (x: number) => Math.max(0, Math.round(x / 5) * 5);

export function gerarPlano(metaKcal: number): PlanMeal[] {
  const total = Math.max(800, Math.round(metaKcal));
  const base = Date.now();
  return MODELO.map((m, i) => {
    const alvo = total * m.pct;
    let partes = m.itens
      .map(([id, pct]) => {
        const f = foodById(id);
        const g = r5(((alvo * pct) / f.kcal) * 100);
        return { f, g, kcal: Math.round((f.kcal * g) / 100) };
      })
      .filter((p) => p.g > 0);
    if (partes.length === 0) {
      const f = foodById(m.itens[0][0]);
      partes = [{ f, g: 5, kcal: Math.round(f.kcal * 0.05) }];
    }
    const kcal = partes.reduce((s, p) => s + p.kcal, 0);
    const sub = foodById(m.sub);
    const g = r5((partes[0].kcal / sub.kcal) * 100);
    return {
      id: base + i,
      hora: m.hora,
      nome: m.nome,
      descricao: partes.map((p) => `${p.f.nome} ${p.g} g`).join(" + "),
      kcal,
      substituicao: g > 0 ? `Trocar ${partes[0].f.nome} por ${sub.nome} ${g} g` : "",
      itens: partes.map((p) => ({ foodId: p.f.id, qtdGramas: p.g })),
    };
  });
}

export const TIPOS_DIA = ["Descanso", "Treino leve", "Treino intenso"];
export const ajusteTipoDia = (tipo: string) => (tipo === "Descanso" ? -250 : tipo === "Treino intenso" ? 350 : 0);
export const carboTipoDia = (tipo: string, peso: number) => Math.round(peso * (tipo === "Descanso" ? 3 : tipo === "Treino leve" ? 4.5 : 6));

export const LISTA_COMPRAS = [
  { id: "prot", l: "Proteínas", items: ["Peito de frango 2 kg", "Ovos 30 un", "Carne magra 1 kg", "Iogurte natural 6 un"] },
  { id: "carb", l: "Carboidratos", items: ["Arroz 5 kg", "Feijão 2 kg", "Batata-doce 3 kg", "Aveia 1 kg", "Cuscuz 1 kg"] },
  { id: "fruta", l: "Frutas e vegetais", items: ["Banana 2 dz", "Mamão 2 un", "Folhas 3 maços", "Tomate 1 kg"] },
  { id: "sup", l: "Suplementos", items: ["Whey 900 g", "Creatina 300 g", "Eletrólitos 10 sachês"] },
];

/** Estimativa simples de kcal por minuto conforme esforço percebido (PSE 1–10). */
export const kcalEstimada = (min: number, pse: number) => Math.round(min * (3 + pse * 0.75));
export const intensidade = (pse: number) => (pse <= 3 ? "Leve" : pse <= 6 ? "Moderada" : "Alta");
