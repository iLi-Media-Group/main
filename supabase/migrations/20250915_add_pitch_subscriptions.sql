-- Pitch subscriptions table for MyBeatFi Pitch Service
create table if not exists public.pitch_subscriptions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text,
  price_id text,
  first_activated_at timestamptz,
  current_period_start bigint,
  current_period_end bigint,
  status text,
  failed_renewal_attempts integer not null default 0,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- Helpful indexes
create index if not exists idx_pitch_subscriptions_user on public.pitch_subscriptions(user_id);
create index if not exists idx_pitch_subscriptions_customer on public.pitch_subscriptions(stripe_customer_id);
create index if not exists idx_pitch_subscriptions_subscription on public.pitch_subscriptions(stripe_subscription_id);

-- RLS
alter table public.pitch_subscriptions enable row level security;

-- Policy: owners can read their own
create policy if not exists "Pitch subscriptions are viewable by owner" on public.pitch_subscriptions
  for select using (auth.uid() = user_id);

-- Policy: owners can update their own (not inserts from client; inserts happen via webhook using service key)
create policy if not exists "Pitch subscriptions updatable by owner" on public.pitch_subscriptions
  for update using (auth.uid() = user_id);

-- Trigger to keep updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_pitch_subscriptions_updated_at
before update on public.pitch_subscriptions
for each row execute function public.set_updated_at();
