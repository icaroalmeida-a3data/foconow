-- Migração 003: Kanban.
-- Como aplicar: SQL Editor > cole este arquivo > Run (rodar duas vezes é seguro).
--
-- Cada tarefa aberta passa a ter uma etapa do quadro: 'a_fazer' ou 'fazendo'.
-- A coluna "Concluído" continua sendo o campo done (fonte única da conclusão e dos pontos),
-- então complete_task e o histórico não mudam. Ao reabrir, a tarefa volta para a etapa em que estava.

alter table public.tasks add column if not exists stage text not null default 'a_fazer';

alter table public.tasks drop constraint if exists tasks_stage_check;
alter table public.tasks add constraint tasks_stage_check check (stage in ('a_fazer', 'fazendo'));
