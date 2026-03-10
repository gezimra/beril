create extension if not exists pgcrypto;

do $$
begin
  create type product_category as enum ('watch', 'eyewear');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type product_subtype as enum ('analog_watch', 'smart_watch', 'frame', 'sunglasses', 'service_accessory');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type stock_status as enum ('in_stock', 'limited', 'available_on_request', 'out_of_stock');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type product_status as enum ('draft', 'active', 'archived');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type order_status as enum ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'delivered', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type payment_method as enum ('cash_on_delivery', 'pay_in_store', 'card_online', 'bank_transfer');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type payment_status as enum ('pending', 'not_required', 'authorized', 'paid', 'failed', 'refunded', 'cancelled');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type delivery_method as enum ('home_delivery', 'store_pickup');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type repair_status as enum ('request_received', 'awaiting_drop_off', 'received_in_store', 'under_inspection', 'waiting_parts', 'in_repair', 'ready_for_pickup', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type preferred_contact_method as enum ('phone', 'email', 'whatsapp');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type drop_off_method as enum ('bring_to_store', 'already_dropped_off', 'contact_me_first');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type journal_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type user_role as enum ('owner', 'manager', 'service_staff', 'editor');
exception
  when duplicate_object then null;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role user_role not null default 'owner',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  brand text not null,
  category product_category not null,
  subtype product_subtype not null,
  short_description text not null,
  description text not null,
  price numeric(10,2) not null check (price >= 0),
  currency text not null default 'EUR',
  stock_status stock_status not null default 'in_stock',
  quantity integer check (quantity is null or quantity >= 0),
  featured boolean not null default false,
  is_new boolean not null default false,
  status product_status not null default 'draft',
  primary_cta_mode text not null default 'add_to_cart',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text not null,
  sort_order integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  unique (product_id, sort_order)
);

