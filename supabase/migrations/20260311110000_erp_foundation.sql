do $$
begin
  create type inventory_item_type as enum (
    'part',
    'battery',
    'strap',
    'bracelet',
    'crystal',
    'tool',
    'consumable',
    'other'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type cash_entry_type as enum ('inflow', 'outflow');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  item_type inventory_item_type not null default 'part',
  brand text,
  model text,
  caliber text,
  quantity_on_hand integer not null default 0,
  reorder_level integer not null default 0,
  unit_cost numeric(10,2),
  unit_price numeric(10,2),
  location text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (quantity_on_hand >= 0),
  check (reorder_level >= 0)
);

drop trigger if exists trg_inventory_items_updated_at on public.inventory_items;
create trigger trg_inventory_items_updated_at
before update on public.inventory_items
for each row
execute function public.set_updated_at();

create table if not exists public.cashbook_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  entry_type cash_entry_type not null,
  amount numeric(10,2) not null check (amount > 0),
  category text not null default 'general',
  payment_method payment_method not null default 'cash_on_delivery',
  note text,
  reference_type text,
  reference_id text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_cashbook_entries_entry_date
  on public.cashbook_entries(entry_date desc);

alter table public.stock_movements
  add column if not exists inventory_item_id uuid references public.inventory_items(id) on delete set null;

create index if not exists idx_stock_movements_inventory_item_id
  on public.stock_movements(inventory_item_id);

create table if not exists public.watch_brands (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  country text,
  website text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_watch_brands_updated_at on public.watch_brands;
create trigger trg_watch_brands_updated_at
before update on public.watch_brands
for each row
execute function public.set_updated_at();

create table if not exists public.watch_calibers (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.watch_brands(id) on delete set null,
  caliber_name text not null,
  movement_type text not null,
  power_reserve_hours numeric(6,2),
  frequency_bph integer,
  jewels integer,
  diameter_mm numeric(6,2),
  height_mm numeric(6,2),
  has_hacking boolean,
  has_hand_winding boolean,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (brand_id, caliber_name)
);

drop trigger if exists trg_watch_calibers_updated_at on public.watch_calibers;
create trigger trg_watch_calibers_updated_at
before update on public.watch_calibers
for each row
execute function public.set_updated_at();

create table if not exists public.watch_models (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.watch_brands(id) on delete cascade,
  model_name text not null,
  collection text,
  target_gender text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (brand_id, model_name)
);

drop trigger if exists trg_watch_models_updated_at on public.watch_models;
create trigger trg_watch_models_updated_at
before update on public.watch_models
for each row
execute function public.set_updated_at();

create table if not exists public.watch_references (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.watch_models(id) on delete cascade,
  reference_code text unique not null,
  caliber_id uuid references public.watch_calibers(id) on delete set null,
  case_size_mm numeric(6,2),
  lug_width_mm numeric(6,2),
  water_resistance_m integer,
  crystal text,
  case_material text,
  dial_color text,
  strap_type text,
  production_from_year integer,
  production_to_year integer,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_watch_references_updated_at on public.watch_references;
create trigger trg_watch_references_updated_at
before update on public.watch_references
for each row
execute function public.set_updated_at();

create table if not exists public.inventory_item_compatibility (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  caliber_id uuid references public.watch_calibers(id) on delete cascade,
  model_id uuid references public.watch_models(id) on delete cascade,
  reference_id uuid references public.watch_references(id) on delete cascade,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  check (
    caliber_id is not null
    or model_id is not null
    or reference_id is not null
  )
);

create index if not exists idx_inventory_item_compat_inventory_item
  on public.inventory_item_compatibility(inventory_item_id);

alter table public.inventory_items enable row level security;
alter table public.cashbook_entries enable row level security;
alter table public.watch_brands enable row level security;
alter table public.watch_calibers enable row level security;
alter table public.watch_models enable row level security;
alter table public.watch_references enable row level security;
alter table public.inventory_item_compatibility enable row level security;

drop policy if exists inventory_items_owner_all on public.inventory_items;
create policy inventory_items_owner_all
on public.inventory_items
for all
using (public.is_owner())
with check (public.is_owner());

drop policy if exists cashbook_entries_owner_all on public.cashbook_entries;
create policy cashbook_entries_owner_all
on public.cashbook_entries
for all
using (public.is_owner())
with check (public.is_owner());

drop policy if exists watch_brands_owner_all on public.watch_brands;
create policy watch_brands_owner_all
on public.watch_brands
for all
using (public.is_owner())
with check (public.is_owner());

drop policy if exists watch_calibers_owner_all on public.watch_calibers;
create policy watch_calibers_owner_all
on public.watch_calibers
for all
using (public.is_owner())
with check (public.is_owner());

drop policy if exists watch_models_owner_all on public.watch_models;
create policy watch_models_owner_all
on public.watch_models
for all
using (public.is_owner())
with check (public.is_owner());

drop policy if exists watch_references_owner_all on public.watch_references;
create policy watch_references_owner_all
on public.watch_references
for all
using (public.is_owner())
with check (public.is_owner());

drop policy if exists inventory_item_compatibility_owner_all on public.inventory_item_compatibility;
create policy inventory_item_compatibility_owner_all
on public.inventory_item_compatibility
for all
using (public.is_owner())
with check (public.is_owner());
