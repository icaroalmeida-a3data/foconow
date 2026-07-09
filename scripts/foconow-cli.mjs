#!/usr/bin/env node
// CLI de tarefas do FocoNow — a mesma API/RLS do app, fora do navegador.
// Pensado para automações (Claude, cron, scripts): saída compacta e estável.
//
// Uso:
//   node scripts/foconow-cli.mjs list [--all]
//   node scripts/foconow-cli.mjs today
//   node scripts/foconow-cli.mjs add "título" [--cat proposta|reuniao|arquitetura|documentacao|admin|outro]
//                                            [--prio alta|media|baixa] [--due yyyy-mm-dd] [--pomos N]
//   node scripts/foconow-cli.mjs done <id>
//   node scripts/foconow-cli.mjs del <id>
//
// Auth: FOCONOW_EMAIL / FOCONOW_PASSWORD no .env (conta real);
// sem eles, cai nas credenciais de dev VITE_DEV_LOGIN_*.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnv() {
  const env = { ...process.env }
  try {
    for (const line of readFileSync(join(root, '.env'), 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (m && env[m[1]] === undefined) env[m[1]] = m[2]
    }
  } catch {
    /* sem .env: usa só process.env */
  }
  return env
}

const env = loadEnv()
const url = env.VITE_SUPABASE_URL
const anonKey = env.VITE_SUPABASE_ANON_KEY
const email = env.FOCONOW_EMAIL ?? env.VITE_DEV_LOGIN_EMAIL
const password = env.FOCONOW_PASSWORD ?? env.VITE_DEV_LOGIN_PASSWORD

if (!url || !anonKey || !email || !password) {
  console.error('Faltam variáveis: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY e FOCONOW_EMAIL/FOCONOW_PASSWORD (ou VITE_DEV_LOGIN_*).')
  process.exit(1)
}

const supabase = createClient(url, anonKey, { auth: { persistSession: false } })

function fail(message) {
  console.error(message)
  process.exit(1)
}

function fmt(row) {
  const flags = [row.done ? 'x' : ' ']
  const due = row.due_date ? ` due:${row.due_date}` : ''
  const pomos = ` ${row.completed_pomodoros}/${row.estimated_pomodoros}🍅`
  return `[${flags}] #${row.id} (${row.priority}/${row.category})${due}${pomos} ${row.title}`
}

function parseFlags(args) {
  const flags = {}
  const rest = []
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) flags[args[i].slice(2)] = args[i + 1] ?? '', i++
    else rest.push(args[i])
  }
  return { flags, rest }
}

const [cmd, ...args] = process.argv.slice(2)

const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
if (authError) fail(`Login falhou (${email}): ${authError.message}`)

const todayKey = new Date().toLocaleDateString('sv-SE') // yyyy-mm-dd no fuso local

switch (cmd) {
  case 'list': {
    const all = args.includes('--all')
    let query = supabase.from('tasks').select('*').order('done').order('due_date', { nullsFirst: false }).order('created_at')
    if (!all) query = query.eq('done', false)
    const { data, error } = await query
    if (error) fail(error.message)
    if (!data.length) console.log(all ? 'Nenhuma tarefa.' : 'Nenhuma tarefa pendente.')
    for (const row of data) console.log(fmt(row))
    break
  }

  case 'today': {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('done', false)
      .lte('due_date', todayKey)
      .order('due_date')
    if (error) fail(error.message)
    if (!data.length) console.log('Nada vencendo hoje (ou atrasado). 🎉')
    for (const row of data) {
      const late = row.due_date < todayKey ? ' ⚠️ ATRASADA' : ''
      console.log(fmt(row) + late)
    }
    break
  }

  case 'add': {
    const { flags, rest } = parseFlags(args)
    const title = rest.join(' ').trim()
    if (!title) fail('Informe o título: add "minha tarefa"')
    const row = {
      title,
      category: flags.cat ?? 'outro',
      priority: flags.prio ?? 'media',
      due_date: flags.due ?? null,
      estimated_pomodoros: Number(flags.pomos ?? 1),
      completed_pomodoros: 0,
      done: false,
      created_at: new Date().toISOString(),
    }
    const { data, error } = await supabase.from('tasks').insert(row).select('*').single()
    if (error) fail(error.message)
    console.log('Criada: ' + fmt(data))
    break
  }

  case 'done': {
    const id = Number(args[0])
    if (!id) fail('Informe o id: done <id>')
    const { data, error } = await supabase
      .from('tasks')
      .update({ done: true, completed_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) fail(error.message)
    console.log('Concluída: ' + fmt(data))
    break
  }

  case 'del': {
    const id = Number(args[0])
    if (!id) fail('Informe o id: del <id>')
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) fail(error.message)
    console.log(`Apagada: #${id}`)
    break
  }

  default:
    fail('Comandos: list [--all] | today | add "título" [--cat --prio --due --pomos] | done <id> | del <id>')
}
