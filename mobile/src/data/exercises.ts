// ===== Musculação: biblioteca e divisão sugerida =====
export const GRUPOS: Record<string, string[]> = {
  Peito: ["Supino reto com barra", "Supino inclinado com halteres", "Crucifixo", "Flexão de braço", "Crossover"],
  Costas: ["Puxada frente", "Remada baixa", "Remada curvada", "Puxada supinada", "Remada unilateral"],
  Pernas: ["Agachamento livre", "Leg press", "Cadeira extensora", "Mesa flexora", "Afundo", "Panturrilha em pé"],
  Ombro: ["Desenvolvimento com halteres", "Elevação lateral", "Elevação frontal", "Remada alta"],
  Braço: ["Rosca direta", "Tríceps corda", "Rosca martelo", "Tríceps testa", "Rosca alternada"],
  Abdômen: ["Abdominal supra", "Prancha", "Elevação de pernas", "Abdominal oblíquo"],
};

function divisao(dias: number) {
  if (dias <= 2)
    return Array.from({ length: Math.max(1, dias) }, () => ({ foco: "Corpo inteiro", grupos: ["Pernas", "Peito", "Costas", "Ombro", "Braço", "Abdômen"] }));
  if (dias === 3)
    return [
      { foco: "Corpo inteiro A", grupos: ["Pernas", "Peito", "Costas"] },
      { foco: "Corpo inteiro B", grupos: ["Pernas", "Ombro", "Braço"] },
      { foco: "Corpo inteiro C", grupos: ["Pernas", "Peito", "Costas", "Abdômen"] },
    ];
  if (dias === 4)
    return [
      { foco: "Superiores A", grupos: ["Peito", "Ombro", "Braço"] },
      { foco: "Inferiores A", grupos: ["Pernas", "Abdômen"] },
      { foco: "Superiores B", grupos: ["Costas", "Ombro", "Braço"] },
      { foco: "Inferiores B", grupos: ["Pernas", "Abdômen"] },
    ];
  if (dias === 5)
    return [
      { foco: "Peito", grupos: ["Peito"] },
      { foco: "Costas", grupos: ["Costas"] },
      { foco: "Pernas", grupos: ["Pernas"] },
      { foco: "Ombro", grupos: ["Ombro"] },
      { foco: "Braço e abdômen", grupos: ["Braço", "Abdômen"] },
    ];
  return [
    { foco: "Push (peito, ombro, tríceps)", grupos: ["Peito", "Ombro", "Braço"] },
    { foco: "Pull (costas, bíceps)", grupos: ["Costas", "Braço"] },
    { foco: "Pernas", grupos: ["Pernas"] },
    { foco: "Push (peito, ombro, tríceps)", grupos: ["Peito", "Ombro", "Braço"] },
    { foco: "Pull (costas, bíceps)", grupos: ["Costas", "Braço"] },
    { foco: "Pernas e abdômen", grupos: ["Pernas", "Abdômen"] },
  ].slice(0, dias);
}

const exerciciosPorTempo = (min: number) => (min <= 30 ? 4 : min <= 45 ? 5 : min <= 60 ? 6 : min <= 90 ? 7 : 8);
const repsPorObjetivo = (o: string) =>
  o === "Emagrecimento" || o === "Recomposição corporal" ? "12-15" : o === "Ganho de massa muscular" ? "8-12" : o === "Melhora de performance" ? "6-10" : "10-15";
const seriesPorObjetivo = (o: string) => (o === "Ganho de massa muscular" || o === "Melhora de performance" ? 4 : 3);

