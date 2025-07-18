-- Create report_settings table for storing global report settings (e.g., default cover)
create table if not exists report_settings (
  id serial primary key,
  default_cover_url text,
  updated_at timestamptz default now()
);

-- Insert a default row if not exists (id=1)
insert into report_settings (id, default_cover_url)
  values (1, null)
  on conflict (id) do nothing; 