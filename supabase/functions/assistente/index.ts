// Edge Function "assistente" — assistente de treino e nutrição do NutriPerform (Google Gemini).
//
// O app envia { mensagens, contexto } com o JWT da pessoa. A chave da API fica no Vault
// (lida via RPC assistente_config, só service_role) e nunca chega ao aparelho.
// A conversa fica salva em public.assistente_conversa: se a pessoa sair do app no meio,
// a resposta é gerada mesmo assim (EdgeRuntime.waitUntil) e aparece quando ela voltar.
// Teste interno: header x-cron-secret (mesmo segredo dos lembretes) + { teste: true }.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const resposta = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const LIMITE_DIA = 40;
const MODELOS = ['gemini-2.5-flash', 'gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
const TEMPO_MAX_MS = 25000; // por chamada ao Gemini
const TEMPO_TOTAL_MS = 80000; // por pergunta
let prazo = 0;

const INSTRUCOES = `Você é o assistente do app NutriPerform: personal trainer e nutricionista esportivo ao mesmo tempo, falando português do Brasil. Treino e alimentação andam juntos: um sempre complementa o outro.

Como responder:
- Seja breve e prático: no máximo uns 8 a 12 linhas ou uma lista curta. Use números concretos (séries, repetições, tempo, descanso, gramas, kcal, ml, horários).
- Baseie-se nos DADOS DE HOJE da pessoa (metas, o que já comeu, água, treino planejado, semana de treino, treinos recentes, nível). Faça as contas e mostre o resultado (ex.: "faltam 640 kcal e 52 g de proteína").
- Sempre conecte as duas áreas: ao montar ou comentar um treino, diga o que comer antes/depois e quanto de água; ao falar de comida, considere o treino do dia (dia forte = mais carboidrato; descanso = menos).
- Treinos: monte sessões completas e seguras quando pedirem (aquecimento, parte principal com séries × repetições ou tempo, descanso e desaquecimento). Respeite o nível da pessoa, o tempo disponível e o que ela já treinou na semana (evite repetir o mesmo grupo muscular em dias seguidos). Para funcional, prefira exercícios sem equipamento ou com mochila/degrau.
- Prefira alimentos comuns no Brasil (arroz, feijão, frango, ovos, cuscuz, tapioca, macaxeira, frutas, iogurte etc.).
- Use formatação simples: frases curtas, listas com "-", negrito com **texto** só quando útil.

Limites de segurança (obrigatórios):
- Você não é médico, nutricionista nem educador físico registrado e não substitui consulta. Não faça diagnósticos, não prescreva medicamentos nem doses de suplementos fora das faixas usuais de rótulo.
- Nunca incentive jejuns prolongados, dietas muito restritivas (abaixo da taxa metabólica basal), purgação, excesso de exercício para compensar comida ou perda de peso rápida.
- Se a pessoa relatar dor no peito, desmaio, tontura, lesão ou dor articular, gravidez, doença cardíaca/renal/hepática, diabetes ou uso de medicamentos, seja conservador, não passe treino intenso e recomende procurar um profissional de saúde.
- Se o contexto indicar ALERTA DE SEGURANÇA, seja conservador: sem déficit calórico e sem treino intenso.
- Fale só de treino, nutrição, hidratação, sono, recuperação e hábitos; recuse outros assuntos com gentileza.

Ações no app (funções):
- Você pode executar ações no app da pessoa com as funções disponíveis: marcar exercícios ou a sessão de treino como feitos, marcar refeições do plano como consumidas (e lançar no diário), registrar alimentos, água, peso e treinos.
- Só execute quando a pessoa pedir ou afirmar claramente que fez/comeu/bebeu algo (ex.: "fiz o treino", "comi o almoço do plano", "bebi 500 ml", "pesei 105,4", "joguei futebol 1 hora"). Em dúvida, pergunte antes.
- Use somente os ids listados em "IDS PARA AÇÕES". Nunca invente ids. Não repita ação já feita (itens marcados como feito/consumida).
- Se a pessoa comeu algo fora do plano, registre com registrar_alimento usando o alimento mais parecido do banco e a quantidade informada (pergunte a quantidade se ela não disser). Se não houver nada parecido no banco, explique.
- Depois de agir, confirme em 1–2 linhas o que foi feito e, se útil, quanto ainda falta das metas.`;

const FERRAMENTAS = [
  {
    functionDeclarations: [
      {
        name: 'marcar_exercicios',
        description: 'Marca (ou desmarca) exercícios específicos do treino de hoje no checklist.',
        parameters: {
          type: 'OBJECT',
          properties: {
            ids: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Ids dos exercícios (ex.: ex-s1-123)' },
            feito: { type: 'BOOLEAN', description: 'true = marcar como feito; false = desmarcar' },
          },
          required: ['ids', 'feito'],
        },
      },
      {
        name: 'concluir_sessao_treino',
        description: 'Marca todos os exercícios de uma sessão de treino de hoje como feitos e, por padrão, registra o treino no histórico.',
        parameters: {
          type: 'OBJECT',
          properties: {
            sessao: { type: 'STRING', description: 'Chave da sessão: "unica" quando há uma só, ou "s1", "s2"…' },
            registrar_no_historico: { type: 'BOOLEAN' },
            duracao_min: { type: 'NUMBER', description: 'Duração real em minutos, se a pessoa informou' },
          },
          required: ['sessao'],
        },
      },
      {
        name: 'marcar_refeicao_plano',
        description: 'Marca refeições do plano alimentar de hoje como consumidas e, por padrão, lança os alimentos dela no diário.',
        parameters: {
          type: 'OBJECT',
          properties: {
            ids: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Ids das refeições do plano (ex.: ref-123)' },
            consumida: { type: 'BOOLEAN' },
            registrar_no_diario: { type: 'BOOLEAN' },
          },
          required: ['ids', 'consumida'],
        },
      },
      {
        name: 'registrar_alimento',
        description: 'Adiciona um alimento do banco do app a uma refeição do diário de hoje.',
        parameters: {
          type: 'OBJECT',
          properties: {
            refeicao_id: { type: 'STRING', description: 'Id da refeição do diário' },
            alimento_id: { type: 'STRING', description: 'Id do alimento no banco' },
            gramas: { type: 'NUMBER' },
          },
          required: ['refeicao_id', 'alimento_id', 'gramas'],
        },
      },
      {
        name: 'registrar_agua',
        description: 'Soma água bebida hoje, em ml.',
        parameters: { type: 'OBJECT', properties: { ml: { type: 'NUMBER' } }, required: ['ml'] },
      },
      {
        name: 'registrar_peso',
        description: 'Registra o peso medido hoje, em kg.',
        parameters: { type: 'OBJECT', properties: { kg: { type: 'NUMBER' } }, required: ['kg'] },
      },
      {
        name: 'registrar_treino',
        description: 'Registra no histórico um treino feito fora do plano (ex.: futebol, corrida extra).',
        parameters: {
          type: 'OBJECT',
          properties: {
            modalidade: { type: 'STRING' },
            duracao_min: { type: 'NUMBER' },
            intensidade: { type: 'STRING', enum: ['Leve', 'Moderada', 'Alta'] },
            distancia_km: { type: 'NUMBER' },
          },
          required: ['modalidade', 'duracao_min'],
        },
      },
    ],
  },
];

interface Acao {
  nome: string;
  args: Record<string, unknown>;
}

interface Mensagem {
  papel: 'usuario' | 'assistente';
  texto: string;
}

let chaveCache: string | null = null;
async function chave(): Promise<string> {
  if (chaveCache) return chaveCache;
  const { data, error } = await admin.rpc('assistente_config');
  const k = (data as Record<string, string> | null)?.assistente_gemini_key;
  if (error || !k) throw new Error('chave indisponível');
  chaveCache = k;
  return k;
}

type Parte = { text?: string; thought?: boolean; functionCall?: { name: string; args?: Record<string, unknown> } };

async function chamar(modelo: string, h: Record<string, string>, corpo: unknown): Promise<{ ok: boolean; status: number; txt: string }> {
  const resta = prazo - Date.now();
  if (resta < 3000) return { ok: false, status: 504, txt: 'tempo total esgotado' };
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...h },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(Math.min(TEMPO_MAX_MS, resta)),
    });
    return { ok: r.ok, status: r.status, txt: await r.text() };
  } catch (e) {
    return { ok: false, status: 504, txt: `tempo esgotado ou falha de rede: ${String(e)}` };
  }
}

