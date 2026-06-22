-- Prevent duplicate identities at database level.
create unique index if not exists profiles_phone_unique_idx on public.profiles(phone) where phone is not null;
create unique index if not exists studio_payment_orders_username_unique_idx on public.studio_payment_orders(lower(username)) where username is not null;
create unique index if not exists studio_payment_orders_email_unique_idx on public.studio_payment_orders(lower(email)) where email is not null;
