create or replace function public.format_enum_label(value text)
returns text
language sql
immutable
strict
as $$
  select initcap(replace(replace(value, '_', ' '), '-', ' '));
$$;

grant execute on function public.format_enum_label(text) to anon, authenticated, service_role;
