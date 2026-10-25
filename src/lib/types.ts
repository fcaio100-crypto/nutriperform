export type Sexo = "Masculino" | "Feminino";

export interface Profile {
  nome: string;
  idade: number;
  sexo: Sexo;
  peso: number;
  altura: number;
  abdomen: number;
  gordura: number;
  massaMagra: number;
  objetivo: string;
  pesoDesejado: number;
  atividade: string;
  diasTreinoSemana: number;
  minutosPorTreino: number;
  modalidadePrincipal?: string;
}

export interface MealItem {
  id: number;
  foodId: string;
  qtdGramas: number;
}

export interface Meal {
  id: string;
  nome: string;
  hora: string;
  items: MealItem[];
}

export interface Workout {
  id: number;
  modalidade: string;
  data: string; // dd/mm
  hora: string;
  duracaoMin: number;
  intensidade: string;
  distancia: string;
  kcal: number;
  pse: number;
  origem?: string;
  kcalInformado?: boolean;
  nivel?: number;
  sensacao?: string;
}

export interface WeightEntry {
  data: string;
  peso: number;
}

export interface Supplement {
  id: number;
  nome: string;
  dose: string;
  hora: string;
  frequencia: string;
  objetivo: string;
}

export interface User {
  email: string;
  name: string;
  passHash: string;
  passSalt: string;
  createdAt: string;
  role: "user" | "admin";
}

export interface HistoryEntry {
  date: string; // yyyy-mm-dd
  waterMl?: number;
  kcal: number;
  proteina: number;
  carbo: number;
  gordura: number;
}

export interface PlanMeal {
  id: number;
  hora: string;
  nome: string;
  descricao: string;
  kcal: number;
  substituicao?: string;
  itens?: { foodId: string; qtdGramas: number }[];
}

export interface Exercicio {
  id: number;
  nome: string;
  series: number;
  repeticoes: string;
}

export interface DiaTreino {
  id: number;
  dia: string;
  foco: string;
  exercicios: Exercicio[];
}

export type HealthScreening = {
  dorPeitoOuTontura: boolean;
  condicaoCardiaca: boolean;
  gestanteOuLactante: boolean;
  cirurgiaOuLesaoRecente: boolean;
  cirurgiaBariatrica: boolean;
  doencaRenal: boolean;
  doencaHepatica: boolean;
  diabetesRiscoHipoglicemia: boolean;
  condicaoCronicaControlada: boolean;
  dorArticular: boolean;
  usoMedicacaoContinua: boolean;
  sinalComportamentoAlimentar: boolean;
  observacoes: string;
};

export interface DayData {
  meals: Meal[];
  waterMl: number;
}

export interface AppState {
  profile: Profile;
  meals: Meal[];
  workouts: Workout[];
  weights: WeightEntry[];
  supplements: Supplement[];
  waterMl: number;
  deficit: number;
  protPerKg: number;
  fatPct: number;
  mlPerKg: number;
  gastoManualAtivo: boolean;
  gastoManualKcal: number;
  dayType: string;
  shoppingChecks: Record<string, boolean>;
  users: User[];
  auth: { currentUserEmail: string | null; loginTries: number; lockedUntil: number | null };
  history: HistoryEntry[];
  lastActiveDate: string;
  onboardingDone: boolean;
  theme: "Claro" | "Escuro";
  screen: string;
  planoPersonalizadoAtivo: boolean;
  planoPersonalizado: PlanMeal[];
  treinoPersonalizadoAtivo: boolean;
  treinoPersonalizado: DiaTreino[];
  planoSeguidoHoje: boolean;
  healthScreening: HealthScreening;
  dias?: Record<string, DayData>;
  diaVisto?: string;
  /** treino planejado por dia da semana (0=domingo) */
  agenda?: Record<string, string>;
  /** troca pontual do treino de uma data (yyyy-mm-dd) */
  treinoDoDia?: Record<string, string>;
}

export interface Food {
  id: string;
  nome: string;
  kcal: number;
  proteina: number;
  carbo: number;
  gordura: number;
  fibra: number;
  categoria: string;
  porcao?: [number, string];
}