async function perguntarGemini(
  mensagens: Mensagem[],
  contexto: string
): Promise<{ texto: string; modelo: string; acoes: Acao[] }> {
  const k = await chave();
  prazo = Date.now() + TEMPO_TOTAL_MS;
  const contents: unknown[] = mensagens.map((m) => ({ role: m.papel === 'assistente' ? 'model' : 'user', parts: [{ text: m.texto }] }));
  const base = {
    systemInstruction: { parts: [{ text: `${INSTRUCOES}\n\nDADOS DE HOJE DA PESSOA:\n${contexto}` }] },
    tools: FERRAMENTAS,
    generationConfig: { temperature: 0.5, maxOutputTokens: 4096 },
  };
  // A chave pode ser do formato "AIza..." (header x-goog-api-key) ou um token (Authorization: Bearer)
  const cabecalhos = k.startsWith('AIza')
    ? [{ 'x-goog-api-key': k }]
    : [{ 'x-goog-api-key': k }, { Authorization: `Bearer ${k}` }];

  let ultimoErro = '';
  for (const modelo of MODELOS) {
    for (const h of cabecalhos) {
      const acoes: Acao[] = [];
      const conversa = [...contents];
      let r = await chamar(modelo, h, { ...base, contents: conversa });
      // Até 3 rodadas: o modelo pede funções, o app as executa e o modelo escreve a confirmação.
      for (let rodada = 0; r.ok && rodada < 3; rodada++) {
        const j = JSON.parse(r.txt);
        const conteudo = j?.candidates?.[0]?.content;
        const partes: Parte[] = conteudo?.parts ?? [];
        const chamadas = partes.filter((p) => p.functionCall).map((p) => p.functionCall!);
        if (!chamadas.length) {
          const texto = partes
            .filter((p) => p.text && !p.thought)
            .map((p) => p.text)
            .join('')
            .trim();
          if (texto || acoes.length) return { texto, modelo, acoes };
          ultimoErro = `resposta vazia (${j?.candidates?.[0]?.finishReason ?? j?.promptFeedback?.blockReason ?? '?'})`;
          break;
        }
        chamadas.forEach((c) => acoes.push({ nome: c.name, args: c.args ?? {} }));
        conversa.push(conteudo); // devolve o turno do modelo como veio (inclui assinaturas de raciocínio)
        conversa.push({
          role: 'user',
          parts: chamadas.map((c) => ({
            functionResponse: { name: c.name, response: { ok: true, resultado: 'Ação enviada ao app da pessoa, que confere e aplica.' } },
          })),
        });
        r = await chamar(modelo, h, { ...base, contents: conversa });
      }
      if (r.ok) {
        if (acoes.length) return { texto: '', modelo, acoes };
        break; // próximo modelo
      }
      ultimoErro = `${modelo} ${r.status}: ${r.txt.slice(0, 300)}`;
      if (r.status === 429) break; // cota deste modelo — tenta o próximo
      if (r.status === 404 || r.status >= 500) break; // modelo indisponível/sobrecarregado — próximo modelo
      // 400/401/403: tenta o outro formato de autenticação, depois o próximo modelo
    }
  }
  if (ultimoErro.includes(' 429:')) throw new Error('limite do Gemini atingido: ' + ultimoErro);
  throw new Error(ultimoErro || 'falha no Gemini');
}

