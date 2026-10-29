// Conector MCP do FocoNow: deixa o Claude (Cowork, Claude Code, claude.ai) listar, criar,
// atualizar e concluir tarefas em nome do usuário.
//
// Autenticação: o Supabase Auth é o servidor OAuth 2.1. O Claude descobre isso pelo
// /.well-known/oauth-protected-resource (api/oauth-protected-resource.ts), o usuário entra
// e aprova em /oauth/consent, e cada chamada chega aqui com o access token do Supabase.
// Usamos esse token no client do Supabase, então o RLS do banco vale igual ao app.

import {
  createMcpHandler,
  McpServer,
  OAuthError,
  OAuthErrorCode,
  requireBearerAuth,
  type CallToolResult,
} from '@modelcontextprotocol/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ''
// "Hoje" do usuário: o app usa o fuso do navegador; aqui fixamos o do Brasil (configurável).
const TIME_ZONE = process.env.FOCONOW_TZ ?? 'America/Sao_Paulo'

// Mesmos valores de src/types.ts (CATEGORY_META / PRIORITY_META)
const CATEGORIES = ['proposta', 'reuniao', 'arquitetura', 'documentacao', 'admin', 'outro'] as const
const PRIORITIES = ['alta', 'media', 'baixa'] as const

const INSTRUCTIONS = `FocoNow é o gerenciador de tarefas e Pomodoro do usuário. Use estas ferramentas para
cadastrar, consultar, atualizar e concluir as tarefas dele.

- Categorias: proposta, reuniao, arquitetura, documentacao, admin, outro.
- Prioridades: alta (25 pontos ao concluir), media (15), baixa (10).
- Prazos são datas yyyy-MM-dd no fuso ${TIME_ZONE}. Toda resposta traz o campo "hoje" para você
  converter "amanhã", "sexta" etc. sem chutar a data.
- Uma tarefa tem pomodoros estimados (blocos de 25 min); use 1 se não souber.
- Concluir pelo conector dá os mesmos pontos e streak de concluir no app.
- Antes de excluir, confirme com o usuário; prefira concluir ou reabrir.`

// ---------- datas no fuso do usuário ----------

function dayInZone(date = new Date()) {
  // en-CA formata como yyyy-MM-dd
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date)
}

