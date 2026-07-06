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

## Migração de dados antigos

Antes do Supabase, o app guardava tudo no IndexedDB do navegador. No primeiro login em cada navegador, se a conta ainda estiver vazia e houver dados locais, eles são importados automaticamente para o Supabase (tarefas, sessões, água, pontos e ajustes).

## Notas

- O service worker só é registrado no build de produção; o prompt de instalação (PWA) também só aparece em produção ou `npm run preview`.
- O app exige login; sem as variáveis de ambiente ele mostra uma tela de configuração pendente.
