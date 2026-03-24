-- Enable extension for UUID generation if needed.
create extension if not exists "uuid-ossp";

-- Users profile table (linked to auth.users id)
create table if not exists public.users (
  id text primary key,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  avatar text,
  nickname text,
  role text not null default 'customer' check (role in ('customer', 'planner', 'vendor')),
  city text,
  budgetTier text,
  styleTags jsonb,
  favoriteCategories jsonb,
  notificationChannels jsonb,
  aiTone text,
  onboardingCompleted boolean not null default false,
  profileCompletion integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id text primary key,
  eventId text not null,
  userId text not null,
  userName text not null,
  userAvatar text,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text not null,
  date text not null
);

create table if not exists public.user_events (
  id text primary key,
  eventId text not null,
  event jsonb not null,
  status text not null check (status in ('registered', 'booked', 'completed', 'cancelled')),
  date text not null,
  guestCount int not null,
  specialRequests text,
  bookingDetails jsonb
);

create table if not exists public.booking_requests (
  id text primary key,
  eventId text not null,
  event jsonb not null,
  userId text not null,
  user jsonb not null,
  status text not null check (status in ('pending', 'approved', 'rejected')),
  date text not null,
  guestCount int not null,
  venue text not null,
  contactName text not null,
  email text not null,
  phone text not null,
  specialRequests text,
  createdAt text not null,
  paymentGateway text,
  paymentReferenceId text,
  paymentWebhookStatus text
);

create table if not exists public.vendor_bookings (
  id text primary key,
  vendorId text not null,
  vendor jsonb not null,
  userId text not null,
  "user" jsonb not null,
  eventDate text not null,
  guestCount int not null,
  budget int,
  notes text,
  status text not null check (status in ('pending', 'approved', 'rejected')),
  createdAt text not null
);

alter table public.users enable row level security;
alter table public.reviews enable row level security;
alter table public.user_events enable row level security;
alter table public.booking_requests enable row level security;
alter table public.vendor_bookings enable row level security;

-- Basic RLS for authenticated users.
create policy if not exists "users_select_own" on public.users
  for select using (id = auth.uid()::text);
create policy if not exists "users_upsert_own" on public.users
  for all using (id = auth.uid()::text) with check (id = auth.uid()::text);

create policy if not exists "reviews_read_all" on public.reviews
  for select using (true);
create policy if not exists "reviews_insert_auth" on public.reviews
  for insert with check (auth.role() = 'authenticated');
create policy if not exists "reviews_update_own" on public.reviews
  for update using (userId = auth.uid()::text);

create policy if not exists "user_events_read_own" on public.user_events
  for select using ((bookingDetails->>'email') = (select email from auth.users where id = auth.uid()));
create policy if not exists "user_events_insert_auth" on public.user_events
  for insert with check (auth.role() = 'authenticated');
create policy if not exists "user_events_update_auth" on public.user_events
  for update using (auth.role() = 'authenticated');

create policy if not exists "booking_requests_read_auth" on public.booking_requests
  for select using (auth.role() = 'authenticated');
create policy if not exists "booking_requests_insert_auth" on public.booking_requests
  for insert with check (auth.role() = 'authenticated');
create policy if not exists "booking_requests_update_auth" on public.booking_requests
  for update using (auth.role() = 'authenticated');

create policy if not exists "vendor_bookings_read_auth" on public.vendor_bookings
  for select using (auth.role() = 'authenticated');
create policy if not exists "vendor_bookings_insert_auth" on public.vendor_bookings
  for insert with check (auth.role() = 'authenticated');
create policy if not exists "vendor_bookings_update_auth" on public.vendor_bookings
  for update using (auth.role() = 'authenticated');
