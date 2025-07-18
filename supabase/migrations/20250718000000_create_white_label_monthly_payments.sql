-- Create table for tracking white label monthly subscription payments
create table if not exists white_label_monthly_payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references white_label_clients(id) not null,
  amount numeric not null,
  due_date date not null,
  paid_date date, -- nullable, set when payment is received
  status text not null default 'pending', -- 'pending', 'paid', etc.
  created_at timestamptz default now()
);
-- Index for quick lookup by client and due date
create index if not exists idx_white_label_monthly_payments_client_due on white_label_monthly_payments(client_id, due_date); 