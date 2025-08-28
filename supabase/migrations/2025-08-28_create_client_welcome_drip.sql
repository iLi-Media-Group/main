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