export function treinoSugerido(objetivo: string, diasSemana: number, minutos: number) {
  const dias = Math.min(6, Math.max(1, Math.round(diasSemana) || 3));
  const qtd = exerciciosPorTempo(minutos > 0 ? minutos : 60);
  const reps = repsPorObjetivo(objetivo);
  const series = seriesPorObjetivo(objetivo);
  const idx: Record<string, number> = {};
  return divisao(dias).map((d, i) => {
    const ex: { nome: string; series: number; repeticoes: string }[] = [];
    let g = 0;
    let guard = 0;
    while (ex.length < qtd && guard < qtd * d.grupos.length + 10) {
      const grupo = d.grupos[g % d.grupos.length];
      const lista = GRUPOS[grupo];
      const p = (idx[grupo] ?? 0) % lista.length;
      ex.push({ nome: lista[p], series, repeticoes: reps });
      idx[grupo] = p + 1;
      g++;
      guard++;
    }
    return { dia: `Dia ${i + 1}`, foco: d.foco, exercicios: ex };
  });
}

// ===== Funcional em casa: níveis =====
export type Item = [string, string];
export interface Nivel {
  n: number;
  nome: string;
  min: number;
  voltas: string;
  prancha: string;
  circ: Item[];
  agil: Item[];
}

export const FUNC_MOD = "Funcional em casa";
export const FUNC_META = 3;

export const NIVEIS: Nivel[] = [
  {
    n: 1, nome: "Base", min: 32, voltas: "2 voltas · 1 min de descanso", prancha: "20 s",
    circ: [["Agachamento livre", "10"], ["Afundo alternado", "8 por perna"], ["Flexão com joelho apoiado", "8"], ["Remada curvada com mochila", "10"], ["Subida no degrau (step-up)", "6 por perna"], ["Mountain climber", "16 no total"], ["Prancha lateral", "15 s por lado"]],
    agil: [["Skipping no lugar", "3 × 20 s"], ["Pés rápidos", "3 × 15 s"], ["Deslocamento lateral + toque no chão", "4 por lado"]],
  },
  {
    n: 2, nome: "Construção", min: 37, voltas: "3 voltas · 1 min de descanso", prancha: "30 s",
    circ: [["Agachamento livre", "12"], ["Afundo alternado", "10 por perna"], ["Flexão (joelho apoiado se precisar)", "10"], ["Remada curvada com mochila", "12"], ["Subida no degrau (step-up)", "8 por perna"], ["Mountain climber", "20 no total"], ["Prancha lateral", "20 s por lado"]],
    agil: [["Skipping no lugar", "4 × 20 s"], ["Pés rápidos", "4 × 15 s"], ["Deslocamento lateral + toque no chão", "6 por lado"], ["Agachamento + arrancada de 3 passos", "6"]],
  },
  {
    n: 3, nome: "Potência", min: 40, voltas: "3 voltas · 45 s de descanso", prancha: "40 s",
    circ: [["Agachamento com salto", "10"], ["Agachamento búlgaro (pé no sofá)", "8 por perna"], ["Flexão completa", "12"], ["Remada com mochila mais pesada", "12"], ["Step-up com joelho alto", "10 por perna"], ["Mountain climber", "30 no total"], ["Prancha lateral", "30 s por lado"]],
    agil: [["Skipping rápido", "5 × 20 s"], ["Pés rápidos + giro", "5 × 15 s"], ["Deslocamento lateral + toque no chão", "8 por lado"], ["Agachamento + arrancada de 3 passos", "8"]],
  },
  {
    n: 4, nome: "Atleta", min: 44, voltas: "4 voltas · 45 s de descanso", prancha: "45 s",
    circ: [["Agachamento com salto", "12"], ["Agachamento búlgaro (pé no sofá)", "10 por perna"], ["Flexão completa", "15"], ["Remada unilateral com mochila", "12 por lado"], ["Burpee", "8"], ["Mountain climber", "30 no total"], ["Prancha lateral com elevação de quadril", "10 por lado"]],
    agil: [["Skipping rápido", "6 × 20 s"], ["Pés rápidos + giro", "6 × 15 s"], ["Deslocamento lateral + arrancada", "8 por lado"], ["Burpee + arrancada de 3 passos", "6"]],
  },
];

