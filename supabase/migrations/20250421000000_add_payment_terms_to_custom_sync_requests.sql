-- Add payment_terms and payment_due_date to custom_sync_requests
alter table custom_sync_requests add column if not exists payment_terms text check (payment_terms in ('immediate', 'net30', 'net60', 'net90')) default 'immediate';
alter table custom_sync_requests add column if not exists payment_due_date timestamptz; 