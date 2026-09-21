-- DTNH — schéma Supabase / PostgreSQL
-- À exécuter dans Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.committees (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('administratif', 'parents', 'joueurs', 'technique')),
  label text not null unique
);

insert into public.committees (code, label) values
  ('administratif', 'Comité administratif'),
  ('parents', 'Comité des parents'),
  ('joueurs', 'Comité des joueurs'),
  ('technique', 'Comité technique / coachs')
on conflict (code) do update set label = excluded.label;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(trim(first_name)) >= 2),
  last_name text not null check (char_length(trim(last_name)) >= 2),
  phone text not null check (char_length(trim(phone)) >= 6),
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.member_committees (
  member_id uuid not null references public.members(id) on delete cascade,
  committee_id uuid not null references public.committees(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (member_id, committee_id)
);

-- Les deux côtés de la relation sont toujours de vrais membres.
-- Un membre peut être parent de plusieurs joueurs et un joueur peut avoir plusieurs parents.
create table if not exists public.parent_player_links (
  parent_member_id uuid not null references public.members(id) on delete cascade,
  player_member_id uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (parent_member_id, player_member_id),
  constraint parent_cannot_be_own_player check (parent_member_id <> player_member_id)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_date date not null,
  location text,
  status text not null default 'planned' check (status in ('planned', 'open', 'closed')),
  created_at timestamptz not null default now()
);

insert into public.events (name, event_date, status)
values ('Assemblée Générale 2026', '2026-09-26', 'open')
on conflict do nothing;

create table if not exists public.attendances (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  unique (event_id, member_id)
);

create index if not exists idx_members_phone on public.members(phone);
create index if not exists idx_member_committees_committee on public.member_committees(committee_id);
create index if not exists idx_attendances_event_time on public.attendances(event_id, checked_in_at desc);
create index if not exists idx_parent_player_parent on public.parent_player_links(parent_member_id);
create index if not exists idx_parent_player_player on public.parent_player_links(player_member_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists members_set_updated_at on public.members;
create trigger members_set_updated_at
before update on public.members
for each row execute procedure public.set_updated_at();

-- Le service role est utilisé uniquement par les routes serveur Next.js.
-- RLS est activé sans policy publique afin de ne pas exposer les données personnelles.
alter table public.committees enable row level security;
alter table public.members enable row level security;
alter table public.member_committees enable row level security;
alter table public.parent_player_links enable row level security;
alter table public.events enable row level security;
alter table public.attendances enable row level security;

-- Règle métier :
-- - un membre appartenant au comité parents doit avoir au moins un lien parent -> joueur ;
-- - un membre appartenant au comité joueurs doit avoir au moins un lien joueur <- parent.
-- Ces règles sont contrôlées par la route d'inscription, qui crée les deux membres et le lien
-- dans le même parcours. Pour un usage multi-administrateurs avancé, déplacer l'inscription
-- dans une fonction RPC transactionnelle Supabase.
