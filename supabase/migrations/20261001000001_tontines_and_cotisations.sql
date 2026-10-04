-- Tontines à rotation mensuelle et campagnes de cotisation.

alter type public.notification_type add value if not exists 'tontine_invitation';

create table public.tontines (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 3 and 120),
  contribution_amount bigint not null check (contribution_amount > 0),
  frequency text not null default 'monthly' check (frequency = 'monthly'),
  starts_on date not null,
  currency text not null default 'XOF' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tontine_members (
  id uuid primary key default gen_random_uuid(),
  tontine_id uuid not null references public.tontines(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  role text not null default 'member' check (role in ('owner', 'member')),
  status text not null default 'invited' check (status in ('invited', 'active', 'declined')),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tontine_id, user_id)
);

create table public.tontine_cycles (
  id uuid primary key default gen_random_uuid(),
  tontine_id uuid not null references public.tontines(id) on delete cascade,
  cycle_number integer not null check (cycle_number > 0),
  due_on date not null,
  beneficiary_user_id uuid references public.profiles(id) on delete set null,
  drawn_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'drawn')),
  created_at timestamptz not null default now(),
  unique (tontine_id, cycle_number),
  check ((status = 'pending' and beneficiary_user_id is null and drawn_at is null)
      or (status = 'drawn' and beneficiary_user_id is not null and drawn_at is not null))
);

create unique index tontine_beneficiary_once_per_rotation
  on public.tontine_cycles(tontine_id, beneficiary_user_id)
  where beneficiary_user_id is not null;

create table public.tontine_payments (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.tontine_cycles(id) on delete cascade,
  tontine_id uuid not null references public.tontines(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount bigint not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'paid')),
  paid_at timestamptz,
  marked_paid_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (cycle_id, user_id),
  check ((status = 'pending' and paid_at is null) or (status = 'paid' and paid_at is not null))
);

create table public.cotisation_campaigns (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 3 and 120),
  description text not null check (char_length(trim(description)) between 10 and 5000),
  target_amount bigint check (target_amount is null or target_amount > 0),
  fixed_amount bigint check (fixed_amount is null or fixed_amount > 0),
  ends_at timestamptz,
  currency text not null default 'XOF' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'open' check (status in ('open', 'closed', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cotisation_contributions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.cotisation_campaigns(id) on delete restrict,
  contributor_id uuid not null references public.profiles(id) on delete restrict,
  amount bigint not null check (amount > 0),
  currency text not null default 'XOF' check (currency ~ '^[A-Z]{3}$'),
  is_anonymous boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled')),
  provider text,
  provider_transaction_id text unique,
  provider_payment_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status = 'paid' and paid_at is not null) or status <> 'paid')
);

create index tontines_creator_idx on public.tontines(creator_id, created_at desc);
create index tontine_members_user_idx on public.tontine_members(user_id, status);
create index tontine_cycles_history_idx on public.tontine_cycles(tontine_id, cycle_number desc);
create index tontine_payments_period_idx on public.tontine_payments(tontine_id, cycle_id, status);
create index cotisation_campaigns_open_idx on public.cotisation_campaigns(status, ends_at, created_at desc);
create index cotisation_contributions_campaign_idx on public.cotisation_contributions(campaign_id, status, created_at desc);
create index cotisation_contributions_owner_idx on public.cotisation_contributions(contributor_id, created_at desc);

grant select, insert, update, delete on public.tontines, public.tontine_members to authenticated;
grant select on public.tontine_cycles, public.tontine_payments to authenticated;
grant select on public.cotisation_campaigns, public.cotisation_contributions to anon, authenticated;
grant insert, update, delete on public.cotisation_campaigns to authenticated;
grant all on public.tontines, public.tontine_members, public.tontine_cycles, public.tontine_payments,
  public.cotisation_campaigns, public.cotisation_contributions to service_role;

create or replace function public.is_tontine_participant(target_tontine_id uuid, target_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tontines t where t.id = target_tontine_id and t.creator_id = target_user_id
  ) or exists (
    select 1 from public.tontine_members m
    where m.tontine_id = target_tontine_id and m.user_id = target_user_id
      and m.status in ('invited', 'active')
  );
$$;

alter table public.tontines enable row level security;
alter table public.tontine_members enable row level security;
alter table public.tontine_cycles enable row level security;
alter table public.tontine_payments enable row level security;
alter table public.cotisation_campaigns enable row level security;
alter table public.cotisation_contributions enable row level security;

create policy tontines_read_participants on public.tontines for select to authenticated
  using (public.is_tontine_participant(id));
create policy tontines_create_self on public.tontines for insert to authenticated
  with check (creator_id = auth.uid());
create policy tontines_update_owner on public.tontines for update to authenticated
  using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy tontines_delete_owner on public.tontines for delete to authenticated
  using (creator_id = auth.uid());

create policy tontine_members_read_group on public.tontine_members for select to authenticated
  using (public.is_tontine_participant(tontine_id));
