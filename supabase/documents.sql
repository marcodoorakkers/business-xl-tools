-- Voer dit uit in de Supabase SQL editor

create table if not exists documents (
  id           uuid        default gen_random_uuid() primary key,
  user_id      uuid        references auth.users(id) on delete cascade not null,
  bestandsnaam text        not null,
  type         text,
  afzender     text,
  datum        date,
  onderwerp    text,
  mappad       text,
  gezinslid    text,
  samenvatting text,
  file_url     text,
  storage      text        default 'local',
  created_at   timestamptz default now() not null
);

alter table documents enable row level security;

create policy "Users can manage their own documents"
  on documents for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index documents_user_created on documents (user_id, created_at desc);
