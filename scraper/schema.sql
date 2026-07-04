-- ============================================================
-- SurebetFlow — schema do motor de scraping/matching de odds
-- Roda isso no SQL Editor do Supabase (ou via migration/MCP)
-- ============================================================

create table if not exists bookmakers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,          -- "betano", "estrelabet"
  name text not null,                 -- "Betano (BR)"
  base_url text,
  is_licensed_br boolean default true,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  sport text not null,
  home_team text not null,
  away_team text not null,
  league text,
  starts_at timestamptz not null,
  created_at timestamptz default now(),
  unique (home_team, away_team, starts_at)
);

create table if not exists event_bookmaker_odds (
  id bigint generated always as identity primary key,
  event_id uuid references events(id) on delete cascade,
  bookmaker_id uuid references bookmakers(id) on delete cascade,
  market_key text not null,           -- "1x2", "over_under_gols", "escanteios"
  selection text not null,            -- "home", "away", "draw", "over", "under"
  odds numeric(10, 3) not null,
  line numeric(6, 2),                 -- 2.5, 9.5, etc — null se não aplicável
  scraped_at timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists idx_odds_event_market
  on event_bookmaker_odds (event_id, market_key, scraped_at desc);

create index if not exists idx_odds_recent
  on event_bookmaker_odds (scraped_at desc);

create table if not exists surebets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  market_key text not null,
  leg_a jsonb not null,   -- {bookmaker_slug, selection, odds, line}
  leg_b jsonb not null,
  profit_pct numeric(6, 3) not null,
  detected_at timestamptz default now(),
  expires_at timestamptz  -- estimativa de quando a odd deve ter mudado
);

create index if not exists idx_surebets_active
  on surebets (detected_at desc) where expires_at is null or expires_at > now();

-- Seed inicial das duas casas que estamos scrapeando primeiro.
-- Rode isso uma vez.
insert into bookmakers (slug, name, base_url, is_licensed_br)
values
  ('betano', 'Betano (BR)', 'https://www.betano.bet.br', true),
  ('estrelabet', 'EstrelaBet', 'https://estrelabet.bet.br', true)
on conflict (slug) do nothing;
