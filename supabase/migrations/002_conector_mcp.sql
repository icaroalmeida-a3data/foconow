-- Migração 002: conector MCP (Claude) + sincronização em tempo real.
-- Como aplicar: SQL Editor > cole este arquivo > Run (depois do schema.sql; rodar duas vezes é seguro,
-- exceto a última linha, que dá erro se as tabelas já estiverem na publicação — pode ignorar).
--
-- Pontos e conclusão de tarefa passam a ser feitos no banco, de forma atômica, para que o app
-- e o Claude (via MCP) usem a mesma regra sem um sobrescrever os pontos do outro.

-- Soma pontos e atualiza o streak. p_today é o dia LOCAL do usuário (o app manda o do navegador,
-- o MCP manda o de America/Sao_Paulo).
create or replace function public.add_points(p_amount int, p_today date)
returns public.rewards
language plpgsql
security invoker
set search_path = ''
as $$
declare
  r public.rewards;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  insert into public.rewards (user_id) values (auth.uid()) on conflict (user_id) do nothing;
  select * into r from public.rewards where user_id = auth.uid() for update;

  if r.last_active_date is distinct from p_today::text then
    r.streak_days := case when r.last_active_date = (p_today - 1)::text then r.streak_days + 1 else 1 end;
    r.last_active_date := p_today::text;
  end if;
  r.points := r.points + p_amount;

  update public.rewards
     set points = r.points, streak_days = r.streak_days, last_active_date = r.last_active_date
   where user_id = auth.uid();
  return r;
end;
$$;

-- Conclui a tarefa e dá os pontos da prioridade (mesma tabela de PRIORITY_META em src/types.ts).
-- Idempotente: concluir de novo uma tarefa já concluída não pontua duas vezes.
create or replace function public.complete_task(p_task_id bigint, p_today date)
returns public.tasks
language plpgsql
security invoker
set search_path = ''
as $$
declare
  t public.tasks;
begin
  update public.tasks set done = true, completed_at = now()
   where id = p_task_id and not done
  returning * into t;

  if not found then
    select * into t from public.tasks where id = p_task_id;
    if not found then
      raise exception 'Tarefa % não encontrada', p_task_id;
    end if;
    return t;
  end if;

  perform public.add_points(
    case t.priority when 'alta' then 25 when 'media' then 15 else 10 end,
    p_today
  );
  return t;
end;
$$;

grant execute on function public.add_points(int, date) to authenticated;
grant execute on function public.complete_task(bigint, date) to authenticated;
revoke execute on function public.add_points(int, date) from anon, public;
revoke execute on function public.complete_task(bigint, date) from anon, public;

-- Realtime: o app aberto recebe na hora o que o Claude criar/concluir (RLS continua valendo).
alter publication supabase_realtime add table public.tasks, public.sessions, public.rewards;
