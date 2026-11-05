# NutriPerform — app nativo (Expo)

Versão para iOS e Android do NutriPerform, feita em Expo SDK 58 + React Native.
Usa o **mesmo Supabase** do app web (login, tabela `app_state` e o assistente), então
a conta e os dados são os mesmos no celular e em nutriperform.vercel.app.

## Liquid Glass

O visual usa o `expo-glass-effect` (Liquid Glass nativo do iOS 26):

| Onde | Como |
|---|---|
| Barra de abas | flutuante, em vidro; a aba ativa é uma "gota" de vidro verde (`GlassContainer` funde as duas) |
| Cards | todos em vidro sobre um fundo com manchas de cor (verde, limão, azul) |
| Folhas (adicionar comida, peso, card do treino…) | painel de vidro flutuante |
| Seletor de dia, abas, botões secundários, aviso (toast) | vidro interativo (reage ao toque) |
| Assistente | balões e campo de mensagem em vidro |
| Treino guiado | barra "Como foi o treino?" flutuante em vidro |

Tudo passa por `src/components/Glass.tsx`:
- **iOS 26+** → `GlassView` nativo (checando `isLiquidGlassAvailable()` e `isGlassEffectAPIAvailable()`).
- **iOS mais antigo** → `BlurView` com material do sistema.
- **Android** ou **"Reduzir transparência"** ligado → superfície translúcida/sólida.

## Rodar

```bash
cd mobile
npm install
npx expo start          # Expo Go mostra o app, mas o vidro de verdade precisa de build
```

O Liquid Glass é código nativo: para vê-lo, use um **development build** num iPhone com iOS 26:

```bash
npx eas-cli@latest build --profile development --platform ios
```

## Publicar nas lojas

```bash
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --platform ios      # App Store (precisa da conta Apple Developer)
npx eas-cli@latest submit --platform android  # Play Store (precisa da conta Google Play)
```

## Estrutura

```
App.tsx                 fontes, provedores, abas e folhas
src/components/Glass.tsx  vidro (GlassView / BlurView / fallback) e fundo vivo
src/components/ui.tsx   componentes base (Card, Button, Chips, Sheet, gráficos…)
src/screens/            Hoje, Assistente, Histórico, Eu (+ subpáginas)
src/sheets/             treino guiado, comida, peso, atividade, plano, cadastro, card do treino
src/lib, src/data       mesma lógica do app web (cálculos, alimentos, exercícios)
src/state/store.tsx     estado + AsyncStorage + Supabase
```

Ainda só no app web: marca d'água para fotos e lembretes por notificação.

`EXPO_PUBLIC_DEMO=1` abre o app sem login, com dados de exemplo (só para prévias de tela).