create table if not exists public.product_specs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  key text not null,
  value text not null,
  sort_order integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  unique (product_id, key, sort_order)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null,
  customer_name text not null,
  phone text not null,
  phone_normalized text not null,
  email text,
  email_normalized text,
  city text not null,
  address text not null,
  notes text,
  internal_notes text,
  delivery_method delivery_method not null,
  payment_method payment_method not null,
  payment_status payment_status not null default 'pending',
  payment_provider text,
  payment_reference text,
  order_status order_status not null default 'pending',
  subtotal numeric(10,2) not null check (subtotal >= 0),
  delivery_fee numeric(10,2) not null default 0 check (delivery_fee >= 0),
  total numeric(10,2) not null check (total >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_title_snapshot text not null,
  product_brand_snapshot text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  total_price numeric(10,2) not null check (total_price >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status order_status not null,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.repair_requests (
  id uuid primary key default gen_random_uuid(),
  repair_code text unique not null,
  customer_name text not null,
  email text,
  email_normalized text,
  phone text not null,
  phone_normalized text not null,
  preferred_contact_method preferred_contact_method not null,
  item_type text not null,
  brand text not null,
  model text not null,
  serial_number text,
  purchase_date date,
  service_type text not null,
  description text not null,
  drop_off_method drop_off_method not null,
  status repair_status not null default 'request_received',
  estimated_completion date,
  amount_due numeric(10,2),
  notes_internal text,
  notes_customer text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.repair_attachments (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  file_url text not null,
  file_type text not null,
  file_label text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.repair_status_history (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  status repair_status not null,
  note text,
  visible_to_customer boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.journal_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text not null,
  content text not null,
  cover_image text,
  status journal_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_brand on public.products(brand);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_orders_status on public.orders(order_status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_repair_requests_status on public.repair_requests(status);
create index if not exists idx_repair_requests_created_at on public.repair_requests(created_at desc);
create index if not exists idx_journal_posts_status_published_at on public.journal_posts(status, published_at desc);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_repair_requests_updated_at on public.repair_requests;
create trigger trg_repair_requests_updated_at
before update on public.repair_requests
for each row execute function public.set_updated_at();

drop trigger if exists trg_journal_posts_updated_at on public.journal_posts;
create trigger trg_journal_posts_updated_at
before update on public.journal_posts
for each row execute function public.set_updated_at();

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'owner'
  );
$$;

grant execute on function public.is_owner() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_specs enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.repair_requests enable row level security;
alter table public.repair_attachments enable row level security;
alter table public.repair_status_history enable row level security;
alter table public.contacts enable row level security;
alter table public.journal_posts enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists products_select_public on public.products;
create policy products_select_public
on public.products
for select
using (status = 'active');

drop policy if exists product_images_select_public on public.product_images;
create policy product_images_select_public
on public.product_images
for select
using (
  exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and products.status = 'active'
  )
);

drop policy if exists product_specs_select_public on public.product_specs;
create policy product_specs_select_public
on public.product_specs
for select
using (
  exists (
    select 1 from public.products
    where products.id = product_specs.product_id
      and products.status = 'active'
  )
);

drop policy if exists site_settings_select_public on public.site_settings;
create policy site_settings_select_public
on public.site_settings
for select
using (true);

drop policy if exists journal_posts_select_public on public.journal_posts;
create policy journal_posts_select_public
on public.journal_posts
for select
using (status = 'published');

drop policy if exists profiles_owner_all on public.profiles;
create policy profiles_owner_all
on public.profiles
for all
using (public.is_owner())
with check (public.is_owner());

drop policy if exists products_owner_all on public.products;
create policy products_owner_all
on public.products
for all
using (public.is_owner())
with check (public.is_owner());

drop policy if exists product_images_owner_all on public.product_images;
create policy product_images_owner_all
on public.product_images
for all
using (public.is_owner())
with check (public.is_owner());

drop policy if exists product_specs_owner_all on public.product_specs;
create policy product_specs_owner_all
on public.product_specs
for all
using (public.is_owner())
with check (public.is_owner());

drop policy if exists orders_owner_all on public.orders;
create policy orders_owner_all
on public.orders
for all
using (public.is_owner())
with check (public.is_owner());

drop policy if exists order_items_owner_all on public.order_items;
create policy order_items_owner_all
on public.order_items
for all
using (public.is_owner())
with check (public.is_owner());

drop policy if exists order_status_history_owner_all on public.order_status_history;
create policy order_status_history_owner_all
on public.order_status_history
for all
using (public.is_owner())
with check (public.is_owner());

drop policy if exists repair_requests_owner_all on public.repair_requests;
create policy repair_requests_owner_all
on public.repair_requests
for all
using (public.is_owner())
with check (public.is_owner());

drop policy if exists repair_attachments_owner_all on public.repair_attachments;
create policy repair_attachments_owner_all
on public.repair_attachments
for all
using (public.is_owner())
with check (public.is_owner());

drop policy if exists repair_status_history_owner_all on public.repair_status_history;
create policy repair_status_history_owner_all
on public.repair_status_history
for all
using (public.is_owner())
with check (public.is_owner());

drop policy if exists contacts_owner_all on public.contacts;
create policy contacts_owner_all
on public.contacts
for all
using (public.is_owner())
with check (public.is_owner());

drop policy if exists journal_posts_owner_all on public.journal_posts;
create policy journal_posts_owner_all
on public.journal_posts
for all
using (public.is_owner())
with check (public.is_owner());

drop policy if exists site_settings_owner_all on public.site_settings;
create policy site_settings_owner_all
on public.site_settings
for all
using (public.is_owner())
with check (public.is_owner());

insert into storage.buckets (id, name, public)
values
  ('products', 'products', true),
  ('repairs', 'repairs', false),
  ('journal', 'journal', true),
  ('site', 'site', true)
on conflict (id) do nothing;

drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read
on storage.objects
for select
using (bucket_id in ('products', 'journal', 'site'));

drop policy if exists storage_owner_all on storage.objects;
create policy storage_owner_all
on storage.objects
for all
using (public.is_owner())
with check (public.is_owner());
