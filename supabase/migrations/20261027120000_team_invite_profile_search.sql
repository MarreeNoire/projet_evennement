-- Search opt-in profiles for active owners/managers inviting organization teammates.
create or replace function public.search_team_invite_profiles(
  search_query text,
  organization_id uuid,
  result_limit integer default 10
)
returns table (
  id uuid,
  display_name text,
  username text,
  full_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.display_name, p.username, p.full_name, p.avatar_url
  from public.profiles p
  where auth.uid() is not null
    and p.id <> auth.uid()
    and p.allow_search = true
    and nullif(btrim(search_query), '') is not null
    and char_length(btrim(search_query)) >= 2
    and (
      exists (
        select 1 from public.organizations o
        where o.id = organization_id and o.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.organization_members m
        where m.organization_id = organization_id
          and m.user_id = auth.uid()
          and m.status = 'active'
          and m.role in ('owner', 'manager')
      )
    )
    and (
      p.display_name ilike '%' || replace(replace(search_query, '%', ''), '_', '') || '%'
      or p.full_name ilike '%' || replace(replace(search_query, '%', ''), '_', '') || '%'
      or p.username ilike '%' || ltrim(replace(replace(search_query, '%', ''), '_', ''), '@') || '%'
      or p.email ilike '%' || replace(replace(search_query, '%', ''), '_', '') || '%'
    )
  order by p.display_name nulls last, p.username nulls last
  limit least(greatest(coalesce(result_limit, 10), 1), 20);
$$;

revoke all on function public.search_team_invite_profiles(text, uuid, integer) from public, anon;
grant execute on function public.search_team_invite_profiles(text, uuid, integer) to authenticated;

comment on function public.search_team_invite_profiles(text, uuid, integer) is
  'Searches profiles that opted into search for an active organization owner or manager.';