export const MOBILIDADE: Item[] = [
  ["Agachamento profundo segurando na porta/mesa", "1 min"],
  ["Afundo com rotação de tronco", "5 por lado"],
  ["Quadril 90/90 (sentado no chão)", "1 min por lado"],
  ["Tornozelo na parede (joelho passa da ponta do pé)", "10 por lado"],
  ["Rotação torácica deitado de lado (open book)", "8 por lado"],
  ["Alongamento do flexor do quadril", "30 s por lado"],
  ["Alongamento de posterior de coxa", "30 s por lado"],
];

export interface Bloco {
  id: string;
  titulo: string;
  tempo: string;
  dica: string;
  itens: Item[];
}

export function blocosFuncional(N: Nivel): Bloco[] {
  return [
    { id: "mob", titulo: "Mobilidade", tempo: "8 min", dica: "Movimentos lentos e controlados, sem dor.", itens: MOBILIDADE.slice(0, 5) },
    { id: "ativ", titulo: "Ativação", tempo: "5 min", dica: "Acorda glúteo e core antes do circuito.", itens: [["Ponte de glúteo", N.n >= 3 ? "15 (unilateral, por perna)" : "15"], ["Abdução de quadril deitado de lado", "12 por lado"], ["Prancha", N.prancha]] },
    { id: "circ", titulo: "Circuito", tempo: N.voltas, dica: `Nível ${N.n} — ${N.voltas}.`, itens: N.circ },
    { id: "agil", titulo: "Agilidade", tempo: "6 min", dica: "Espaço pequeno basta. Foco em pés rápidos e mudança de direção.", itens: N.agil },
    { id: "desaq", titulo: "Desaquecimento", tempo: "3 min", dica: "Respiração lenta.", itens: [["Alongamento de posterior de coxa", "30 s por lado"], ["Alongamento do flexor do quadril", "30 s por lado"], ["Alongamento de panturrilha na parede", "30 s por lado"]] },
  ];
}

// Regra de progressão: "Fácil"/"Na medida" = 1 ponto; 3 pontos sobe de nível.
// "Difícil" não pontua; 2 "Difícil" seguidos voltam um nível.
export function progressoFuncional(ws: { modalidade: string; sensacao?: string }[]) {
  const ses = ws.filter((w) => w.modalidade === FUNC_MOD).slice().reverse();
  let nivel = 1, pts = 0, dif = 0;
  let ultimo: "subiu" | "desceu" | null = null;
  for (const w of ses) {
    const s = w.sensacao || "Na medida";
    ultimo = null;
    if (s === "Difícil") {
      dif++;
      if (dif >= 2 && nivel > 1) { nivel--; pts = 0; dif = 0; ultimo = "desceu"; }
    } else {
      dif = 0;
      pts++;
      if (pts >= FUNC_META && nivel < NIVEIS.length) { nivel++; pts = 0; ultimo = "subiu"; }
    }
  }
  return { nivel, pts, total: ses.length, ultimo, max: nivel === NIVEIS.length };
}

