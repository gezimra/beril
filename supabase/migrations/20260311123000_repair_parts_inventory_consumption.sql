alter table public.repair_parts_used
  add column if not exists inventory_item_id uuid references public.inventory_items(id) on delete set null;

create index if not exists idx_repair_parts_used_work_order
  on public.repair_parts_used(work_order_id, created_at desc);

create index if not exists idx_repair_parts_used_inventory_item
  on public.repair_parts_used(inventory_item_id, created_at desc);

create or replace function public.consume_inventory_for_work_order(
  p_work_order_id uuid,
  p_inventory_item_id uuid,
  p_quantity integer,
  p_unit_cost numeric default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_qty integer;
  v_default_unit_cost numeric(10,2);
  v_part_name text;
  v_usage_id uuid;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be a positive integer';
  end if;

  if not exists (
    select 1 from public.repair_work_orders where id = p_work_order_id
  ) then
    raise exception 'Work order not found';
  end if;

  select quantity_on_hand, unit_cost, name
  into v_current_qty, v_default_unit_cost, v_part_name
  from public.inventory_items
  where id = p_inventory_item_id
  for update;

  if not found then
    raise exception 'Inventory item not found';
  end if;

  if v_current_qty < p_quantity then
    raise exception 'Insufficient stock. Requested %, available %', p_quantity, v_current_qty;
  end if;

  update public.inventory_items
  set quantity_on_hand = quantity_on_hand - p_quantity
  where id = p_inventory_item_id;

  insert into public.repair_parts_used (
    work_order_id,
    inventory_item_id,
    part_name,
    quantity,
    unit_cost
  ) values (
    p_work_order_id,
    p_inventory_item_id,
    v_part_name,
    p_quantity,
    coalesce(p_unit_cost, v_default_unit_cost, 0)
  )
  returning id into v_usage_id;

  insert into public.stock_movements (
    product_id,
    inventory_item_id,
    movement_type,
    quantity_delta,
    unit_cost,
    reference_type,
    reference_id,
    note
  ) values (
    null,
    p_inventory_item_id,
    'repair_use',
    p_quantity * -1,
    coalesce(p_unit_cost, v_default_unit_cost, 0),
    'repair_work_order',
    p_work_order_id::text,
    coalesce(p_note, 'Part consumed in repair work order')
  );

  return v_usage_id;
end;
$$;

grant execute on function public.consume_inventory_for_work_order(uuid, uuid, integer, numeric, text)
to authenticated;