create policy tontine_members_invite on public.tontine_members for insert to authenticated
  with check (
    invited_by = auth.uid()
    and exists (select 1 from public.tontines t where t.id = tontine_id and t.creator_id = auth.uid())
  );
create policy tontine_members_respond on public.tontine_members for update to authenticated
  using (user_id = auth.uid() and status = 'invited')
  with check (user_id = auth.uid() and status in ('active', 'declined'));
create policy tontine_members_remove on public.tontine_members for delete to authenticated
  using (
    user_id = auth.uid() and status = 'invited'
    or exists (select 1 from public.tontines t where t.id = tontine_id and t.creator_id = auth.uid())
  );

create policy tontine_cycles_read_group on public.tontine_cycles for select to authenticated
  using (public.is_tontine_participant(tontine_id));
create policy tontine_payments_read_group on public.tontine_payments for select to authenticated
  using (public.is_tontine_participant(tontine_id));

create policy cotisation_campaigns_public_read on public.cotisation_campaigns for select to anon, authenticated
  using (
    (status = 'open' and (ends_at is null or ends_at >= now()))
    or creator_id = auth.uid()
  );
create policy cotisation_campaigns_create_self on public.cotisation_campaigns for insert to authenticated
  with check (creator_id = auth.uid());
create policy cotisation_campaigns_update_owner on public.cotisation_campaigns for update to authenticated
  using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy cotisation_campaigns_delete_owner on public.cotisation_campaigns for delete to authenticated
  using (creator_id = auth.uid());

-- Les écritures de contributions et paiements passent exclusivement par les routes serveur.
create policy cotisation_contributions_read_paid on public.cotisation_contributions for select to anon, authenticated
  using (
    status = 'paid' and is_anonymous = false
    or contributor_id = auth.uid()
    or exists (
      select 1 from public.cotisation_campaigns c
      where c.id = campaign_id and c.creator_id = auth.uid()
    )
  );

create or replace function public.tontine_ensure_current_period(p_tontine_id uuid, p_requested_by uuid)
returns public.tontine_cycles language plpgsql security definer set search_path = public as $$
declare
  v_tontine public.tontines;
  v_cycle public.tontine_cycles;
  v_months integer;
  v_due_on date;
begin
  select * into v_tontine from public.tontines where id = p_tontine_id for update;
  if not found or not public.is_tontine_participant(p_tontine_id, p_requested_by) then
    raise exception 'Tontine introuvable ou accès refusé.' using errcode = '42501';
  end if;
  if current_date < v_tontine.starts_on then
    raise exception 'La tontine n’a pas encore commencé.' using errcode = '22023';
  end if;

  v_months := greatest(0,
    (extract(year from current_date)::integer - extract(year from v_tontine.starts_on)::integer) * 12
    + extract(month from current_date)::integer - extract(month from v_tontine.starts_on)::integer
  );
  v_due_on := (v_tontine.starts_on + make_interval(months => v_months))::date;
  if v_due_on > current_date and v_months > 0 then
    v_months := v_months - 1;
    v_due_on := (v_tontine.starts_on + make_interval(months => v_months))::date;
  end if;

  insert into public.tontine_cycles(tontine_id, cycle_number, due_on)
  values (p_tontine_id, v_months + 1, v_due_on)
  on conflict (tontine_id, cycle_number) do update set due_on = excluded.due_on
  returning * into v_cycle;

  insert into public.tontine_payments(cycle_id, tontine_id, user_id, amount)
  select v_cycle.id, p_tontine_id, m.user_id, v_tontine.contribution_amount
  from public.tontine_members m
  where m.tontine_id = p_tontine_id and m.status = 'active'
  on conflict (cycle_id, user_id) do nothing;

  return v_cycle;
end;
$$;

create or replace function public.draw_tontine_beneficiary(p_tontine_id uuid, p_requested_by uuid)
returns public.tontine_cycles language plpgsql security definer set search_path = public as $$
declare
  v_cycle public.tontine_cycles;
  v_member_count integer;
  v_unpaid_count integer;
  v_winner uuid;