function addDays(day: string, days: number) {
  const d = new Date(`${day}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Início do dia local como instante ISO (para comparar com completed_at, que é timestamptz). */
function startOfDayISO(day: string) {
  const offset = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, timeZoneName: 'longOffset' })
    .formatToParts(new Date(`${day}T12:00:00Z`))
    .find((p) => p.type === 'timeZoneName')!
    .value.replace('GMT', '')
  return new Date(`${day}T00:00:00${offset || 'Z'}`).toISOString()
}

// ---------- formato das respostas ----------

type TaskRow = {
  id: number
  title: string
  category: string
  priority: string
  due_date: string | null
  estimated_pomodoros: number
  completed_pomodoros: number
  done: boolean
  created_at: string
  completed_at: string | null
}

function presentTask(r: TaskRow) {
  return {
    id: r.id,
    titulo: r.title,
    categoria: r.category,
    prioridade: r.priority,
    prazo: r.due_date,
    pomodoros: `${r.completed_pomodoros}/${r.estimated_pomodoros}`,
    concluida: r.done,
    concluida_em: r.completed_at,
    criada_em: r.created_at,
  }
}

function ok(data: Record<string, unknown>): CallToolResult {
  const payload = { hoje: dayInZone(), ...data }
  return { content: [{ type: 'text', text: JSON.stringify(payload) }], structuredContent: payload }
}

function fail(message: string): CallToolResult {
  return { content: [{ type: 'text', text: message }], isError: true }
}

// ---------- schemas ----------

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato yyyy-MM-dd')
const taskId = z.number().int().positive().describe('id da tarefa (veja listar_tarefas)')

// ---------- servidor ----------

function userClient(token: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function buildServer(db: SupabaseClient) {
  const server = new McpServer({ name: 'foconow', version: '1.0.0' }, { instructions: INSTRUCTIONS })

  async function findTask(id: number) {
    const { data, error } = await db.from('tasks').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data as TaskRow | null
  }

  server.registerTool(
    'listar_tarefas',
    {
      title: 'Listar tarefas',
      description:
        'Lista as tarefas do FocoNow com filtros. Sem filtros, traz as pendentes ordenadas por prazo. ' +
        'Para histórico ("o que fiz essa semana"), use status "concluidas" com concluidas_de/concluidas_ate.',
      inputSchema: z.object({
        status: z.enum(['pendentes', 'concluidas', 'todas']).default('pendentes'),
        prazo: z
          .enum(['hoje', 'atrasadas', 'ate_hoje', 'proximos_7_dias', 'sem_prazo'])
          .optional()
          .describe('ate_hoje = atrasadas + hoje'),
        categoria: z.enum(CATEGORIES).optional(),
        prioridade: z.enum(PRIORITIES).optional(),
        busca: z.string().min(1).optional().describe('trecho do título'),
        concluidas_de: day.optional().describe('concluídas a partir deste dia (inclusive)'),
        concluidas_ate: day.optional().describe('concluídas até este dia (inclusive)'),
        limite: z.number().int().min(1).max(200).default(50),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args) => {
      const today = dayInZone()
      let q = db.from('tasks').select('*')

      if (args.status === 'pendentes') q = q.eq('done', false)
      if (args.status === 'concluidas') q = q.eq('done', true)

      if (args.prazo === 'hoje') q = q.eq('due_date', today)
      if (args.prazo === 'atrasadas') q = q.lt('due_date', today).eq('done', false)
      if (args.prazo === 'ate_hoje') q = q.lte('due_date', today)
      if (args.prazo === 'proximos_7_dias') q = q.gte('due_date', today).lte('due_date', addDays(today, 7))
      if (args.prazo === 'sem_prazo') q = q.is('due_date', null)

      if (args.categoria) q = q.eq('category', args.categoria)
      if (args.prioridade) q = q.eq('priority', args.prioridade)
      if (args.busca) q = q.ilike('title', `%${args.busca}%`)
      if (args.concluidas_de) q = q.gte('completed_at', startOfDayISO(args.concluidas_de))
      if (args.concluidas_ate) q = q.lt('completed_at', startOfDayISO(addDays(args.concluidas_ate, 1)))

      q =
        args.status === 'concluidas'
          ? q.order('completed_at', { ascending: false })
          : q.order('due_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false })

      const { data, error } = await q.limit(args.limite)
      if (error) return fail(`Erro ao listar tarefas: ${error.message}`)
      const tarefas = (data as TaskRow[]).map(presentTask)
      return ok({ total: tarefas.length, tarefas })
    },
  )

  server.registerTool(
    'criar_tarefa',
    {
      title: 'Criar tarefa',
      description: 'Cadastra uma nova tarefa pendente no FocoNow.',
      inputSchema: z.object({
        titulo: z.string().trim().min(1).max(300),
        categoria: z.enum(CATEGORIES).default('outro'),
        prioridade: z.enum(PRIORITIES).default('media'),
        prazo: day.optional().describe('data limite yyyy-MM-dd'),
        pomodoros_estimados: z.number().int().min(1).max(20).default(1),
      }),
    },
    async (args) => {
      const { data, error } = await db
        .from('tasks')
        .insert({
          title: args.titulo,
          category: args.categoria,
          priority: args.prioridade,
          due_date: args.prazo ?? null,
          estimated_pomodoros: args.pomodoros_estimados,
        })
        .select('*')
        .single()
      if (error) return fail(`Erro ao criar tarefa: ${error.message}`)
      return ok({ tarefa: presentTask(data as TaskRow) })
    },
  )

  server.registerTool(
    'atualizar_tarefa',
    {
      title: 'Atualizar tarefa',
      description: 'Altera título, categoria, prioridade, prazo ou pomodoros estimados. Envie só o que muda.',
      inputSchema: z.object({
        id: taskId,
        titulo: z.string().trim().min(1).max(300).optional(),
        categoria: z.enum(CATEGORIES).optional(),
        prioridade: z.enum(PRIORITIES).optional(),
        prazo: day.nullable().optional().describe('null remove o prazo'),
        pomodoros_estimados: z.number().int().min(1).max(20).optional(),
      }),
      annotations: { idempotentHint: true },
    },
    async (args) => {
      const patch: Record<string, unknown> = {}
      if (args.titulo !== undefined) patch.title = args.titulo
      if (args.categoria !== undefined) patch.category = args.categoria
      if (args.prioridade !== undefined) patch.priority = args.prioridade
      if (args.prazo !== undefined) patch.due_date = args.prazo
      if (args.pomodoros_estimados !== undefined) patch.estimated_pomodoros = args.pomodoros_estimados
      if (Object.keys(patch).length === 0) return fail('Nada para atualizar: envie pelo menos um campo.')

      const { data, error } = await db.from('tasks').update(patch).eq('id', args.id).select('*').maybeSingle()
      if (error) return fail(`Erro ao atualizar tarefa: ${error.message}`)
      if (!data) return fail(`Tarefa ${args.id} não encontrada.`)
      return ok({ tarefa: presentTask(data as TaskRow) })
    },
  )

  server.registerTool(
    'concluir_tarefa',
    {
      title: 'Concluir tarefa',
      description: 'Marca a tarefa como concluída e dá os pontos da prioridade (igual ao app).',
      inputSchema: z.object({ id: taskId }),
      annotations: { idempotentHint: true },
    },
    async ({ id }) => {
      const before = await findTask(id)
      if (!before) return fail(`Tarefa ${id} não encontrada.`)

      const { data, error } = await db.rpc('complete_task', { p_task_id: id, p_today: dayInZone() })
      if (error) return fail(`Erro ao concluir tarefa: ${error.message}`)

      const { data: rewards } = await db.from('rewards').select('points, streak_days').maybeSingle()
      return ok({
        tarefa: presentTask(data as TaskRow),
        ja_estava_concluida: before.done,
        pontos_total: rewards?.points ?? null,
        streak_dias: rewards?.streak_days ?? null,
      })
    },
  )

  server.registerTool(
    'reabrir_tarefa',
    {
      title: 'Reabrir tarefa',
      description: 'Volta uma tarefa concluída para pendente (os pontos já ganhos não são removidos).',
      inputSchema: z.object({ id: taskId }),
      annotations: { idempotentHint: true },
    },
    async ({ id }) => {
      const { data, error } = await db
        .from('tasks')
        .update({ done: false, completed_at: null })
        .eq('id', id)
        .select('*')
        .maybeSingle()
      if (error) return fail(`Erro ao reabrir tarefa: ${error.message}`)
      if (!data) return fail(`Tarefa ${id} não encontrada.`)
      return ok({ tarefa: presentTask(data as TaskRow) })
    },
  )

  server.registerTool(
    'excluir_tarefa',
    {
      title: 'Excluir tarefa',
      description: 'Apaga a tarefa definitivamente. Confirme com o usuário antes.',
      inputSchema: z.object({ id: taskId }),
      annotations: { destructiveHint: true },
    },
    async ({ id }) => {
      const { data, error } = await db.from('tasks').delete().eq('id', id).select('*').maybeSingle()
      if (error) return fail(`Erro ao excluir tarefa: ${error.message}`)
      if (!data) return fail(`Tarefa ${id} não encontrada.`)
      return ok({ excluida: presentTask(data as TaskRow) })
    },
  )

  return server
}

// ---------- HTTP ----------

const handler = createMcpHandler((ctx) => buildServer(userClient(ctx.authInfo!.token)))

function resourceMetadataUrl(request: Request) {
  const origin = process.env.FOCONOW_PUBLIC_URL ?? new URL(request.url).origin
  return `${origin}/.well-known/oauth-protected-resource/api/mcp`
}

async function serve(request: Request): Promise<Response> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response('Servidor sem SUPABASE_URL/SUPABASE_ANON_KEY configurados.', { status: 500 })
  }

  const gate = requireBearerAuth({
    resourceMetadataUrl: resourceMetadataUrl(request),
    verifier: {
      async verifyAccessToken(token) {
        // getClaims valida a assinatura pelo JWKS (chaves assimétricas) ou consulta o Auth (HS256)
        // getClaims lança (em vez de devolver error) quando o token nem é um JWT
        const { data, error } = await userClient(token)
          .auth.getClaims(token)
          .catch((err: unknown) => ({ data: null, error: err }))
        if (error || !data) throw new OAuthError(OAuthErrorCode.InvalidToken, 'Invalid or expired token') // vai no header: só ASCII
        const claims = data.claims as { sub: string; exp: number; client_id?: string; scope?: string }
        return {
          token,
          clientId: claims.client_id ?? 'foconow',
          scopes: (claims.scope ?? '').split(' ').filter(Boolean),
          expiresAt: claims.exp,
          extra: { userId: claims.sub },
        }
      },
    },
  })

  const auth = await gate(request)
  if (auth instanceof Response) return auth
  return handler.fetch(request, { authInfo: auth })
}

export const GET = serve
export const POST = serve
export const DELETE = serve
