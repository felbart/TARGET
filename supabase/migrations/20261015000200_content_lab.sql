-- Replacement baseline: previous 22-table drafts were NEVER applied.
-- Review only: no import, seed or remote execution.
begin;

-- Versioned envelope and boolean-or-unknown results. Keys are extensible.
create function public.targetfb_valid_criteria(value jsonb)
returns boolean language plpgsql immutable security invoker set search_path = ''
as $$
declare item jsonb;
begin
  if value is null or jsonb_typeof(value) <> 'object'
     or not (value ?& array['version', 'items'])
     or jsonb_typeof(value->'version') <> 'number'
     or (value->>'version') !~ '^[1-9][0-9]*$'
     or jsonb_typeof(value->'items') <> 'object'
     or value->'items' = '{}'::jsonb then
    return false;
  end if;
  for item in select v from jsonb_each(value->'items') as entries(k,v) loop
    if jsonb_typeof(item) <> 'object' or not (item ? 'passed')
       or jsonb_typeof(item->'passed') not in ('boolean', 'null')
       or (item ? 'rationale' and jsonb_typeof(item->'rationale') <> 'string') then
      return false;
    end if;
  end loop;
  return true;
end;
$$;
revoke all on function public.targetfb_valid_criteria(jsonb) from public, anon, authenticated;
grant execute on function public.targetfb_valid_criteria(jsonb) to authenticated;

create table public.content_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, legacy_id),
  strategy_id uuid,
  foreign key (strategy_id, user_id) references public.strategy(id, user_id) on delete no action,
  suggested_formula_id uuid,
  foreign key (suggested_formula_id, user_id) references public.formulas(id, user_id) on delete no action,
  topic text not null,
  objective text not null check (objective in ('discovery', 'authority', 'conversion')),
  editorial_approach text,
  hypothesis text,
  gate_decider boolean,
  gate_authority boolean,
  gate_pass boolean,
  assessed_at timestamptz,
  notes text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0)
);

alter table public.content_topics enable row level security;
alter table public.content_topics force row level security;
revoke all on table public.content_topics from public, anon, authenticated;
grant select, insert, update, delete on table public.content_topics to authenticated;

create policy own_select on public.content_topics
  for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.content_topics
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.content_topics
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy own_delete on public.content_topics
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger set_updated_at before update on public.content_topics
  for each row execute function public.targetfb_set_updated_at();

create index content_topics_strategy_id_owner_idx on public.content_topics (user_id, strategy_id);
create index content_topics_suggested_formula_id_owner_idx on public.content_topics (user_id, suggested_formula_id);

create table public.sprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, legacy_id),
  start_date date not null,
  goal integer not null check (goal > 0),
  offer_id uuid,
  foreign key (offer_id, user_id) references public.offers(id, user_id) on delete no action
);

alter table public.sprints enable row level security;
alter table public.sprints force row level security;
revoke all on table public.sprints from public, anon, authenticated;
grant select, insert, update, delete on table public.sprints to authenticated;

create policy own_select on public.sprints
  for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.sprints
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.sprints
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy own_delete on public.sprints
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger set_updated_at before update on public.sprints
  for each row execute function public.targetfb_set_updated_at();

create index sprints_offer_id_owner_idx on public.sprints (user_id, offer_id);

create table public.publications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, legacy_id),
  sprint_id uuid,
  foreign key (sprint_id, user_id) references public.sprints(id, user_id) on delete no action,
  formula_id uuid,
  foreign key (formula_id, user_id) references public.formulas(id, user_id) on delete no action,
  topic_id uuid,
  foreign key (topic_id, user_id) references public.content_topics(id, user_id) on delete no action,
  published_on date not null,
  title text not null,
  channel text not null check (length(btrim(channel)) > 0),
  link text not null default '',
  leads integer check (leads >= 0),
  execution_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(execution_snapshot) = 'object'),
  sort_order integer not null default 0 check (sort_order >= 0)
);

alter table public.publications enable row level security;
alter table public.publications force row level security;
revoke all on table public.publications from public, anon, authenticated;
grant select, insert, update, delete on table public.publications to authenticated;

create policy own_select on public.publications
  for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.publications
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.publications
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy own_delete on public.publications
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger set_updated_at before update on public.publications
  for each row execute function public.targetfb_set_updated_at();

create index publications_sprint_id_owner_idx on public.publications (user_id, sprint_id);
create index publications_formula_id_owner_idx on public.publications (user_id, formula_id);
create index publications_topic_id_owner_idx on public.publications (user_id, topic_id);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, legacy_id),
  publication_id uuid not null,
  foreign key (publication_id, user_id) references public.publications(id, user_id) on delete no action,
  criterion_key text,
  observation text not null default '',
  metrics jsonb not null default '{}'::jsonb check (jsonb_typeof(metrics) = 'object'),
  source_url text,
  observed_at timestamptz,
  check (length(btrim(observation)) > 0 or metrics <> '{}'::jsonb)
);

alter table public.evidence enable row level security;
alter table public.evidence force row level security;
revoke all on table public.evidence from public, anon, authenticated;
grant select, insert, update, delete on table public.evidence to authenticated;

create policy own_select on public.evidence
  for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.evidence
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.evidence
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy own_delete on public.evidence
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger set_updated_at before update on public.evidence
  for each row execute function public.targetfb_set_updated_at();


