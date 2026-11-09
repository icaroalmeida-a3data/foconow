-- Migração 004: cada tarefa pontua uma única vez.
-- Como aplicar: SQL Editor > cole este arquivo > Run (rodar duas vezes é seguro).
--
-- Antes, reabrir e concluir de novo a mesma tarefa somava os pontos da prioridade a cada vez.
-- Agora a tarefa guarda se já pontuou (points_awarded); reabrir não devolve nem repete os pontos.
-- add_points também passa a recusar valores fora de 0..200 (o maior ganho legítimo é um bloco
-- de foco de 180 min = 108 pontos).

alter table public.tasks add column if not exists points_awarded boolean not null default false;

-- Tarefas já concluídas já receberam seus pontos
update public.tasks set points_awarded = true where done and not points_awarded;

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
  if p_amount is null or p_amount < 0 or p_amount > 200 then
    raise exception 'Quantidade de pontos inválida: %', p_amount;
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

create or replace function public.complete_task(p_task_id bigint, p_today date)
returns public.tasks
language plpgsql
security invoker
set search_path = ''
as $$
declare
  t public.tasks;
  first_time boolean;
begin
  -- trava a linha: duas conclusões simultâneas (app + Claude) não pontuam em dobro
  select * into t from public.tasks where id = p_task_id for update;
  if not found then
    raise exception 'Tarefa % não encontrada', p_task_id;
  end if;
  if t.done then
    return t;
  end if;

  first_time := not t.points_awarded;
  update public.tasks set done = true, completed_at = now(), points_awarded = true
   where id = p_task_id
  returning * into t;

  if first_time then
    perform public.add_points(
      case t.priority when 'alta' then 25 when 'media' then 15 else 10 end,
      p_today
    );
  end if;
  return t;
end;
$$;

grant execute on function public.add_points(int, date) to authenticated;
grant execute on function public.complete_task(bigint, date) to authenticated;
revoke execute on function public.add_points(int, date) from anon, public;
revoke execute on function public.complete_task(bigint, date) from anon, public;
