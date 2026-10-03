-- Mini Crumbs — schema changes for: prep duration + toppings
-- Run this once in the hosted Supabase project (SQL editor). Not auto-applied.
-- Safe to re-run (idempotent guards).

-- ---------------------------------------------------------------------------
-- 1. Products: preparation lead time + per-product toppings toggle
-- ---------------------------------------------------------------------------

-- Stored as an assembled label, e.g. "45 Minutes" / "2 Hours". NULL = not set.
alter table products add column if not exists prep_duration text;

-- When true, the storefront checkout shows a "Toppings" step for this product's cart lines.
alter table products add column if not exists toppings_enabled boolean not null default false;

-- ---------------------------------------------------------------------------
-- 2. Toppings master list (stock = remaining quantity available)
-- ---------------------------------------------------------------------------

create table if not exists toppings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null default 0,
  stock integer not null default 0,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

alter table toppings enable row level security;

-- NOTE: match these to whatever the existing `products` table policies use.
-- Baseline: public (anon) can read, only authenticated admins can write.
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'toppings' and policyname = 'toppings public read') then
    create policy "toppings public read" on toppings for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'toppings' and policyname = 'toppings admin write') then
    create policy "toppings admin write" on toppings for all
      to authenticated using (true) with check (true);
  end if;
end $$;

grant select on toppings to anon, authenticated;
grant insert, update, delete on toppings to authenticated;

-- ---------------------------------------------------------------------------
-- 3. consume_toppings — decrement topping stock at checkout
-- ---------------------------------------------------------------------------
-- The storefront runs as anon, so this is security definer (runs past RLS).
-- p_toppings is a JSON array of { id, quantity }. Stock is clamped at 0.

create or replace function consume_toppings(p_toppings jsonb)
returns void
language plpgsql
security definer
as $$
declare
  rec record;
begin
  for rec in
    select (value->>'id')::uuid as id, coalesce((value->>'quantity')::int, 0) as qty
    from jsonb_array_elements(coalesce(p_toppings, '[]'::jsonb))
  loop
    if rec.qty > 0 then
      update toppings set stock = greatest(0, stock - rec.qty) where id = rec.id;
    end if;
  end loop;
end;
$$;

grant execute on function consume_toppings(jsonb) to anon, authenticated;