create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, legacy_id),
  publication_id uuid,
  foreign key (publication_id, user_id) references public.publications(id, user_id) on delete no action,
  formula_id uuid,
  foreign key (formula_id, user_id) references public.formulas(id, user_id) on delete no action,
  criteria jsonb not null check (public.targetfb_valid_criteria(criteria)),
  decision text check (decision in ('repeat', 'adjust', 'stop')),
  rationale text not null default '',
  learning text not null default '',
  next_adjustment text not null default '',
  evaluated_at timestamptz default now(),
  origin text not null default 'manual' check (origin in ('manual', 'legacy_import')),
  legacy_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(legacy_payload) = 'object'),
  formula_status_before text check (formula_status_before in ('testing', 'validated', 'discarded')),
  formula_status_after text check (formula_status_after in ('testing', 'validated', 'discarded')),
  constraint evaluations_exactly_one_target check (num_nonnulls(publication_id, formula_id) = 1),
  constraint evaluations_manual_date check (origin = 'legacy_import' or evaluated_at is not null),
  constraint evaluations_status_snapshot check (
    (formula_status_before is null and formula_status_after is null) or
    (formula_id is not null and formula_status_before is not null and formula_status_after is not null)
  )
);

alter table public.evaluations enable row level security;
alter table public.evaluations force row level security;
revoke all on table public.evaluations from public, anon, authenticated;
grant select, insert, update, delete on table public.evaluations to authenticated;

create policy own_select on public.evaluations
  for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.evaluations
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.evaluations
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy own_delete on public.evaluations
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger set_updated_at before update on public.evaluations
  for each row execute function public.targetfb_set_updated_at();


create table public.migration_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, legacy_id),
  dataset_id uuid not null,
  snapshot_sha256 text not null check (snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  state text not null default 'planned' check (state in ('planned', 'in_progress', 'verified', 'failed')),
  source_namespace text not null default 'ms-hq:',
  source_snapshot jsonb not null check (jsonb_typeof(source_snapshot) = 'object'),
  manifest jsonb not null default '{}'::jsonb check (jsonb_typeof(manifest) = 'object'),
  verified_at timestamptz,
  unique (user_id, dataset_id, snapshot_sha256),
  check (state <> 'verified' or verified_at is not null)
);

alter table public.migration_imports enable row level security;
alter table public.migration_imports force row level security;
revoke all on table public.migration_imports from public, anon, authenticated;
grant select, insert, update, delete on table public.migration_imports to authenticated;

create policy own_select on public.migration_imports
  for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.migration_imports
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.migration_imports
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy own_delete on public.migration_imports
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger set_updated_at before update on public.migration_imports
  for each row execute function public.targetfb_set_updated_at();


create index publications_channel_date_idx on public.publications(user_id, channel, published_on desc);
create index evidence_publication_observed_idx on public.evidence(user_id, publication_id, observed_at desc);
create index evaluations_formula_date_idx on public.evaluations(user_id, formula_id, evaluated_at desc, created_at desc) where formula_id is not null;
create index evaluations_publication_date_idx on public.evaluations(user_id, publication_id, evaluated_at desc, created_at desc) where publication_id is not null;
comment on column public.content_topics.editorial_approach is 'Educational is an approach, never a fourth objective.';
comment on column public.content_topics.suggested_formula_id is 'Suggestion only; publications.formula_id records actual execution and may differ.';
comment on column public.publications.channel is 'Required for new records. Use explicit unknown only for legacy publications without a known channel.';
comment on column public.publications.leads is 'NULL means not measured; preserve explicit legacy zero.';
comment on column public.evidence.metrics is 'Manual channel-specific observations; absent keys are unknown, not zero. No social integration.';
comment on column public.evaluations.evaluated_at is 'NULL allowed only for legacy imports with unknown original date; created_at is ingestion time.';

-- One RPC call = one database transaction. No SECURITY DEFINER or owner parameter.
-- Row locking serializes evaluations which change the same formula's current state.
create function public.record_evaluation(
  p_criteria jsonb,
  p_publication_id uuid default null,
  p_formula_id uuid default null,
  p_decision text default null,
  p_rationale text default '',
  p_learning text default '',
  p_next_adjustment text default '',
  p_evaluated_at timestamptz default now(),
  p_new_formula_status text default null
)
returns public.evaluations
language plpgsql security invoker set search_path = ''
as $$
declare
  current_status text;
  saved public.evaluations;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if num_nonnulls(p_publication_id, p_formula_id) <> 1 then
    raise exception 'Exactly one evaluation target is required' using errcode = '23514';
  end if;
  if p_publication_id is not null and p_new_formula_status is not null then
    raise exception 'Publication evaluations cannot change formula status' using errcode = '23514';
  end if;

  if p_formula_id is not null then
    select f.status into current_status from public.formulas f
      where f.id = p_formula_id and f.user_id = auth.uid() for update;
    if not found then
      raise exception 'Evaluation target unavailable' using errcode = '42501';
    end if;
  else
    perform 1 from public.publications p
      where p.id = p_publication_id and p.user_id = auth.uid() for key share;
    if not found then
      raise exception 'Evaluation target unavailable' using errcode = '42501';
    end if;
  end if;

  insert into public.evaluations (
    publication_id, formula_id, criteria, decision, rationale, learning,
    next_adjustment, evaluated_at, formula_status_before, formula_status_after
  ) values (
    p_publication_id, p_formula_id, p_criteria, p_decision, p_rationale, p_learning,
    p_next_adjustment, p_evaluated_at,
    case when p_new_formula_status is not null then current_status end,
    p_new_formula_status
  ) returning * into saved;

  if p_new_formula_status is not null then
    update public.formulas set status = p_new_formula_status
      where id = p_formula_id and user_id = auth.uid();
    if not found then
      raise exception 'Formula status update unavailable' using errcode = '42501';
    end if;
  end if;
  return saved;
end;
$$;

revoke all on function public.record_evaluation(jsonb, uuid, uuid, text, text, text, text, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.record_evaluation(jsonb, uuid, uuid, text, text, text, text, timestamptz, text)
  to authenticated;

commit;