// ===== Explicações: [como fazer, termo de busca do vídeo] =====
export const DICAS: Record<string, [string, string]> = {
  "Agachamento profundo segurando na porta/mesa": ["Segure em algo firme, desça o máximo que conseguir com calcanhares no chão e fique embaixo mexendo o quadril de um lado para o outro.", "agachamento profundo mobilidade quadril"],
  "Afundo com rotação de tronco": ["Dê um passo à frente, desça o joelho de trás perto do chão, apoie a mão do lado da perna da frente e gire o tronco abrindo o outro braço para o teto.", "world's greatest stretch como fazer"],
  "Quadril 90/90 (sentado no chão)": ["Sente com as duas pernas dobradas em 90°, uma na frente e outra ao lado. Mantenha o tronco reto, incline à frente sobre a perna da frente e depois troque o lado girando os joelhos.", "mobilidade quadril 90 90 como fazer"],
  "Tornozelo na parede (joelho passa da ponta do pé)": ["Pé a um palmo da parede, leve o joelho para frente até tocar a parede sem tirar o calcanhar do chão. Afaste o pé aos poucos.", "mobilidade de tornozelo na parede"],
  "Rotação torácica deitado de lado (open book)": ["Deitado de lado, joelhos dobrados e braços estendidos à frente. Abra o braço de cima como um livro, girando o peito para o outro lado.", "open book mobilidade torácica"],
  "Ponte de glúteo": ["Deitado de costas, joelhos dobrados e pés no chão. Suba o quadril apertando o glúteo até alinhar joelho, quadril e ombro; desça devagar.", "ponte de glúteo como fazer"],
  "Abdução de quadril deitado de lado": ["Deitado de lado, perna de baixo dobrada. Eleve a perna de cima esticada, sem girar o quadril para trás.", "abdução de quadril deitado de lado"],
  Prancha: ["Apoie antebraços e pontas dos pés, corpo reto da cabeça ao calcanhar. Contraia abdômen e glúteo; não deixe o quadril cair.", "prancha abdominal como fazer certo"],
  "Agachamento livre": ["Pés na largura dos ombros, empurre o quadril para trás e desça como quem senta numa cadeira, peito aberto e joelhos acompanhando a ponta dos pés.", "agachamento livre como fazer certo"],
  "Afundo alternado": ["Dê um passo à frente e desça até os dois joelhos ficarem perto de 90°. Empurre com a perna da frente para voltar e alterne.", "afundo alternado como fazer"],
  "Flexão com joelho apoiado": ["Mãos um pouco mais abertas que os ombros, joelhos no chão e corpo reto. Desça o peito até perto do chão e empurre.", "flexão com joelho apoiado como fazer"],
  "Flexão (joelho apoiado se precisar)": ["Corpo reto, mãos um pouco mais abertas que os ombros. Desça o peito até perto do chão e empurre. Quando cansar, apoie os joelhos.", "flexão de braço iniciante progressão"],
  "Flexão completa": ["Apoio nas mãos e pontas dos pés, corpo em prancha. Desça o peito até quase tocar o chão com cotovelos a ~45° do corpo e empurre.", "flexão de braço como fazer certo"],
  "Remada curvada com mochila": ["Coloque livros ou garrafas na mochila. Incline o tronco com as costas retas e puxe a mochila até a barriga, juntando as escápulas.", "remada curvada com mochila em casa"],
  "Remada com mochila mais pesada": ["Mesmo movimento da remada curvada, com mais peso na mochila. Costas retas e descida controlada.", "remada curvada com mochila em casa"],
  "Remada unilateral com mochila": ["Apoie uma mão e um joelho no sofá. Com a outra mão puxe a mochila até a lateral da barriga, cotovelo junto ao corpo.", "remada unilateral serrote em casa"],
  "Subida no degrau (step-up)": ["Suba num degrau ou cadeira firme empurrando com a perna de cima, sem dar impulso com a de baixo. Desça controlando.", "step up exercício como fazer"],
  "Step-up com joelho alto": ["Suba no degrau com uma perna e, no alto, eleve o joelho da outra até a altura do quadril.", "step up com elevação de joelho"],
  "Mountain climber": ["Em posição de flexão, leve os joelhos alternadamente em direção ao peito num ritmo constante, sem subir o quadril.", "mountain climber como fazer"],
  "Prancha lateral": ["Apoie o antebraço com o cotovelo abaixo do ombro, pés empilhados e corpo reto. Segure o quadril alto.", "prancha lateral como fazer"],
  "Prancha lateral com elevação de quadril": ["Na prancha lateral, desça o quadril quase até o chão e suba de novo, sem girar o tronco.", "prancha lateral com elevação de quadril"],
  "Agachamento com salto": ["Faça o agachamento e suba explodindo num salto. Aterrisse macio, com joelhos dobrados.", "agachamento com salto como fazer"],
  "Agachamento búlgaro (pé no sofá)": ["Pé de trás apoiado no sofá, pé da frente bem adiante. Desça reto até a coxa da frente ficar paralela ao chão.", "agachamento búlgaro em casa"],
  Burpee: ["Agache, apoie as mãos no chão, jogue os pés para trás em prancha, volte e suba com um salto.", "burpee como fazer iniciante"],
  "Skipping no lugar": ["Corra no lugar elevando os joelhos até a altura do quadril, na ponta dos pés.", "skipping alto exercício"],
  "Skipping rápido": ["Skipping com a maior velocidade de pés possível, joelhos altos e braços acompanhando.", "skipping alto exercício"],
  "Pés rápidos": ["Levemente agachado, faça toques curtos e muito rápidos alternando os pés, sem sair do lugar.", "fast feet exercício agilidade"],
  "Pés rápidos + giro": ["Pés rápidos e, a cada 5 s, gire 180° e continue. Treina mudança de direção.", "fast feet exercício agilidade"],
  "Deslocamento lateral + toque no chão": ["Em base baixa, dê 3 passos laterais rápidos sem cruzar os pés, toque o chão com a mão e volte.", "deslocamento lateral agilidade futebol"],
  "Deslocamento lateral + arrancada": ["3 passos laterais rápidos em base baixa e, em seguida, arrancada curta à frente.", "deslocamento lateral agilidade futebol"],
  "Agachamento + arrancada de 3 passos": ["Faça um agachamento rápido e saia em arrancada explosiva de 3 passos à frente.", "arrancada explosiva treino futebol"],
  "Burpee + arrancada de 3 passos": ["Faça um burpee e, ao subir, saia em arrancada de 3 passos à frente.", "arrancada explosiva treino futebol"],
  "Alongamento de posterior de coxa": ["Perna esticada num degrau baixo, incline o tronco à frente com as costas retas até sentir alongar atrás da coxa.", "alongamento posterior de coxa"],
  "Alongamento do flexor do quadril": ["Afundo com o joelho de trás no chão. Contraia o glúteo e leve o quadril à frente.", "alongamento flexor do quadril"],
  "Alongamento de panturrilha na parede": ["Mãos na parede, uma perna atrás esticada com calcanhar no chão. Incline o corpo à frente.", "alongamento de panturrilha na parede"],
};

