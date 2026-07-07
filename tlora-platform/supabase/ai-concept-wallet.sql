alter table public.profiles
add column if not exists credit_balance_vnd integer not null default 0 check (credit_balance_vnd >= 0);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_vnd integer not null,
  type text not null check (type in ('top_up', 'ai_concept_charge', 'refund')),
  note text,
  created_at timestamptz not null default now()
);

alter table public.wallet_transactions enable row level security;

drop policy if exists "Users can read own wallet transactions" on public.wallet_transactions;
create policy "Users can read own wallet transactions"
on public.wallet_transactions for select
using (auth.uid() = user_id);

drop policy if exists "Admins can read wallet transactions" on public.wallet_transactions;
create policy "Admins can read wallet transactions"
on public.wallet_transactions for select
using (public.current_user_role() in ('admin', 'staff'));
