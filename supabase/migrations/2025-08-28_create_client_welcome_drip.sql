-- Create table to manage 6-week client welcome drip campaigns
-- Schedules weekly emails at Monday 7pm America/New_York

create extension if not exists pgcrypto;

create table if not exists client_welcome_drip_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text not null,
  first_name text,
  current_week integer not null default 0, -- 0 means none sent yet
  next_send_at timestamptz not null,      -- when the next email should be sent (UTC)
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- Enable RLS
alter table client_welcome_drip_subscriptions enable row level security;

-- Users can only see their own drip subscription
create policy "Users can view own drip subscription"
  on client_welcome_drip_subscriptions
  for select
  using (auth.uid() = user_id);

-- Users can update their own drip subscription (for unsubscribe, etc.)
create policy "Users can update own drip subscription"
  on client_welcome_drip_subscriptions
  for update
  using (auth.uid() = user_id);

-- Service role can do everything (for edge functions)
create policy "Service role full access"
  on client_welcome_drip_subscriptions
  for all
  using (auth.role() = 'service_role');

-- Allow inserts from service role (for scheduling)
create policy "Service role can insert"
  on client_welcome_drip_subscriptions
  for insert
  with check (auth.role() = 'service_role');

create index if not exists idx_client_welcome_drip_next_send_at
  on client_welcome_drip_subscriptions(next_send_at);

-- Update trigger for updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_client_welcome_drip_updated_at on client_welcome_drip_subscriptions;
create trigger trg_client_welcome_drip_updated_at
before update on client_welcome_drip_subscriptions
for each row execute function set_updated_at();