export function videoUrl(nome: string) {
  const d = DICAS[nome];
  return "https://www.youtube.com/results?search_query=" + encodeURIComponent((d ? d[1] : nome + " como fazer exercício") + " shorts");
}

export const MODALIDADES = ["Musculação", FUNC_MOD, "Corrida", "Caminhada", "Mobilidade", "Futebol", "Beach tennis", "Ciclismo", "CrossFit", "Natação"];

export const ABAS_TREINO = [
  { id: "musc", label: "Musculação", mods: ["Musculação", "CrossFit"], reg: "Musculação" },
  { id: "func", label: "Funcional", mods: [FUNC_MOD], reg: FUNC_MOD },
  { id: "corr", label: "Corrida", mods: ["Corrida"], reg: "Corrida" },
  { id: "mob", label: "Mobilidade", mods: ["Mobilidade"], reg: "Mobilidade" },
  { id: "esp", label: "Esportes", mods: ["Futebol", "Beach tennis", "Ciclismo", "Natação"], reg: "Futebol" },
] as const;
export type AbaTreino = (typeof ABAS_TREINO)[number]["id"];

// ===== Semana de treino =====
export const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const OPCOES_TREINO = [FUNC_MOD, "Musculação", "Corrida", "Caminhada", "Mobilidade", "Futebol", "Beach tennis", "Ciclismo", "Natação", "Descanso"];
export const AGENDA_PADRAO: Record<string, string> = {
  "0": "Descanso", "1": FUNC_MOD, "2": "Corrida", "3": FUNC_MOD, "4": "Mobilidade", "5": "Futebol", "6": "Beach tennis",
};
export const DURACAO_PADRAO: Record<string, number> = {
  Mobilidade: 10, Corrida: 30, Caminhada: 40, Futebol: 60, "Beach tennis": 60, Musculação: 60, Ciclismo: 45, Natação: 40, CrossFit: 50,
};
export const COM_DISTANCIA = ["Corrida", "Caminhada", "Ciclismo", "Natação"];
