-- Hero slides carousel for the homepage

do $$
begin
  create type hero_slide_type as enum ('content', 'image', 'video', 'product_spotlight');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type hero_slide_status as enum ('draft', 'active', 'archived');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  slide_type hero_slide_type not null default 'content',
  status hero_slide_status not null default 'draft',
  sort_order integer not null default 0,
  headline text,
  subheadline text,
  cta_label text,
  cta_href text,
  secondary_cta_label text,
  secondary_cta_href text,
  background_image_url text,
  background_image_alt text,
  video_url text,
  video_poster_url text,
  product_id uuid references public.products(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hero_slides_status_sort on public.hero_slides (status, sort_order);

-- Auto-update updated_at timestamp
create or replace function public.update_hero_slides_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists hero_slides_updated_at on public.hero_slides;
create trigger hero_slides_updated_at
  before update on public.hero_slides
  for each row execute function public.update_hero_slides_updated_at();

-- RLS: public can read active slides, admin (service_role) bypasses RLS
alter table public.hero_slides enable row level security;

drop policy if exists hero_slides_select_active on public.hero_slides;
create policy hero_slides_select_active
on public.hero_slides
for select
using (status = 'active');

-- Storage bucket for hero slide images
insert into storage.buckets (id, name, public)
values ('hero-slides', 'hero-slides', true)
on conflict (id) do nothing;

drop policy if exists hero_slides_storage_public_read on storage.objects;
create policy hero_slides_storage_public_read
on storage.objects
for select
using (bucket_id = 'hero-slides');