begin
  if not exists (
    select 1 from public.tontines t where t.id = p_tontine_id and t.creator_id = p_requested_by and t.status = 'active'
  ) then
    raise exception 'Seul le créateur peut lancer le tirage d’une tontine active.' using errcode = '42501';
  end if;

  v_cycle := public.tontine_ensure_current_period(p_tontine_id, p_requested_by);
  select * into v_cycle from public.tontine_cycles where id = v_cycle.id for update;
  if v_cycle.status = 'drawn' then return v_cycle; end if;
  if current_date < v_cycle.due_on then
    raise exception 'Le prochain tirage est prévu le %.', v_cycle.due_on using errcode = '22023';
  end if;

  select count(*) into v_member_count from public.tontine_members
    where tontine_id = p_tontine_id and status = 'active';
  select count(*) into v_unpaid_count
  from public.tontine_payments p
  join public.tontine_members m on m.tontine_id = p.tontine_id and m.user_id = p.user_id
  where p.cycle_id = v_cycle.id and p.status <> 'paid' and m.status = 'active';
  if v_member_count < 2 then
    raise exception 'Il faut au moins deux membres actifs pour effectuer un tirage.' using errcode = '22023';
  end if;
  if v_unpaid_count > 0 then
    raise exception 'Toutes les cotisations de cette échéance doivent être confirmées avant le tirage.' using errcode = '22023';
  end if;

  select m.user_id into v_winner
  from public.tontine_members m
  where m.tontine_id = p_tontine_id and m.status = 'active'
    and not exists (
      select 1 from public.tontine_cycles previous
      where previous.tontine_id = p_tontine_id and previous.beneficiary_user_id = m.user_id
    )
  order by gen_random_uuid()
  limit 1;

  if v_winner is null then
    raise exception 'Tous les membres ont déjà reçu le pot de cette tontine.' using errcode = '22023';
  end if;

  update public.tontine_cycles
  set beneficiary_user_id = v_winner, status = 'drawn', drawn_at = now()
  where id = v_cycle.id
  returning * into v_cycle;

  if not exists (
    select 1 from public.tontine_members m
    where m.tontine_id = p_tontine_id and m.status = 'active'
      and not exists (
        select 1 from public.tontine_cycles c
        where c.tontine_id = p_tontine_id and c.beneficiary_user_id = m.user_id
      )
  ) then
    update public.tontines set status = 'completed', updated_at = now() where id = p_tontine_id;
  end if;
  return v_cycle;
end;
$$;

create or replace function public.tontine_mark_payment_paid(p_payment_id uuid, p_marked_by uuid)
returns public.tontine_payments language plpgsql security definer set search_path = public as $$
declare
  v_payment public.tontine_payments;
begin
  select p.* into v_payment
  from public.tontine_payments p
  join public.tontines t on t.id = p.tontine_id
  where p.id = p_payment_id and t.creator_id = p_marked_by and t.status = 'active'
  for update of p;
  if not found then raise exception 'Cotisation introuvable ou accès refusé.' using errcode = '42501'; end if;
  update public.tontine_payments
    set status = 'paid', paid_at = coalesce(paid_at, now()), marked_paid_by = p_marked_by
    where id = p_payment_id returning * into v_payment;
  return v_payment;
end;
$$;

create or replace function public.tontine_respond_invitation(p_tontine_id uuid, p_user_id uuid, p_accept boolean)
returns public.tontine_members language plpgsql security definer set search_path = public as $$
declare
  v_member public.tontine_members;
begin
  if not exists (
    select 1 from public.tontines t where t.id = p_tontine_id and t.status = 'active'
  ) then
    raise exception 'Cette tontine n’accepte plus de réponses.' using errcode = '22023';
  end if;
  update public.tontine_members
  set status = case when p_accept then 'active' else 'declined' end,
      joined_at = case when p_accept then now() else null end
  where tontine_id = p_tontine_id and user_id = p_user_id and status = 'invited'
  returning * into v_member;
  if not found then raise exception 'Invitation introuvable ou déjà traitée.' using errcode = '22023'; end if;
  return v_member;
end;
$$;

create or replace function public.cotisation_campaign_totals(p_campaign_id uuid)
returns table(total_amount bigint, contributor_count bigint)
language sql stable security definer set search_path = public as $$
  select coalesce(sum(amount), 0)::bigint, count(*)::bigint
  from public.cotisation_contributions
  where campaign_id = p_campaign_id and status = 'paid';
$$;

create or replace function public.cotisation_confirm_contribution(
  p_transaction_id text, p_expected_amount bigint, p_currency text
)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_contribution public.cotisation_contributions;
begin
  select * into v_contribution from public.cotisation_contributions
  where provider_transaction_id = p_transaction_id for update;
  if not found then return false; end if;
  if v_contribution.amount <> p_expected_amount or v_contribution.currency <> upper(p_currency) then
    update public.cotisation_contributions set status = 'failed' where id = v_contribution.id;
    return false;
  end if;
  update public.cotisation_contributions
  set status = 'paid', paid_at = coalesce(paid_at, now())
  where id = v_contribution.id and status = 'pending';
  return true;
end;
$$;

revoke all on function public.tontine_ensure_current_period(uuid, uuid) from public, anon, authenticated;
revoke all on function public.draw_tontine_beneficiary(uuid, uuid) from public, anon, authenticated;
revoke all on function public.tontine_mark_payment_paid(uuid, uuid) from public, anon, authenticated;
revoke all on function public.tontine_respond_invitation(uuid, uuid, boolean) from public, anon, authenticated;
revoke all on function public.cotisation_confirm_contribution(text, bigint, text) from public, anon, authenticated;
grant execute on function public.tontine_ensure_current_period(uuid, uuid) to service_role;
grant execute on function public.draw_tontine_beneficiary(uuid, uuid) to service_role;
grant execute on function public.tontine_mark_payment_paid(uuid, uuid) to service_role;
grant execute on function public.tontine_respond_invitation(uuid, uuid, boolean) to service_role;
grant execute on function public.cotisation_confirm_contribution(text, bigint, text) to service_role;
grant execute on function public.cotisation_campaign_totals(uuid) to anon, authenticated, service_role;
