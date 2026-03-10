create table if not exists public.customer_user_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  customer_profile_id uuid not null unique references public.customer_profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.orders
  add column if not exists customer_user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_orders_customer_user_id on public.orders(customer_user_id);

create table if not exists public.customer_coupon_assignments (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupon_codes(id) on delete cascade,
  customer_profile_id uuid not null references public.customer_profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'paused', 'expired')),
  starts_at timestamptz,
  ends_at timestamptz,
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  redemption_count integer not null default 0 check (redemption_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (coupon_id, customer_profile_id)
);

create index if not exists idx_customer_coupon_assignments_coupon
  on public.customer_coupon_assignments(coupon_id, status, starts_at, ends_at);
create index if not exists idx_customer_coupon_assignments_customer
  on public.customer_coupon_assignments(customer_profile_id, status);

drop trigger if exists trg_customer_coupon_assignments_updated_at on public.customer_coupon_assignments;
create trigger trg_customer_coupon_assignments_updated_at
before update on public.customer_coupon_assignments
for each row execute function public.set_updated_at();

alter table public.customer_user_accounts enable row level security;
alter table public.customer_coupon_assignments enable row level security;

drop policy if exists customer_user_accounts_owner_all on public.customer_user_accounts;
create policy customer_user_accounts_owner_all on public.customer_user_accounts
for all using (public.is_owner()) with check (public.is_owner());

drop policy if exists customer_coupon_assignments_owner_all on public.customer_coupon_assignments;
create policy customer_coupon_assignments_owner_all on public.customer_coupon_assignments
for all using (public.is_owner()) with check (public.is_owner());
