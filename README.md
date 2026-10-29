# FocoNow

Pomodoro + tarefas com visual pixel art. PWA instalável, com dados e autenticação no [Supabase](https://supabase.com) e deploy na [Vercel](https://vercel.com).

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4, Zustand
- Supabase (Postgres + Auth, com Row Level Security)
- PWA (manifest + service worker + botão "Instalar app")

## Configurar o Supabase (uma vez)

1. Crie um projeto em [supabase.com/dashboard](https://supabase.com/dashboard).
2. Abra **SQL Editor**, cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**. Isso cria as tabelas (`tasks`, `sessions`, `rewards`, `settings`, `water_entries`) já com RLS — cada usuário só acessa os próprios dados.
3. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.
4. (Opcional) Em **Authentication → Sign In / Up → Email**, desative "Confirm email" se quiser entrar sem confirmar o e-mail. Se deixar ativado, configure também a **Site URL** (Authentication → URL Configuration) com a URL do app na Vercel, para o link de confirmação redirecionar certo.

## Rodar localmente

```bash
cp .env.example .env.local   # e preencha com a URL e a anon key do Supabase
npm install
npm run dev
```

## Deploy na Vercel

1. Suba o repositório para o GitHub (ou use `npx vercel` direto da pasta).
2. Na Vercel, **Add New → Project**, importe o repositório. O framework (Vite) é detectado sozinho — build `npm run build`, output `dist`.
3. Em **Settings → Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. O [`vercel.json`](vercel.json) já cuida do rewrite de SPA e dos headers do service worker.
5. Volte ao Supabase e ajuste a **Site URL** (Authentication → URL Configuration) para a URL da Vercel.

> A anon key é pública por design — a segurança vem das políticas de RLS no banco.

## Conector MCP (usar o FocoNow pelo Claude)

O endpoint [`api/mcp.ts`](api/mcp.ts) é um servidor MCP que deixa o Claude (Cowork, Claude Code, claude.ai) listar, criar, atualizar, concluir, reabrir e excluir tarefas. O login usa o próprio Supabase Auth como servidor OAuth: você entra com a conta do FocoNow e aprova o acesso. O Claude age como você, e o RLS continua valendo.

Ferramentas: `listar_tarefas`, `criar_tarefa`, `atualizar_tarefa`, `concluir_tarefa`, `reabrir_tarefa`, `excluir_tarefa`. Datas de "hoje" usam o fuso `America/Sao_Paulo` (mude com a env var `FOCONOW_TZ`).

Configuração (uma vez):

1. **Banco:** no SQL Editor, rode [`supabase/migrations/002_conector_mcp.sql`](supabase/migrations/002_conector_mcp.sql). Ele cria as funções de pontos `add_points` e `complete_task`, usadas também pelo app, e liga o realtime.
2. **Supabase Auth:**
   - Em **Authentication → OAuth Server**, ative o servidor OAuth 2.1, defina o **Authorization Path** como `/oauth/consent` e ative **Dynamic client registration**, que o Claude usa para se registrar.
   - Em **Authentication → URL Configuration**, a **Site URL** precisa ser a URL do app na Vercel.
   - Recomendado: em **Project Settings → JWT Keys**, migre para chaves assimétricas (RS256/ES256). Assim o MCP valida o token sem chamar o Auth a cada requisição.
3. **Vercel:** faça o deploy. As funções da pasta `api/` usam as mesmas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. A env var `FOCONOW_PUBLIC_URL` é opcional e serve para fixar a URL pública se você usar domínio próprio.
4. **Claude:** em **Settings → Connectors → Add custom connector**, use a URL `https://SEU-APP.vercel.app/api/mcp`. Na primeira vez, o Claude abre a tela de login/consentimento do FocoNow.

O app aberto recebe na hora o que o Claude fizer (Supabase Realtime).

## Migração de dados antigos

Antes do Supabase, o app guardava tudo no IndexedDB do navegador. No primeiro login em cada navegador, se a conta ainda estiver vazia e houver dados locais, eles são importados automaticamente para o Supabase (tarefas, sessões, água, pontos e ajustes).

## Notas

- O service worker só é registrado no build de produção; o prompt de instalação (PWA) também só aparece em produção ou `npm run preview`.
- O app exige login; sem as variáveis de ambiente ele mostra uma tela de configuração pendente.
