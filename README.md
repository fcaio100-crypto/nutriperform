# NutriPerform

App de nutrição clínica e esportiva + treino. React + TypeScript + Tailwind + Vite.

## Estrutura

"Dia guiado": 3 abas fixas no rodapé.

| Aba | O que tem |
|---|---|
| **Hoje** | Treino do dia (pela semana de treino) com botão Começar, comida, água e a semana |
| **Histórico** | Peso, calorias dos últimos dias e todos os treinos |
| **Eu** | Dados, semana de treino, musculação, metas, plano alimentar, suplementos, saúde, tema |

```
src/
  App.tsx              rotas das 5 áreas e folhas (sheets)
  state/store.tsx      estado, ações, persistência local + banco do Claude, virada de dia
  state/ui.tsx         navegação de sub-abas, folhas e avisos
  lib/calc.ts          metas (Mifflin-St Jeor), ritmo de peso, triagem, plano gerado
  lib/auth.ts          contas locais (SHA-256 com salt)
  data/foods.ts        85 alimentos com medidas caseiras (TACO/USDA)
  data/exercises.ts    musculação, funcional (níveis), mobilidade, dicas e vídeos
  components/          UI base e casca (rodapé, seletor de dia, central de segurança)
  screens/             Hoje, Histórico, Eu (+ subpáginas em screens/eu)
  sheets/              treino guiado, adicionar comida, peso, atividade, plano, cadastro
  lib/plan.ts          treino planejado do dia e rotação da musculação
```

Os dados usam a mesma chave (`nutriperform.state.v1`) e o mesmo documento do banco
(`app/state`) das versões anteriores, então tudo que já foi registrado continua valendo.

## Rodar

```bash
npm install
npm run dev     # desenvolvimento
npm run build   # gera dist/ (base relativa: funciona na Vercel e no artifact)
```

## Próximos passos

- Backend próprio (Supabase) para autenticação e dados — hoje as contas são locais (MVP).
- Vídeos licenciados dos exercícios (hoje o botão abre a busca no YouTube).
- Empacotar para Android/iOS (Capacitor).
