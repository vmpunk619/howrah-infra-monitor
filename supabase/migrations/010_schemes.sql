-- ============================================================
-- Migration 010: Government schemes (admin-managed, public-readable)
--
-- The Services page ships with a built-in static list of schemes in
-- code. This table holds ADDITIONAL schemes that an admin creates from
-- the dashboard — they are merged with the static list on the public
-- Services page. Shape mirrors the `Scheme` interface in src/lib/schemes.ts.
-- ============================================================

create table if not exists schemes (
  id             text primary key default gen_random_uuid()::text,
  name           text not null,
  short          text,
  category       text not null default 'state'
                   check (category in ('central','state','land')),
  icon           text not null default '📋',     -- emoji
  accent         text not null default 'amber',  -- tailwind colour name
  objective      text not null default '',
  benefits       text[] not null default '{}',
  eligibility    text[] not null default '{}',
  documents      text[] not null default '{}',
  where_to_apply text[] not null default '{}',
  websites       jsonb  not null default '[]',   -- [{ "label": "...", "url": "..." }]
  created_at     timestamptz not null default now()
);

create index if not exists idx_schemes_category on schemes (category);

-- RLS: anyone may read (public Services page); only signed-in officers may write
alter table schemes enable row level security;

drop policy if exists "schemes_select_public" on schemes;
create policy "schemes_select_public" on schemes
  for select using (true);

drop policy if exists "schemes_write_authenticated" on schemes;
create policy "schemes_write_authenticated" on schemes
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- done
