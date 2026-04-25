-- Local-dev seed. Runs after migrations during `supabase start`/`supabase db reset`.
-- Adds one active vendor + a small product catalog so the buyer portal renders
-- something on first sign-up. Idempotent — safe to re-run.

-- Vendor — display name appears under each product card on the catalog.
insert into public.vendors (
  id, legal_name_ar, legal_name_en, display_name_ar, display_name_en,
  cr_number, contact_email, contact_phone, status, cr_verified_at
) values (
  'a0000000-0000-0000-0000-000000000001',
  'مكتب ديبو السعودية', 'Office Depot Saudi',
  'مكتب ديبو', 'Office Depot',
  '1010101010', 'sales@office-depot.example', '+966500000001',
  'active', now()
) on conflict (id) do nothing;

-- Products. Categories were seeded by migration 0001:
--   stationery     10000000-0000-0000-0000-000000000001
--   pantry         10000000-0000-0000-0000-000000000002
--   cleaning       10000000-0000-0000-0000-000000000003
--   it_consumables 10000000-0000-0000-0000-000000000004
insert into public.products (
  id, vendor_id, category_id, sku, name_ar, name_en,
  description_ar, description_en, unit_ar, unit_en,
  price_halalas, vat_rate, min_order_qty, stock_on_hand, is_active
) values
  ('b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001',
   'STA-A4-500', 'ورق طباعة A4 — 500 ورقة', 'A4 Printer Paper — 500 sheets',
   'ورق طباعة عالي الجودة 80 جرام.', 'High-quality 80gsm printer paper.',
   'علبة', 'Ream', 1500, 0.1500, 1, 240, true),
  ('b0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001',
   'STA-PEN-BLU-12', 'أقلام جاف أزرق — علبة 12', 'Ballpoint Pens Blue — Box of 12',
   null, 'Smooth-write 0.7mm tip ballpoint pens.',
   'علبة', 'Box', 1800, 0.1500, 1, 120, true),
  ('b0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001',
   'STA-NB-A5', 'دفتر ملاحظات A5', 'A5 Notebook',
   null, 'Spiral-bound 200-page A5 notebook.',
   'قطعة', 'Each', 1200, 0.1500, 1, 80, true),
  ('b0000000-0000-0000-0000-000000000010',
   'a0000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000002',
   'PAN-COFFEE-1KG', 'قهوة عربية — 1 كجم', 'Arabic Coffee — 1kg',
   null, 'Lightly roasted Arabic coffee beans.',
   'كيس', 'Bag', 8500, 0.1500, 1, 60, true),
  ('b0000000-0000-0000-0000-000000000011',
   'a0000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000002',
   'PAN-WATER-500ML-24', 'مياه معدنية 500 مل — 24 عبوة', 'Bottled Water 500ml — Pack of 24',
   null, 'Case of 24 × 500ml bottles.',
   'كرتون', 'Case', 2200, 0.1500, 1, 200, true),
  ('b0000000-0000-0000-0000-000000000020',
   'a0000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000003',
   'CLN-DISH-5L', 'سائل جلي — 5 لتر', 'Dish Soap — 5L',
   null, 'Concentrated dish soap.',
   'عبوة', 'Bottle', 4500, 0.1500, 1, 50, true),
  ('b0000000-0000-0000-0000-000000000021',
   'a0000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000003',
   'CLN-WIPES-100', 'مناديل تنظيف — 100 منديل', 'Cleaning Wipes — 100 pack',
   null, 'Multi-surface disinfecting wipes.',
   'علبة', 'Pack', 1900, 0.1500, 1, 100, true),
  ('b0000000-0000-0000-0000-000000000030',
   'a0000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000004',
   'IT-USB-32GB', 'فلاش USB 32 جيجا', 'USB Flash Drive — 32GB',
   null, 'USB-A 3.0, 32GB, plug-and-play.',
   'قطعة', 'Each', 3500, 0.1500, 1, 80, true),
  ('b0000000-0000-0000-0000-000000000031',
   'a0000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000004',
   'IT-MOUSE-WL', 'فأرة لاسلكية', 'Wireless Mouse',
   null, 'Wireless mouse with USB receiver.',
   'قطعة', 'Each', 5500, 0.1500, 1, 40, true)
on conflict (id) do nothing;

-- Convenience helper for local dev: bind the currently-signed-up email to
-- the seeded vendor as an admin, so the supplier portal has data on `/ar`.
--
-- Usage from psql or Supabase Studio SQL editor:
--   select public.dev_bind_supplier('you@example.com');
--
-- Re-runs are no-ops. Lives in `public` for ergonomic CLI use; safe in dev only.
create or replace function public.dev_bind_supplier(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_vendor_id uuid := 'a0000000-0000-0000-0000-000000000001';
begin
  select id into v_user_id from auth.users where email = p_email;
  if v_user_id is null then
    raise exception 'no auth user with email %', p_email;
  end if;

  insert into public.vendor_users (user_id, vendor_id, role, is_active)
  values (v_user_id, v_vendor_id, 'admin', true)
  on conflict do nothing;

  update public.users
     set active_vendor_id = v_vendor_id,
         updated_at = now()
   where id = v_user_id;
end;
$$;

revoke execute on function public.dev_bind_supplier(text) from public, authenticated, anon;
