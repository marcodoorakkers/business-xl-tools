-- Voer dit uit in de Supabase SQL editor

create table if not exists document_actions (
  id           uuid        default gen_random_uuid() primary key,
  user_id      uuid        references auth.users(id) on delete cascade not null,
  actie        text        not null,
  deadline     date,
  actie_type   text,
  status       text        default 'open' not null check (status in ('open', 'gedaan', 'overgeslagen')),
  document_naam text,
  afzender     text,
  mappad       text,
  file_url     text,
  created_at   timestamptz default now() not null
);

alter table document_actions enable row level security;

create policy "Users can manage their own actions"
  on document_actions for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index document_actions_user_status on document_actions (user_id, status);
