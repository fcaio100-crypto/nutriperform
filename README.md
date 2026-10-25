# NutriPerform

App de nutrição clínica e esportiva + treino. React + TypeScript + Tailwind + Vite.

## Estrutura

Navegação com 5 áreas fixas no rodapé:

| Área | O que tem |
|---|---|
| **Hoje** | Calorias e macros do dia, água, treino do dia, ações rápidas, refeições |
| **Comer** | Diário (por data, passado e futuro) · Plano alimentar · Água · Suplementos |
| **Treinar** | Musculação · Funcional (níveis com progressão) · Corrida · Mobilidade · Esportes |
| **Progresso** | Peso e corpo · Evolução · Metas e cálculos |
| **Perfil** | Dados, triagem de saúde, tema, sincronização, administração, sair |

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
  screens/             telas por área
  sheets/              adicionar alimento, peso, treino, montar plano, cadastro guiado
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
