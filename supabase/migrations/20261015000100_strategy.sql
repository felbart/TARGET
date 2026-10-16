-- Replacement baseline: previous 22-table drafts were NEVER applied.
-- Review only: no import, seed or remote execution.
begin;

create function public.targetfb_set_updated_at()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.targetfb_set_updated_at() from public, anon, authenticated;

create table public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, legacy_id),
  active_tab text not null default 'positioning',
  preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(preferences) = 'object'),
  formula_options jsonb not null default '{"topics":[],"formats":[],"layouts":[]}'::jsonb check (jsonb_typeof(formula_options) = 'object'),
  unique (user_id)
);

alter table public.user_settings enable row level security;
alter table public.user_settings force row level security;
revoke all on table public.user_settings from public, anon, authenticated;
grant select, insert, update, delete on table public.user_settings to authenticated;

create policy own_select on public.user_settings
  for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.user_settings
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.user_settings
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy own_delete on public.user_settings
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger set_updated_at before update on public.user_settings
  for each row execute function public.targetfb_set_updated_at();


create table public.strategy (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, legacy_id),
  mode text not null default 'targeted' check (mode in ('mass', 'targeted')),
  avatar text not null default '',
  problem text not null default '',
  solution text not null default '',
  pillars jsonb not null default '{}'::jsonb check (jsonb_typeof(pillars) = 'object'),
  gate_draft jsonb not null default '{}'::jsonb check (jsonb_typeof(gate_draft) = 'object'),
  unique (user_id)
);

alter table public.strategy enable row level security;
alter table public.strategy force row level security;
revoke all on table public.strategy from public, anon, authenticated;
grant select, insert, update, delete on table public.strategy to authenticated;

create policy own_select on public.strategy
  for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.strategy
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.strategy
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy own_delete on public.strategy
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger set_updated_at before update on public.strategy
  for each row execute function public.targetfb_set_updated_at();


create table public.offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, legacy_id),
  name text not null default '',
  promise text not null default '',
  pricing_model text not null default 'fixed' check (pricing_model in ('fixed', 'weekly')),
  price numeric not null default 0 check (price >= 0),
  weekly_price numeric not null default 0 check (weekly_price >= 0),
  sprint_weeks integer not null default 3 check (sprint_weeks > 0),
  currency text not null default 'BRL' check (currency in ('BRL', 'USD', 'EUR')),
  cta_keyword text not null default '',
  deliverables jsonb not null default '[]'::jsonb check (jsonb_typeof(deliverables) = 'array'),
  ctas jsonb not null default '[]'::jsonb check (jsonb_typeof(ctas) = 'array'),
  funnel_assumptions jsonb not null default '{}'::jsonb check (jsonb_typeof(funnel_assumptions) = 'object'),
  is_core boolean not null default false,
  archived_at timestamptz
);

alter table public.offers enable row level security;
alter table public.offers force row level security;
revoke all on table public.offers from public, anon, authenticated;
grant select, insert, update, delete on table public.offers to authenticated;

create policy own_select on public.offers
  for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.offers
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.offers
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy own_delete on public.offers
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger set_updated_at before update on public.offers
  for each row execute function public.targetfb_set_updated_at();


create table public.formulas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, legacy_id),
  topic text not null,
  format text not null,
  layout text not null,
  notes text not null default '',
  status text not null default 'testing' check (status in ('testing', 'validated', 'discarded')),
  archived_at timestamptz,
  sort_order integer not null default 0 check (sort_order >= 0)
);

alter table public.formulas enable row level security;
alter table public.formulas force row level security;
revoke all on table public.formulas from public, anon, authenticated;
grant select, insert, update, delete on table public.formulas to authenticated;

create policy own_select on public.formulas
  for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.formulas
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.formulas
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy own_delete on public.formulas
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger set_updated_at before update on public.formulas
  for each row execute function public.targetfb_set_updated_at();


create unique index offers_one_core_per_user on public.offers(user_id)
  where is_core and archived_at is null;
comment on column public.strategy.pillars is 'Small collections: bullseye, beliefs, keywords, setup, matrix. Keep legacy item IDs and array order.';
comment on column public.formulas.status is 'Only authoritative current validation state. Evaluation status fields are historical snapshots only.';
comment on column public.offers.funnel_assumptions is 'Manual projections, never observed metrics.';

commit;
