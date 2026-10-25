import type { Food } from "../lib/types";

// Valores por 100 g, aproximados (TACO / USDA). porcao = [gramas, medida caseira].
type Row = [string, string, number, number, number, number, number, string, number, string];

const rows: Row[] = [
  // id, nome, kcal, proteína, carbo, gordura, fibra, categoria, porção (g), medida caseira
  ["arroz", "Arroz branco cozido", 128, 2.5, 28, 0.2, 1.6, "Carboidratos", 90, "2 colheres de servir"],
  ["feijao", "Feijão carioca cozido", 76, 4.8, 13.6, 0.5, 8.5, "Carboidratos", 86, "1 concha"],
  ["frango", "Frango grelhado (peito)", 165, 31, 0, 3.6, 0, "Proteínas", 100, "1 filé médio"],
  ["carne", "Carne bovina magra", 219, 26, 0, 12, 0, "Proteínas", 100, "1 bife médio"],
  ["ovo", "Ovo de galinha", 143, 13, 1, 9.5, 0, "Proteínas", 50, "1 unidade"],
  ["leite", "Leite integral", 61, 3.2, 4.8, 3.3, 0, "Laticínios", 200, "1 copo"],
  ["queijo", "Queijo coalho", 300, 22, 2, 23, 0, "Laticínios", 40, "1 fatia/espeto"],
  ["aveia", "Aveia em flocos", 394, 13.9, 66, 8.5, 9.1, "Carboidratos", 30, "2 colheres de sopa"],
  ["banana", "Banana prata", 92, 1.3, 23, 0.1, 2, "Frutas", 60, "1 unidade"],
  ["maca", "Maçã", 56, 0.3, 15, 0.2, 1.3, "Frutas", 130, "1 unidade"],
  ["batata", "Batata inglesa cozida", 52, 1.2, 11.9, 0, 1.3, "Carboidratos", 100, "1 unidade média"],
  ["bdoce", "Batata-doce cozida", 77, 0.6, 18.4, 0.1, 2.2, "Carboidratos", 100, "1 pedaço médio"],
  ["macaxeira", "Macaxeira cozida", 125, 0.6, 30, 0.3, 1.6, "Carboidratos", 100, "1 pedaço médio"],
  ["pao", "Pão francês", 300, 8, 58.6, 3.1, 2.3, "Carboidratos", 50, "1 unidade"],
  ["cuscuz", "Cuscuz de milho", 113, 2.2, 25, 0.3, 1.4, "Carboidratos", 120, "1 porção"],
  ["tapioca", "Tapioca (goma)", 250, 0, 61, 0.1, 0.6, "Carboidratos", 50, "1 tapioca média"],
  ["iogurte", "Iogurte natural integral", 51, 4.1, 4.7, 1.5, 0, "Laticínios", 170, "1 pote"],
  ["whey", "Whey protein concentrado", 400, 80, 8, 5, 0, "Suplementos", 30, "1 scoop"],
  // Frutas
  ["mamao_papaia", "Mamão papaia", 40, 0.5, 10.4, 0.1, 1, "Frutas", 150, "½ unidade"],
  ["mamao_formosa", "Mamão formosa", 45, 0.8, 11.6, 0.1, 1.8, "Frutas", 170, "1 fatia"],
  ["tangerina", "Tangerina (poncã)", 38, 0.8, 9.6, 0.1, 0.9, "Frutas", 110, "1 unidade"],
  ["laranja", "Laranja pera", 37, 1, 8.9, 0.1, 0.8, "Frutas", 140, "1 unidade"],
  ["abacaxi", "Abacaxi", 48, 0.9, 12.3, 0.1, 1, "Frutas", 75, "1 fatia"],
  ["melancia", "Melancia", 33, 0.9, 8.1, 0, 0.1, "Frutas", 200, "1 fatia"],
  ["melao", "Melão", 29, 0.7, 7.5, 0, 0.3, "Frutas", 115, "1 fatia"],
  ["manga", "Manga", 72, 0.4, 19.4, 0.2, 1.6, "Frutas", 200, "1 unidade"],
  ["goiaba", "Goiaba vermelha", 54, 1.1, 13, 0.4, 6.2, "Frutas", 170, "1 unidade"],
  ["uva", "Uva", 53, 0.7, 13.6, 0.2, 0.9, "Frutas", 100, "1 cacho pequeno"],
  ["acerola", "Acerola", 33, 0.9, 8, 0.2, 1.5, "Frutas", 120, "10 unidades"],
  ["abacate", "Abacate", 96, 1.2, 6, 8.4, 6.3, "Frutas", 90, "2 colheres de sopa"],
  ["morango", "Morango", 30, 0.9, 6.8, 0.3, 1.7, "Frutas", 120, "10 unidades"],
  ["banana_nanica", "Banana nanica", 92, 1.4, 23.8, 0.1, 1.9, "Frutas", 85, "1 unidade"],
  ["caju", "Caju", 43, 1, 10.3, 0.3, 1.7, "Frutas", 100, "1 unidade"],
  ["pera", "Pera", 53, 0.6, 14, 0.1, 3, "Frutas", 130, "1 unidade"],
  ["kiwi", "Kiwi", 51, 1.3, 11.5, 0.6, 2.7, "Frutas", 76, "1 unidade"],
  // Pães, massas e carboidratos
  ["pao_queijo", "Pão de queijo", 363, 5.1, 34.2, 24.6, 0.6, "Carboidratos", 30, "1 unidade média"],
  ["pao_forma", "Pão de forma tradicional", 253, 12, 44.1, 2.7, 2.3, "Carboidratos", 25, "1 fatia"],
  ["pao_integral", "Pão de forma integral", 253, 9.4, 49.9, 3.7, 6.9, "Carboidratos", 25, "1 fatia"],
  ["cream_cracker", "Biscoito cream cracker", 432, 10.1, 68.7, 14.4, 2.5, "Carboidratos", 6, "1 unidade"],
  ["maisena", "Biscoito maisena", 443, 8.1, 75.2, 12, 2.1, "Carboidratos", 5, "1 unidade"],
  ["arroz_integral", "Arroz integral cozido", 124, 2.6, 25.8, 1, 2.7, "Carboidratos", 90, "2 colheres de servir"],
  ["macarrao", "Macarrão cozido", 157, 5.8, 30.7, 0.9, 1.8, "Carboidratos", 110, "1 escumadeira"],
  ["farinha_mandioca", "Farinha de mandioca", 361, 1.6, 87.9, 0.3, 6.4, "Carboidratos", 16, "1 colher de sopa"],
  ["inhame", "Inhame cozido", 97, 2.1, 23.2, 0.1, 1.7, "Carboidratos", 100, "1 pedaço médio"],
  ["milho", "Milho verde (lata, escorrido)", 98, 3.2, 17.1, 2.4, 4.6, "Carboidratos", 50, "2 colheres de sopa"],
  ["granola", "Granola", 420, 10, 64, 14, 7, "Carboidratos", 30, "2 colheres de sopa"],
  ["batata_frita", "Batata frita", 267, 5, 35.6, 13.1, 8.1, "Carboidratos", 80, "1 porção pequena"],
  ["feijao_preto", "Feijão preto cozido", 77, 4.5, 14, 0.5, 8.4, "Carboidratos", 86, "1 concha"],
  // Proteínas
  ["carne_moida", "Carne moída (patinho) cozida", 219, 35.9, 0, 7.3, 0, "Proteínas", 75, "3 colheres de sopa"],
  ["coxa_frango", "Coxa de frango assada sem pele", 173, 24.2, 0, 7.8, 0, "Proteínas", 90, "1 unidade"],
  ["tilapia", "Tilápia grelhada", 128, 26.2, 0, 2.7, 0, "Proteínas", 120, "1 filé"],
  ["sardinha", "Sardinha em lata (escorrida)", 208, 24.6, 0, 11.5, 0, "Proteínas", 84, "1 lata"],
  ["atum", "Atum em lata em água (escorrido)", 116, 25.5, 0, 0.8, 0, "Proteínas", 120, "1 lata"],
  ["clara", "Clara de ovo cozida", 59, 13.4, 0, 0.1, 0, "Proteínas", 33, "1 clara"],
  ["linguica", "Linguiça de porco grelhada", 296, 23.2, 0, 21.9, 0, "Proteínas", 60, "1 gomo"],
  ["presunto", "Presunto", 94, 14.3, 2.1, 2.7, 0, "Proteínas", 15, "1 fatia"],
  ["figado", "Fígado bovino grelhado", 225, 29.9, 4.2, 9, 0, "Proteínas", 100, "1 bife"],
  // Laticínios
  ["mucarela", "Queijo muçarela", 330, 22.6, 3, 25.2, 0, "Laticínios", 15, "1 fatia"],
  ["minas", "Queijo minas frescal", 264, 17.4, 3.2, 20.2, 0, "Laticínios", 30, "1 fatia"],
  ["requeijao", "Requeijão cremoso", 257, 9.6, 2.4, 23.4, 0, "Laticínios", 30, "1 colher de sopa"],
  ["leite_desnatado", "Leite desnatado", 35, 3.4, 4.9, 0.2, 0, "Laticínios", 200, "1 copo"],
  ["iogurte_desnatado", "Iogurte natural desnatado", 41, 3.8, 5.8, 0.3, 0, "Laticínios", 170, "1 pote"],
  ["manteiga", "Manteiga com sal", 726, 0.4, 0.1, 82.4, 0, "Laticínios", 5, "1 colher de chá"],
  // Gorduras e oleaginosas
  ["pasta_amendoim", "Pasta de amendoim integral", 588, 25, 20, 50, 6, "Gorduras e oleaginosas", 15, "1 colher de sopa"],
  ["amendoim", "Amendoim torrado", 606, 22.5, 18.7, 54, 7.8, "Gorduras e oleaginosas", 30, "1 punhado"],
  ["castanha_caju", "Castanha de caju torrada", 570, 18.5, 29.1, 46.3, 3.7, "Gorduras e oleaginosas", 25, "10 unidades"],
  ["castanha_para", "Castanha-do-pará", 643, 14.5, 15.1, 63.5, 7.9, "Gorduras e oleaginosas", 8, "2 unidades"],
  ["azeite", "Azeite de oliva", 884, 0, 0, 100, 0, "Gorduras e oleaginosas", 13, "1 colher de sopa"],
  ["chia", "Chia", 486, 16.5, 42, 30.7, 34.4, "Gorduras e oleaginosas", 12, "1 colher de sopa"],
  // Verduras e legumes
  ["alface", "Alface", 11, 1.3, 1.7, 0.2, 1.8, "Verduras e legumes", 50, "1 prato raso"],
  ["tomate", "Tomate", 15, 1.1, 3.1, 0.2, 1.2, "Verduras e legumes", 100, "1 unidade"],
  ["cenoura", "Cenoura crua", 34, 1.3, 7.7, 0.2, 3.2, "Verduras e legumes", 70, "1 unidade média"],
  ["brocolis", "Brócolis cozido", 25, 2.1, 4.4, 0.5, 3.4, "Verduras e legumes", 60, "3 ramos"],
  ["pepino", "Pepino", 10, 0.9, 2, 0, 1.1, "Verduras e legumes", 60, "½ unidade"],
  ["beterraba", "Beterraba cozida", 32, 1.3, 7.2, 0.1, 1.9, "Verduras e legumes", 40, "2 colheres de sopa"],
  ["abobora", "Abóbora cozida", 48, 1.4, 10.8, 0.7, 2.5, "Verduras e legumes", 70, "2 colheres de sopa"],
  ["chuchu", "Chuchu cozido", 19, 0.4, 4.8, 0, 1, "Verduras e legumes", 60, "2 colheres de sopa"],
  // Bebidas e outros
  ["suco_laranja", "Suco de laranja natural", 33, 0.7, 7.6, 0.1, 0, "Bebidas e outros", 200, "1 copo"],
  ["cafe", "Café sem açúcar", 9, 0.7, 1.5, 0.1, 0, "Bebidas e outros", 50, "1 xícara"],
  ["acucar", "Açúcar", 387, 0, 99.5, 0, 0, "Bebidas e outros", 5, "1 colher de chá"],
  ["mel", "Mel", 309, 0, 84, 0, 0, "Bebidas e outros", 20, "1 colher de sopa"],
  ["refrigerante", "Refrigerante de cola", 34, 0, 8.7, 0, 0, "Bebidas e outros", 350, "1 lata"],
  ["acai", "Açaí na tigela (com xarope)", 110, 0.7, 21.5, 3.7, 1.7, "Bebidas e outros", 300, "1 tigela"],
  ["coxinha", "Coxinha de frango", 283, 9.6, 34.5, 11.8, 1.8, "Bebidas e outros", 80, "1 unidade"],
  ["chocolate", "Chocolate ao leite", 540, 7.2, 59.6, 30.3, 2.2, "Bebidas e outros", 25, "2 quadradinhos"],
];

export const FOODS: Food[] = rows.map(([id, nome, kcal, proteina, carbo, gordura, fibra, categoria, g, rot]) => ({
  id,
  nome,
  kcal,
  proteina,
  carbo,
  gordura,
  fibra,
  categoria,
  porcao: [g, rot],
}));

export const FOOD_CATEGORIES = Array.from(new Set(FOODS.map((f) => f.categoria)));

export function foodById(id: string): Food {
  return FOODS.find((f) => f.id === id) ?? FOODS[0];
}

export function normalize(x: string) {
  return String(x || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function searchFoods(q: string, categoria?: string) {
  const n = normalize(q);
  return FOODS.filter((f) => (!categoria || f.categoria === categoria) && normalize(f.nome + " " + f.categoria).includes(n));
}
