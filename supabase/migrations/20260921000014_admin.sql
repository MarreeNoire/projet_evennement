-- =============================================================================
--  0014 — Administration : audit, paramètres plateforme et versements
-- =============================================================================

-- -----------------------------------------------------------------------------
-- audit_logs : traçabilité des actions sensibles
--  (règles métier n°12 « opérations financières journalisées »
--   et n°13 « actions de check-in enregistrées »)
-- -----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id            bigint generated always as identity primary key,
  actor_id      uuid references public.profiles (id) on delete set null,
  actor_role    public.user_role,
  action        text not null,
  entity_type   text not null,
  entity_id     uuid,
  organization_id uuid references public.organizations (id) on delete set null,
  event_id      uuid references public.events (id) on delete set null,
  before        jsonb,
  after         jsonb,
  ip_address    inet,
  user_agent    text,
  created_at    timestamptz not null default now(),

  constraint audit_logs_action_length check (char_length(action) between 2 and 80)
);

comment on table public.audit_logs is
  'Journal d''audit des actions sensibles : paiements, modération, administration, check-in.';
comment on column public.audit_logs.before is 'État de l''entité avant modification (diff).';
comment on column public.audit_logs.after is 'État de l''entité après modification (diff).';

create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index if not exists audit_logs_org_idx on public.audit_logs (organization_id, created_at desc);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

-- -----------------------------------------------------------------------------
-- platform_settings : paramètres globaux (clé/valeur typée)
-- -----------------------------------------------------------------------------
create table if not exists public.platform_settings (
  key           citext primary key,
  value         jsonb not null,
  description   text,
  is_public     boolean not null default false,
  updated_by    uuid references public.profiles (id) on delete set null,
  updated_at    timestamptz not null default now(),

  constraint platform_settings_key_format check (key ~ '^[a-z0-9_.]{3,60}$')
);

comment on table public.platform_settings is
  'Paramètres de la plateforme : commission, catégories mises en avant, maintenance…';

insert into public.platform_settings (key, value, description, is_public)
values
  ('platform.commission_rate', '0.05'::jsonb, 'Commission prélevée sur chaque commande.', false),
  ('platform.currency', '"XOF"'::jsonb, 'Devise de la plateforme.', true),
  ('platform.maintenance_mode', 'false'::jsonb, 'Active un bandeau de maintenance.', true),
  ('platform.max_tickets_per_order', '10'::jsonb, 'Nombre maximum de billets par commande.', true),
  ('platform.support_email', '"support@rassemble.ci"'::jsonb, 'Email de contact du support.', true)
on conflict (key) do nothing;

drop trigger if exists platform_settings_set_updated_at on public.platform_settings;
create trigger platform_settings_set_updated_at
  before update on public.platform_settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- payouts : versements aux organisateurs (suivi des revenus)
-- -----------------------------------------------------------------------------
create table if not exists public.payouts (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  event_id         uuid references public.events (id) on delete set null,
  gross_amount     integer not null,
  commission_amount integer not null,
  net_amount       integer not null,
  currency         text not null default 'XOF',
  status           text not null default 'pending',
  method           text,
  reference        text,
  period_start     timestamptz,
  period_end       timestamptz,
  processed_by     uuid references public.profiles (id) on delete set null,
  processed_at     timestamptz,
  note             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint payouts_status check (
    status in ('pending', 'processing', 'paid', 'failed', 'cancelled')
  ),
  constraint payouts_amounts check (
    gross_amount >= 0 and commission_amount >= 0 and net_amount = gross_amount - commission_amount
  )
);

comment on table public.payouts is 'Versement des revenus nets à un organisateur.';

create index if not exists payouts_org_idx on public.payouts (organization_id, created_at desc);
create index if not exists payouts_status_idx on public.payouts (status, created_at desc);

drop trigger if exists payouts_set_updated_at on public.payouts;
create trigger payouts_set_updated_at
  before update on public.payouts
  for each row execute function public.set_updated_at();