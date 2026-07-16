begin;

create extension if not exists pgcrypto;

alter table public.customer_galleries
  add column if not exists share_token text;

update public.customer_galleries
set share_token = encode(gen_random_bytes(24), 'hex')
where share_token is null or length(trim(share_token)) < 32;

alter table public.customer_galleries
  alter column share_token set default encode(gen_random_bytes(24), 'hex'),
  alter column share_token set not null;

create unique index if not exists customer_galleries_share_token_uidx
  on public.customer_galleries (share_token);

-- Customer galleries are served through token-aware server routes, never directly
-- through the anonymous Supabase API.
drop policy if exists "Public can read customer galleries" on public.customer_galleries;
drop policy if exists "Public can read customer gallery photos" on public.customer_gallery_photos;
revoke all on table public.customer_galleries from anon;
revoke all on table public.customer_gallery_photos from anon;

alter table public.customer_galleries enable row level security;
alter table public.customer_gallery_photos enable row level security;

create unique index if not exists studio_payment_orders_transaction_id_uidx
  on public.studio_payment_orders (transaction_id)
  where transaction_id is not null and transaction_id <> '';

create unique index if not exists license_renewal_orders_transaction_id_uidx
  on public.license_renewal_orders (transaction_id)
  where transaction_id is not null and transaction_id <> '';

commit;
