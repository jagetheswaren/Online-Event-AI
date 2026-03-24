create table if not exists public.payment_transactions (
  reference_id text primary key,
  provider text not null check (provider in ('stripe', 'razorpay')),
  booking_id text,
  amount bigint not null default 0,
  currency text not null default 'INR',
  status text not null check (status in ('pending', 'confirmed', 'failed')),
  last_event_type text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payment_transactions_booking_id
  on public.payment_transactions (booking_id);

create index if not exists idx_payment_transactions_status
  on public.payment_transactions (status);

-- Optional: booking_requests synchronization helper via trigger
-- If you need DB-level sync, uncomment and customize:
-- create or replace function public.sync_booking_webhook_status()
-- returns trigger as $$
-- begin
--   update public.booking_requests
--   set "paymentWebhookStatus" = new.status
--   where "paymentReferenceId" = new.reference_id;
--   return new;
-- end;
-- $$ language plpgsql;
--
-- create trigger trg_sync_booking_webhook_status
-- after insert or update on public.payment_transactions
-- for each row execute function public.sync_booking_webhook_status();
