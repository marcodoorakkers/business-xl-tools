-- Profiles tabel (credit saldo per gebruiker)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  credits integer not null default 10,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Usage logs (bijhouden welke tools zijn gebruikt)
create table if not exists usage_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  tool text not null,
  credits_used integer not null default 1,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Row Level Security aanzetten
alter table profiles enable row level security;
alter table usage_logs enable row level security;

-- Policies: gebruiker mag alleen eigen data zien
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can view own logs" on usage_logs for select using (auth.uid() = user_id);

-- Automatisch profiel aanmaken bij registratie (met 10 gratis credits)
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, credits)
  values (new.id, 10);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Functie om credits te verlagen
create or replace function decrement_credits(user_id uuid)
returns integer as $$
declare
  new_credits integer;
begin
  update profiles set credits = credits - 1
  where id = user_id and credits > 0
  returning credits into new_credits;
  return new_credits;
end;
$$ language plpgsql security definer;
