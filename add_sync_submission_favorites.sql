-- Create table to store client favorites for sync submissions
create table if not exists sync_submission_favorites (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  sync_submission_id uuid references sync_submissions(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique (client_id, sync_submission_id)
); 