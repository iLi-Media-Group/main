-- Create sync_submissions table
create table if not exists sync_submissions (
  id uuid primary key default gen_random_uuid(),
  sync_request_id uuid references custom_sync_requests(id) on delete cascade,
  producer_id uuid references profiles(id) on delete cascade,
  track_url text not null,
  notes text,
  status text default 'submitted' check (status in ('submitted', 'licensed', 'not_selected')),
  created_at timestamptz default now()
);

-- Create sync_request_messages table for chat and file delivery
create table if not exists sync_request_messages (
  id uuid primary key default gen_random_uuid(),
  sync_request_id uuid references custom_sync_requests(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  message text,
  file_url text,
  created_at timestamptz default now()
);

-- Add price field to custom_sync_requests for possible updates
alter table custom_sync_requests add column if not exists price numeric; 