function limpar(mensagens: unknown): Mensagem[] {
  if (!Array.isArray(mensagens)) return [];
  const ok = mensagens
    .filter((m) => m && (m.papel === 'usuario' || m.papel === 'assistente') && typeof m.texto === 'string' && m.texto.trim())
    .map((m) => ({ papel: m.papel, texto: String(m.texto).slice(0, 2000) })) as Mensagem[];
  const ultimas = ok.slice(-12);
  while (ultimas.length && ultimas[0].papel !== 'usuario') ultimas.shift();
  return ultimas;
}

/** Gera a resposta e grava na conversa (roda até o fim mesmo se o app for fechado). */
async function responderEGravar(userId: string, mensagens: Mensagem[], contexto: string, restantes: number) {
  try {
    const r = await perguntarGemini(mensagens, contexto);
    const acoes = r.acoes.slice(0, 12);
    const { data } = await admin
      .from('assistente_conversa')
      .insert({ user_id: userId, papel: 'assistente', texto: r.texto, acoes, aplicado: acoes.length === 0 })
      .select('id')
      .single();
    return { texto: r.texto, acoes, restantes, id: data?.id ?? null };
  } catch (e) {
    const msg = String((e as Error).message ?? e);
    console.error('assistente:', msg);
    const erro = msg.startsWith('limite do Gemini')
      ? 'O assistente está muito requisitado agora. Tente de novo em alguns minutos.'
      : 'Não consegui responder agora. Tente de novo em instantes.';
    await admin.from('assistente_conversa').insert({ user_id: userId, papel: 'assistente', texto: erro, erro: true, aplicado: true });
    return { erro };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return resposta({ erro: 'método não permitido' }, 405);
  let corpo: Record<string, unknown> = {};
  try {
    corpo = await req.json();
  } catch {
    corpo = {};
  }

  try {
    // Teste interno com o segredo do cron (sem usuário)
    const segredo = req.headers.get('x-cron-secret');
    if (segredo && corpo.teste) {
      const { data } = await admin.rpc('lembretes_config');
      if (segredo !== (data as Record<string, string>)?.lembretes_cron_secret) return resposta({ erro: 'não autorizado' }, 401);
      const r = await perguntarGemini(
        Array.isArray(corpo.mensagens) ? limpar(corpo.mensagens) : [{ papel: 'usuario', texto: String(corpo.pergunta ?? 'Quanto de proteína ainda falta hoje? Responda em 2 linhas.') }],
        String(corpo.contexto ?? 'Meta: 2500 kcal, 150 g proteína. Consumido: 1200 kcal, 70 g proteína.')
      );
      return resposta({ ok: true, ...r });
    }

    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: u, error } = await admin.auth.getUser(jwt);
    if (error || !u?.user) return resposta({ erro: 'Faça login para usar o assistente.' }, 401);

    const mensagens = limpar(corpo.mensagens);
    if (!mensagens.length || mensagens[mensagens.length - 1].papel !== 'usuario') {
      return resposta({ erro: 'Escreva uma pergunta.' }, 400);
    }
    const contexto = String(corpo.contexto ?? '').slice(0, 12000);

    const dia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza' }).format(new Date());
    const { data: usadas } = await admin.rpc('assistente_contar', { p_user: u.user.id, p_dia: dia });
    const papel = (u.user.app_metadata as Record<string, string> | undefined)?.role;
    const limite = papel === 'master' ? LIMITE_DIA * 5 : LIMITE_DIA;
    if (Number(usadas) > limite) {
      return resposta({ erro: `Você chegou ao limite de ${limite} perguntas por hoje. Volte amanhã!` }, 429);
    }

    // grava a pergunta antes de responder
    await admin.from('assistente_conversa').insert({ user_id: u.user.id, papel: 'usuario', texto: mensagens[mensagens.length - 1].texto, aplicado: true });

    const tarefa = responderEGravar(u.user.id, mensagens, contexto, Math.max(0, limite - Number(usadas)));
    try { EdgeRuntime?.waitUntil(tarefa); } catch { /* fora do runtime do Supabase */ }
    const r = await tarefa;
    if ('erro' in r) return resposta(r, 500);
    return resposta(r);
  } catch (e) {
    const msg = String((e as Error).message ?? e);
    console.error('assistente:', msg);
    return resposta({ erro: 'Não consegui responder agora. Tente de novo em instantes.', detalhe: corpo.teste ? msg : undefined }, 500);
  }
});
