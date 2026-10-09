-- Rejouer une même demande de checkout doit retrouver la commande initiale.
alter table public.orders
  add column if not exists checkout_key uuid;

create unique index if not exists orders_user_checkout_key_uidx
  on public.orders (user_id, checkout_key)
  where checkout_key is not null;

-- Le proxy lit ce paramètre pour afficher la page de maintenance aux visiteurs.
insert into public.platform_settings (key, value, description, is_public)
values (
  'platform.maintenance_mode',
  'false'::jsonb,
  'Suspend temporairement l’accès visiteur pendant une opération de maintenance.',
  true
)
on conflict (key) do update set is_public = true;
