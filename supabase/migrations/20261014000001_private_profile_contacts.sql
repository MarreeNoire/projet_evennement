-- Keep payment contact details private from public profile reads.
begin;

create table if not exists public.profile_contacts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile_contacts enable row level security;
revoke all on public.profile_contacts from public, anon, authenticated;
grant select, insert, update on public.profile_contacts to authenticated;
grant all on public.profile_contacts to service_role;

drop policy if exists profile_contacts_select_self on public.profile_contacts;
create policy profile_contacts_select_self on public.profile_contacts
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists profile_contacts_insert_self on public.profile_contacts;
create policy profile_contacts_insert_self on public.profile_contacts
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists profile_contacts_update_self on public.profile_contacts;
create policy profile_contacts_update_self on public.profile_contacts
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Keep the legacy profiles.phone column inaccessible through PostgREST.
revoke select on public.profiles from anon, authenticated;
grant select (
  id, username, display_name, full_name, email, avatar_url, bio, city, country,
  interests, visibility, allow_search, allow_connections, allow_private_messages,
  is_verified, onboarding_completed, last_seen_at, created_at, updated_at
) on public.profiles to authenticated;

revoke insert on public.profiles from anon, authenticated;
revoke update on public.profiles from authenticated;
grant update (
  username, display_name, full_name, email, avatar_url, bio, city, country,
  interests, visibility, allow_search, allow_connections, allow_private_messages,
  onboarding_completed, last_seen_at, updated_at
) on public.profiles to authenticated;

-- Preserve any existing phone values while removing them from publicly readable profiles.
insert into public.profile_contacts (user_id, phone)
select id, btrim(phone)
from public.profiles
where nullif(btrim(phone), '') is not null
on conflict (user_id) do update
set phone = excluded.phone,
    updated_at = now();

update public.profiles
set phone = null
where phone is not null;

-- New email signups send phone in user metadata; keep it in the private table.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  phone_value text;
begin
  phone_value := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'phone'), ''),
    nullif(btrim(new.phone), '')
  );

  insert into public.profiles (id, display_name, full_name, email, phone, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, 'membre'), '@', 1),
      'Nouveau membre'
    ),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    null,
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;

  if phone_value is not null then
    insert into public.profile_contacts (user_id, phone)
    values (new.id, phone_value)
    on conflict (user_id) do update
    set phone = excluded.phone,
        updated_at = now();
  end if;

  insert into public.user_roles (user_id, role)
  values (new.id, 'participant')
  on conflict (user_id, role) do nothing;

  perform public.seed_notification_preferences(new.id);

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Crée le profil public, le contact privé, le rôle participant et les préférences de notification à l’inscription.';

commit;
