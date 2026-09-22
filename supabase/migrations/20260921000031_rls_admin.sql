-- =============================================================================
--  0031 — RLS : modération, audit, paramètres et versements
-- =============================================================================

-- -----------------------------------------------------------------------------
-- reports
-- -----------------------------------------------------------------------------
alter table public.reports enable row level security;

drop policy if exists reports_select on public.reports;
create policy reports_select on public.reports
  for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

drop policy if exists reports_insert_self on public.reports;
create policy reports_insert_self on public.reports
  for insert to authenticated
  with check (reporter_id = auth.uid());

-- Seul un administrateur peut traiter un signalement.
drop policy if exists reports_update_admin on public.reports;
create policy reports_update_admin on public.reports
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists reports_delete_admin on public.reports;
create policy reports_delete_admin on public.reports
  for delete to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- audit_logs : lecture réservée aux administrateurs
--  Écriture uniquement via public.log_audit() (SECURITY DEFINER) ou service_role.
-- -----------------------------------------------------------------------------
alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin on public.audit_logs
  for select to authenticated
  using (public.is_admin() or (actor_id = auth.uid() and entity_type = 'checkin'));

-- -----------------------------------------------------------------------------
-- platform_settings
-- -----------------------------------------------------------------------------
alter table public.platform_settings enable row level security;

drop policy if exists platform_settings_select on public.platform_settings;
create policy platform_settings_select on public.platform_settings
  for select to anon, authenticated
  using (is_public = true or public.is_admin());

drop policy if exists platform_settings_write_admin on public.platform_settings;
create policy platform_settings_write_admin on public.platform_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- payouts
-- -----------------------------------------------------------------------------
alter table public.payouts enable row level security;

drop policy if exists payouts_select on public.payouts;
create policy payouts_select on public.payouts
  for select to authenticated
  using (public.can_manage_org(organization_id) or public.is_admin());

drop policy if exists payouts_write_admin on public.payouts;
create policy payouts_write_admin on public.payouts
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- Traitement d'un signalement par un administrateur (journalisé)
-- -----------------------------------------------------------------------------
create or replace function public.resolve_report(
  p_report_id uuid,
  p_status public.report_status,
  p_resolution text default null,
  p_hide_target boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.reports;
begin
  if not public.is_admin() then
    raise exception 'Accès refusé : réservé aux administrateurs.' using errcode = '42501';
  end if;

  select * into v_report from public.reports where id = p_report_id;

  if v_report is null then
    raise exception 'Signalement % introuvable', p_report_id;
  end if;

  update public.reports
  set status = p_status,
      resolution = p_resolution,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_report_id;

  if p_hide_target then
    if v_report.target_type = 'post' then
      update public.posts
      set is_hidden = true, hidden_by = auth.uid(), hidden_reason = p_resolution
      where id = v_report.target_id;
    elsif v_report.target_type = 'comment' then
      update public.comments
      set is_hidden = true, hidden_by = auth.uid()
      where id = v_report.target_id;
    elsif v_report.target_type = 'message' then
      update public.messages
      set is_hidden = true
      where id = v_report.target_id;
    end if;
  end if;

  perform public.log_audit(
    'report.resolve',
    'report',
    p_report_id,
    null,
    v_report.event_id,
    jsonb_build_object('status', v_report.status),
    jsonb_build_object('status', p_status, 'hidden', p_hide_target)
  );
end;
$$;

comment on function public.resolve_report(uuid, public.report_status, text, boolean) is
  'Traite un signalement : met à jour son statut, masque la cible si demandé, et journalise l''action.';