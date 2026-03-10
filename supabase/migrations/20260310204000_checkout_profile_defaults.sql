alter table public.customer_profiles
  add column if not exists default_city text,
  add column if not exists default_address text,
  add column if not exists default_country text not null default 'Kosovo';

alter table public.orders
  add column if not exists country text not null default 'Kosovo';

create index if not exists idx_customer_profiles_default_country
  on public.customer_profiles(default_country);
