do $$
begin
  create type payment_provider as enum ('manual_offline', 'stripe', 'paypal', 'bank_transfer');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type payment_transaction_status as enum (
    'initiated',
    'pending',
    'authorized',
    'paid',
    'failed',
    'refunded',
    'cancelled'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type campaign_status as enum ('draft', 'scheduled', 'active', 'paused', 'archived');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type promotion_status as enum ('draft', 'active', 'paused', 'archived');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type promotion_type as enum ('percentage', 'fixed_amount', 'free_shipping');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type promotion_scope as enum ('order', 'product', 'category');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type coupon_status as enum ('active', 'paused', 'expired', 'archived');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type support_channel as enum ('web_chat', 'whatsapp', 'phone', 'email');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type support_thread_status as enum ('open', 'pending_customer', 'resolved', 'archived');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type support_message_direction as enum ('inbound', 'outbound', 'internal');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type notification_channel as enum ('email', 'whatsapp', 'sms', 'internal');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type notification_status as enum ('queued', 'sent', 'failed', 'cancelled');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type automation_trigger as enum (
    'order_created',
    'order_status_changed',
    'repair_created',
    'repair_status_changed',
    'abandoned_cart',
    'back_in_stock',
    'service_reminder'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type stock_movement_type as enum (
    'manual_adjustment',
    'purchase_receive',
    'order_reserve',
    'order_release',
    'order_deduct',
    'repair_use'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type purchase_order_status as enum (
    'draft',
    'ordered',
    'partially_received',
    'received',
    'cancelled'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type work_order_status as enum (
    'pending',
    'assigned',
    'in_progress',
    'waiting_parts',
    'ready',
    'completed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type technician_role as enum ('technician', 'lead', 'assistant');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type reward_type as enum ('points', 'discount', 'credit');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type affiliate_status as enum ('pending', 'active', 'suspended', 'archived');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type payout_status as enum ('pending', 'approved', 'paid', 'cancelled');
exception
  when duplicate_object then null;
end
$$;

alter table public.orders
  add column if not exists discount_amount numeric(10,2) not null default 0 check (discount_amount >= 0),
  add column if not exists coupon_code_applied text;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  status campaign_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  budget numeric(10,2),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete set null,
  name text not null,
  status promotion_status not null default 'draft',
  type promotion_type not null,
  scope promotion_scope not null default 'order',
  percentage_off numeric(5,2) check (percentage_off is null or (percentage_off >= 0 and percentage_off <= 100)),
  amount_off numeric(10,2) check (amount_off is null or amount_off >= 0),
  min_order_total numeric(10,2) not null default 0 check (min_order_total >= 0),
  applies_to jsonb not null default '[]'::jsonb,
  is_stackable boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.coupon_codes (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  code text unique not null,
  status coupon_status not null default 'active',
  usage_limit integer,
  usage_count integer not null default 0,
  per_customer_limit integer not null default 1,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupon_codes(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  customer_email_normalized text,
  customer_phone_normalized text,
  amount_discount numeric(10,2) not null check (amount_discount >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider payment_provider not null default 'manual_offline',
  method payment_method not null,
  status payment_transaction_status not null default 'initiated',
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'EUR',
  provider_reference text,
  provider_payload jsonb not null default '{}'::jsonb,
  failure_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.payment_transactions(id) on delete cascade,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.refund_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.payment_transactions(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  reason text,
  status payment_transaction_status not null default 'pending',
  provider_reference text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  customer_key text unique not null,
  name text,
  email text,
  email_normalized text,
  phone text,
  phone_normalized text,
  tags text[] not null default '{}',
  total_orders integer not null default 0,
  total_repairs integer not null default 0,
  lifetime_value numeric(10,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_tags (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null references public.customer_profiles(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (customer_profile_id, tag)
);

create table if not exists public.customer_activity_timeline (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null references public.customer_profiles(id) on delete cascade,
  activity_type text not null,
  reference_type text,
  reference_id text,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.support_threads (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid references public.customer_profiles(id) on delete set null,
  subject text not null,
  channel support_channel not null default 'web_chat',
  status support_thread_status not null default 'open',
  assigned_to uuid references public.profiles(id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.support_thread_links (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  link_type text not null check (link_type in ('order', 'repair', 'contact', 'customer')),
  link_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (thread_id, link_type, link_id)
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  direction support_message_direction not null,
  message text not null,
  sender_name text,
  sender_email text,
  sender_phone text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text not null,
  channel notification_channel not null,
  trigger automation_trigger not null,
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.notification_templates(id) on delete set null,
  customer_profile_id uuid references public.customer_profiles(id) on delete set null,
  channel notification_channel not null,
  trigger automation_trigger not null,
  payload jsonb not null default '{}'::jsonb,
  status notification_status not null default 'queued',
  scheduled_for timestamptz not null default timezone('utc', now()),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.notification_jobs(id) on delete cascade,
  status notification_status not null,
  provider_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  movement_type stock_movement_type not null,
  quantity_delta integer not null,
  unit_cost numeric(10,2),
  reference_type text,
  reference_id text,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.stock_reservations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  status text not null default 'active' check (status in ('active', 'released', 'fulfilled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (product_id, order_id)
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  contact_name text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text unique not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  status purchase_order_status not null default 'draft',
  ordered_at timestamptz,
  received_at timestamptz,
  notes text,
  subtotal numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  title_snapshot text not null,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(10,2) not null check (unit_cost >= 0),
  total_cost numeric(10,2) not null check (total_cost >= 0),
  received_quantity integer not null default 0 check (received_quantity >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.repair_work_orders (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  status work_order_status not null default 'pending',
  diagnosis text,
  estimate_amount numeric(10,2),
  approved_by_customer boolean not null default false,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.technician_assignments (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.repair_work_orders(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  role technician_role not null default 'technician',
  assigned_at timestamptz not null default timezone('utc', now()),
  unique (work_order_id, profile_id)
);

create table if not exists public.repair_parts_used (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.repair_work_orders(id) on delete cascade,
  part_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_cost numeric(10,2) not null default 0 check (unit_cost >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.repair_estimates (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.repair_work_orders(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  notes text,
  approved boolean not null default false,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.loyalty_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  points_per_eur numeric(10,4) not null default 1 check (points_per_eur >= 0),
  min_redeem_points integer not null default 100 check (min_redeem_points >= 0),
  reward_type reward_type not null default 'points',
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.loyalty_accounts (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null unique references public.customer_profiles(id) on delete cascade,
  points_balance integer not null default 0,
  tier text not null default 'standard',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  loyalty_account_id uuid not null references public.loyalty_accounts(id) on delete cascade,
  points_delta integer not null,
  reason text not null,
  reference_type text,
  reference_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid references public.customer_profiles(id) on delete set null,
  code text unique not null,
  reward_points integer not null default 0,
  is_active boolean not null default true,
  usage_limit integer,
  usage_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referral_code_id uuid not null references public.referral_codes(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  rewarded_customer_profile_id uuid references public.customer_profiles(id) on delete set null,
  points_awarded integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  code text unique not null,
  status affiliate_status not null default 'pending',
  commission_rate numeric(6,4) not null default 0.0500 check (commission_rate >= 0),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  source text,
  landing_page text,
  visitor_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.affiliate_conversions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  commission_amount numeric(10,2) not null default 0 check (commission_amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.affiliate_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  period_start date,
  period_end date,
  amount numeric(10,2) not null check (amount >= 0),
  status payout_status not null default 'pending',
  paid_at timestamptz,
  reference text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_campaigns_status_dates on public.campaigns(status, starts_at, ends_at);
create index if not exists idx_promotions_campaign_status on public.promotions(campaign_id, status);
create index if not exists idx_coupon_codes_code_status on public.coupon_codes(code, status);
create index if not exists idx_coupon_redemptions_coupon on public.coupon_redemptions(coupon_id, created_at desc);
create index if not exists idx_payment_transactions_order on public.payment_transactions(order_id, created_at desc);
create index if not exists idx_payment_transactions_status on public.payment_transactions(status, created_at desc);
create index if not exists idx_customer_profiles_email on public.customer_profiles(email_normalized);
create index if not exists idx_customer_profiles_phone on public.customer_profiles(phone_normalized);
create index if not exists idx_support_threads_status on public.support_threads(status, created_at desc);
create index if not exists idx_support_messages_thread on public.support_messages(thread_id, created_at desc);
create index if not exists idx_notification_jobs_status on public.notification_jobs(status, scheduled_for);
create index if not exists idx_stock_movements_product on public.stock_movements(product_id, created_at desc);
create index if not exists idx_stock_reservations_order on public.stock_reservations(order_id, status);
create index if not exists idx_purchase_orders_supplier on public.purchase_orders(supplier_id, status);
create index if not exists idx_repair_work_orders_status on public.repair_work_orders(status, created_at desc);
create index if not exists idx_loyalty_accounts_customer on public.loyalty_accounts(customer_profile_id);
create index if not exists idx_referral_codes_code on public.referral_codes(code);
create index if not exists idx_affiliates_code on public.affiliates(code);
create index if not exists idx_affiliate_clicks_affiliate on public.affiliate_clicks(affiliate_id, created_at desc);
create index if not exists idx_affiliate_conversions_affiliate on public.affiliate_conversions(affiliate_id, created_at desc);
create index if not exists idx_affiliate_payouts_affiliate on public.affiliate_payouts(affiliate_id, status);

drop trigger if exists trg_campaigns_updated_at on public.campaigns;
create trigger trg_campaigns_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

drop trigger if exists trg_promotions_updated_at on public.promotions;
create trigger trg_promotions_updated_at
before update on public.promotions
for each row execute function public.set_updated_at();

drop trigger if exists trg_coupon_codes_updated_at on public.coupon_codes;
create trigger trg_coupon_codes_updated_at
before update on public.coupon_codes
for each row execute function public.set_updated_at();

drop trigger if exists trg_payment_transactions_updated_at on public.payment_transactions;
create trigger trg_payment_transactions_updated_at
before update on public.payment_transactions
for each row execute function public.set_updated_at();

drop trigger if exists trg_refund_transactions_updated_at on public.refund_transactions;
create trigger trg_refund_transactions_updated_at
before update on public.refund_transactions
for each row execute function public.set_updated_at();

drop trigger if exists trg_customer_profiles_updated_at on public.customer_profiles;
create trigger trg_customer_profiles_updated_at
before update on public.customer_profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_support_threads_updated_at on public.support_threads;
create trigger trg_support_threads_updated_at
before update on public.support_threads
for each row execute function public.set_updated_at();

drop trigger if exists trg_notification_templates_updated_at on public.notification_templates;
create trigger trg_notification_templates_updated_at
before update on public.notification_templates
for each row execute function public.set_updated_at();

drop trigger if exists trg_notification_jobs_updated_at on public.notification_jobs;
create trigger trg_notification_jobs_updated_at
before update on public.notification_jobs
for each row execute function public.set_updated_at();

drop trigger if exists trg_stock_reservations_updated_at on public.stock_reservations;
create trigger trg_stock_reservations_updated_at
before update on public.stock_reservations
for each row execute function public.set_updated_at();

drop trigger if exists trg_suppliers_updated_at on public.suppliers;
create trigger trg_suppliers_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

drop trigger if exists trg_purchase_orders_updated_at on public.purchase_orders;
create trigger trg_purchase_orders_updated_at
before update on public.purchase_orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_repair_work_orders_updated_at on public.repair_work_orders;
create trigger trg_repair_work_orders_updated_at
before update on public.repair_work_orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_repair_estimates_updated_at on public.repair_estimates;
create trigger trg_repair_estimates_updated_at
before update on public.repair_estimates
for each row execute function public.set_updated_at();

drop trigger if exists trg_loyalty_rules_updated_at on public.loyalty_rules;
create trigger trg_loyalty_rules_updated_at
before update on public.loyalty_rules
for each row execute function public.set_updated_at();

drop trigger if exists trg_loyalty_accounts_updated_at on public.loyalty_accounts;
create trigger trg_loyalty_accounts_updated_at
before update on public.loyalty_accounts
for each row execute function public.set_updated_at();

drop trigger if exists trg_referral_codes_updated_at on public.referral_codes;
create trigger trg_referral_codes_updated_at
before update on public.referral_codes
for each row execute function public.set_updated_at();

drop trigger if exists trg_affiliates_updated_at on public.affiliates;
create trigger trg_affiliates_updated_at
before update on public.affiliates
for each row execute function public.set_updated_at();

drop trigger if exists trg_affiliate_payouts_updated_at on public.affiliate_payouts;
create trigger trg_affiliate_payouts_updated_at
before update on public.affiliate_payouts
for each row execute function public.set_updated_at();

alter table public.campaigns enable row level security;
alter table public.promotions enable row level security;
alter table public.coupon_codes enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_events enable row level security;
alter table public.refund_transactions enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.customer_tags enable row level security;
alter table public.customer_activity_timeline enable row level security;
alter table public.support_threads enable row level security;
alter table public.support_thread_links enable row level security;
alter table public.support_messages enable row level security;
alter table public.notification_templates enable row level security;
alter table public.notification_jobs enable row level security;
alter table public.notification_logs enable row level security;
alter table public.stock_movements enable row level security;
alter table public.stock_reservations enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.repair_work_orders enable row level security;
alter table public.technician_assignments enable row level security;
alter table public.repair_parts_used enable row level security;
alter table public.repair_estimates enable row level security;
alter table public.loyalty_rules enable row level security;
alter table public.loyalty_accounts enable row level security;
alter table public.loyalty_ledger enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referral_rewards enable row level security;
alter table public.affiliates enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.affiliate_conversions enable row level security;
alter table public.affiliate_payouts enable row level security;

drop policy if exists campaigns_owner_all on public.campaigns;
create policy campaigns_owner_all on public.campaigns for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists promotions_owner_all on public.promotions;
create policy promotions_owner_all on public.promotions for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists coupon_codes_owner_all on public.coupon_codes;
create policy coupon_codes_owner_all on public.coupon_codes for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists coupon_redemptions_owner_all on public.coupon_redemptions;
create policy coupon_redemptions_owner_all on public.coupon_redemptions for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists payment_transactions_owner_all on public.payment_transactions;
create policy payment_transactions_owner_all on public.payment_transactions for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists payment_events_owner_all on public.payment_events;
create policy payment_events_owner_all on public.payment_events for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists refund_transactions_owner_all on public.refund_transactions;
create policy refund_transactions_owner_all on public.refund_transactions for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists customer_profiles_owner_all on public.customer_profiles;
create policy customer_profiles_owner_all on public.customer_profiles for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists customer_tags_owner_all on public.customer_tags;
create policy customer_tags_owner_all on public.customer_tags for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists customer_activity_timeline_owner_all on public.customer_activity_timeline;
create policy customer_activity_timeline_owner_all on public.customer_activity_timeline for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists support_threads_owner_all on public.support_threads;
create policy support_threads_owner_all on public.support_threads for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists support_thread_links_owner_all on public.support_thread_links;
create policy support_thread_links_owner_all on public.support_thread_links for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists support_messages_owner_all on public.support_messages;
create policy support_messages_owner_all on public.support_messages for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists notification_templates_owner_all on public.notification_templates;
create policy notification_templates_owner_all on public.notification_templates for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists notification_jobs_owner_all on public.notification_jobs;
create policy notification_jobs_owner_all on public.notification_jobs for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists notification_logs_owner_all on public.notification_logs;
create policy notification_logs_owner_all on public.notification_logs for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists stock_movements_owner_all on public.stock_movements;
create policy stock_movements_owner_all on public.stock_movements for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists stock_reservations_owner_all on public.stock_reservations;
create policy stock_reservations_owner_all on public.stock_reservations for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists suppliers_owner_all on public.suppliers;
create policy suppliers_owner_all on public.suppliers for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists purchase_orders_owner_all on public.purchase_orders;
create policy purchase_orders_owner_all on public.purchase_orders for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists purchase_order_items_owner_all on public.purchase_order_items;
create policy purchase_order_items_owner_all on public.purchase_order_items for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists repair_work_orders_owner_all on public.repair_work_orders;
create policy repair_work_orders_owner_all on public.repair_work_orders for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists technician_assignments_owner_all on public.technician_assignments;
create policy technician_assignments_owner_all on public.technician_assignments for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists repair_parts_used_owner_all on public.repair_parts_used;
create policy repair_parts_used_owner_all on public.repair_parts_used for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists repair_estimates_owner_all on public.repair_estimates;
create policy repair_estimates_owner_all on public.repair_estimates for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists loyalty_rules_owner_all on public.loyalty_rules;
create policy loyalty_rules_owner_all on public.loyalty_rules for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists loyalty_accounts_owner_all on public.loyalty_accounts;
create policy loyalty_accounts_owner_all on public.loyalty_accounts for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists loyalty_ledger_owner_all on public.loyalty_ledger;
create policy loyalty_ledger_owner_all on public.loyalty_ledger for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists referral_codes_owner_all on public.referral_codes;
create policy referral_codes_owner_all on public.referral_codes for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists referral_rewards_owner_all on public.referral_rewards;
create policy referral_rewards_owner_all on public.referral_rewards for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists affiliates_owner_all on public.affiliates;
create policy affiliates_owner_all on public.affiliates for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists affiliate_clicks_owner_all on public.affiliate_clicks;
create policy affiliate_clicks_owner_all on public.affiliate_clicks for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists affiliate_conversions_owner_all on public.affiliate_conversions;
create policy affiliate_conversions_owner_all on public.affiliate_conversions for all
using (public.is_owner()) with check (public.is_owner());

drop policy if exists affiliate_payouts_owner_all on public.affiliate_payouts;
create policy affiliate_payouts_owner_all on public.affiliate_payouts for all
using (public.is_owner()) with check (public.is_owner());
