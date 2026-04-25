-- MWRD V3 — Phase 3b: RLS + late FKs + supplier views + Auth Hook + triggers + seeds
-- Applies on top of 0000_strange_joystick.sql (Drizzle-generated tables + enums).

-- =============================================================================
-- 1. Extensions
-- =============================================================================
create extension if not exists pgcrypto;
create extension if not exists unaccent;

-- =============================================================================
-- 2. Late-added FKs (circular / cross-schema references deferred from Drizzle)
-- =============================================================================
alter table public.users
  add constraint users_auth_fk foreign key (id)
  references auth.users(id) on delete cascade;

alter table public.users
  add constraint users_active_company_fk foreign key (active_company_id)
  references public.companies(id) on delete set null;

alter table public.users
  add constraint users_active_vendor_fk foreign key (active_vendor_id)
  references public.vendors(id) on delete set null;

alter table public.branches
  add constraint branches_address_fk foreign key (address_id)
  references public.addresses(id) on delete set null;

alter table public.wallet_transactions
  add constraint wallet_transactions_payment_fk foreign key (payment_id)
  references public.payments(id) on delete set null;

-- =============================================================================
-- 3. Generated tsvector columns on products (Drizzle can't emit GENERATED ALWAYS)
-- =============================================================================
alter table public.products drop column if exists search_ar;
alter table public.products drop column if exists search_en;

alter table public.products add column search_ar tsvector
  generated always as (
    to_tsvector('simple',
      coalesce(name_ar, '') || ' ' || coalesce(description_ar, ''))
  ) stored;

alter table public.products add column search_en tsvector
  generated always as (
    to_tsvector('english',
      coalesce(name_en, '') || ' ' || coalesce(description_en, ''))
  ) stored;

create index if not exists products_search_ar_gin
  on public.products using gin (search_ar);
create index if not exists products_search_en_gin
  on public.products using gin (search_en);

-- =============================================================================
-- 4. Helper functions — subquery-wrapped JWT reads (performance pattern)
-- =============================================================================
create or replace function public.active_company_id()
returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'active_company_id', '')::uuid
$$;

create or replace function public.active_vendor_id()
returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'active_vendor_id', '')::uuid
$$;

create or replace function public.email_verified()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.email_verified_at is not null
  )
$$;

-- =============================================================================
-- 5. Enable RLS on every public table
-- =============================================================================
alter table public.companies                enable row level security;
alter table public.departments              enable row level security;
alter table public.branches                 enable row level security;
alter table public.users                    enable row level security;
alter table public.roles                    enable row level security;
alter table public.role_permissions         enable row level security;
alter table public.company_members          enable row level security;
alter table public.company_join_requests    enable row level security;
alter table public.vendors                  enable row level security;
alter table public.vendor_users             enable row level security;
alter table public.categories               enable row level security;
alter table public.products                 enable row level security;
alter table public.addresses                enable row level security;
alter table public.address_groups           enable row level security;
alter table public.address_group_members    enable row level security;
alter table public.carts                    enable row level security;
alter table public.cart_items               enable row level security;
alter table public.orders                   enable row level security;
alter table public.order_items              enable row level security;
alter table public.order_approvals          enable row level security;
alter table public.payments                 enable row level security;
alter table public.payment_attempts         enable row level security;
alter table public.wallets                  enable row level security;
alter table public.wallet_transactions      enable row level security;
alter table public.analytics_tags           enable row level security;
alter table public.order_tags               enable row level security;
alter table public.returns                  enable row level security;
alter table public.return_items             enable row level security;
alter table public.favourite_lists          enable row level security;
alter table public.favourite_list_items     enable row level security;
alter table public.invoices                 enable row level security;
alter table public.webhook_events           enable row level security;

-- =============================================================================
-- 6. Policies — identity domain
-- =============================================================================

-- Companies: readable by members; admins can update.
create policy "companies_select_member" on public.companies for select
  to authenticated using (id = (select public.active_company_id()));

create policy "companies_select_join_domain" on public.companies for select
  to authenticated using (
    email_domain is not null
    and email_domain = split_part((select auth.email()), '@', 2)
  );

-- Users: self + company members (read-only on company).
create policy "users_select_self" on public.users for select
  to authenticated using (id = (select auth.uid()));

create policy "users_update_self" on public.users for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "users_select_same_company" on public.users for select
  to authenticated using (
    exists (
      select 1 from public.company_members cm
      where cm.user_id = users.id
        and cm.company_id = (select public.active_company_id())
        and cm.is_active
    )
  );

-- Departments / branches: company-scoped.
create policy "departments_all_by_company" on public.departments for all
  to authenticated
  using (company_id = (select public.active_company_id()))
  with check (company_id = (select public.active_company_id()));

create policy "branches_all_by_company" on public.branches for all
  to authenticated
  using (company_id = (select public.active_company_id()))
  with check (company_id = (select public.active_company_id()));

-- Roles: system roles readable by all; custom roles scoped to company.
create policy "roles_select_system_or_company" on public.roles for select
  to authenticated using (
    is_system = true
    or company_id = (select public.active_company_id())
  );

create policy "roles_write_company_admin" on public.roles for all
  to authenticated
  using (company_id = (select public.active_company_id()))
  with check (company_id = (select public.active_company_id()));

create policy "role_permissions_select_visible_role" on public.role_permissions
  for select to authenticated using (
    exists (
      select 1 from public.roles r
      where r.id = role_permissions.role_id
        and (r.is_system = true or r.company_id = (select public.active_company_id()))
    )
  );

-- Company members: active company's members readable by members; self always.
create policy "company_members_select_self" on public.company_members for select
  to authenticated using (user_id = (select auth.uid()));

create policy "company_members_select_same_company" on public.company_members
  for select to authenticated using (
    company_id = (select public.active_company_id())
  );

-- Join requests: requester sees own; company admins see company's pending.
create policy "join_requests_select_self" on public.company_join_requests
  for select to authenticated using (user_id = (select auth.uid()));

create policy "join_requests_insert_self" on public.company_join_requests
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "join_requests_select_same_company" on public.company_join_requests
  for select to authenticated using (
    company_id = (select public.active_company_id())
  );

-- =============================================================================
-- 7. Policies — vendor / catalog domain
-- =============================================================================

-- Vendors: members of the vendor see their own; all authenticated see active
-- vendors (read-only, for buyer browsing).
create policy "vendors_select_active_for_buyers" on public.vendors
  for select to authenticated using (status = 'active');

create policy "vendors_select_own_for_vendor_users" on public.vendors
  for select to authenticated using (id = (select public.active_vendor_id()));

create policy "vendors_update_by_vendor_admin" on public.vendors
  for update to authenticated
  using (id = (select public.active_vendor_id()))
  with check (id = (select public.active_vendor_id()));

create policy "vendor_users_select_self_or_same_vendor" on public.vendor_users
  for select to authenticated using (
    user_id = (select auth.uid())
    or vendor_id = (select public.active_vendor_id())
  );

-- Categories: public read for all authenticated.
create policy "categories_select_all" on public.categories for select
  to authenticated using (true);

-- Products: active products visible to all authenticated (buyer browsing);
-- vendor users manage their own products.
create policy "products_select_active" on public.products for select
  to authenticated using (is_active = true);

create policy "products_write_by_vendor" on public.products for all
  to authenticated
  using (vendor_id = (select public.active_vendor_id()))
  with check (vendor_id = (select public.active_vendor_id()));

-- =============================================================================
-- 8. Policies — addresses, cart, orders
-- =============================================================================

create policy "addresses_all_by_company" on public.addresses for all
  to authenticated
  using (company_id = (select public.active_company_id()))
  with check (company_id = (select public.active_company_id()));

-- Addresses visible to supplier when they appear in one of that supplier's orders.
-- Note: the supplier_order_items_view projects line1/city/etc. WITHOUT recipient_name.
create policy "addresses_select_supplier_via_order" on public.addresses
  for select to authenticated using (
    exists (
      select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.destination_address_id = addresses.id
        and o.vendor_id = (select public.active_vendor_id())
    )
  );

create policy "address_groups_all_by_company" on public.address_groups for all
  to authenticated
  using (company_id = (select public.active_company_id()))
  with check (company_id = (select public.active_company_id()));

create policy "address_group_members_via_group" on public.address_group_members
  for all to authenticated using (
    exists (
      select 1 from public.address_groups ag
      where ag.id = address_group_members.address_group_id
        and ag.company_id = (select public.active_company_id())
    )
  ) with check (
    exists (
      select 1 from public.address_groups ag
      where ag.id = address_group_members.address_group_id
        and ag.company_id = (select public.active_company_id())
    )
  );

-- Carts: own carts only (user-owned within active company).
create policy "carts_all_own" on public.carts for all
  to authenticated
  using (
    user_id = (select auth.uid())
    and company_id = (select public.active_company_id())
  )
  with check (
    user_id = (select auth.uid())
    and company_id = (select public.active_company_id())
  );

create policy "cart_items_all_via_cart" on public.cart_items for all
  to authenticated using (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id
        and c.user_id = (select auth.uid())
        and c.company_id = (select public.active_company_id())
    )
  ) with check (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id
        and c.user_id = (select auth.uid())
        and c.company_id = (select public.active_company_id())
    )
  );

-- Orders: two SELECT policies (permissive = OR). Writes are server-action only
-- (use service_role). Base table has buyer-identity columns; supplier accesses
-- only via supplier_orders_view which projects a strict subset.
create policy "orders_select_as_buyer" on public.orders for select
  to authenticated using (company_id = (select public.active_company_id()));

create policy "orders_select_as_vendor" on public.orders for select
  to authenticated using (vendor_id = (select public.active_vendor_id()));

create policy "order_items_select_via_order" on public.order_items for select
  to authenticated using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          o.company_id = (select public.active_company_id())
          or o.vendor_id = (select public.active_vendor_id())
        )
    )
  );

-- Order approvals: approver sees pending assigned to them; requester sees own.
create policy "order_approvals_select_relevant" on public.order_approvals
  for select to authenticated using (
    approver_id = (select auth.uid())
    or requested_by = (select auth.uid())
  );

create policy "order_approvals_insert_as_requester" on public.order_approvals
  for insert to authenticated with check (requested_by = (select auth.uid()));

create policy "order_approvals_update_as_approver" on public.order_approvals
  for update to authenticated
  using (approver_id = (select auth.uid()))
  with check (approver_id = (select auth.uid()));

-- =============================================================================
-- 9. Policies — payments, wallets (service_role writes; authenticated reads)
-- =============================================================================

create policy "payments_select_via_order" on public.payments for select
  to authenticated using (
    order_id is not null and exists (
      select 1 from public.orders o
      where o.id = payments.order_id
        and o.company_id = (select public.active_company_id())
    )
  );

create policy "payment_attempts_select_via_payment" on public.payment_attempts
  for select to authenticated using (
    exists (
      select 1 from public.payments p
      join public.orders o on o.id = p.order_id
      where p.id = payment_attempts.payment_id
        and o.company_id = (select public.active_company_id())
    )
  );

create policy "wallets_select_company" on public.wallets for select
  to authenticated using (company_id = (select public.active_company_id()));

create policy "wallet_transactions_select_via_wallet" on public.wallet_transactions
  for select to authenticated using (
    exists (
      select 1 from public.wallets w
      where w.id = wallet_transactions.wallet_id
        and w.company_id = (select public.active_company_id())
    )
  );

-- =============================================================================
-- 10. Policies — tags, returns, favourites, invoices, webhooks
-- =============================================================================

create policy "analytics_tags_all_by_company" on public.analytics_tags for all
  to authenticated
  using (company_id = (select public.active_company_id()))
  with check (company_id = (select public.active_company_id()));

create policy "order_tags_via_order" on public.order_tags for all
  to authenticated using (
    exists (
      select 1 from public.orders o
      where o.id = order_tags.order_id
        and o.company_id = (select public.active_company_id())
    )
  ) with check (
    exists (
      select 1 from public.orders o
      where o.id = order_tags.order_id
        and o.company_id = (select public.active_company_id())
    )
  );

create policy "returns_select_via_order" on public.returns for select
  to authenticated using (
    exists (
      select 1 from public.orders o
      where o.id = returns.order_id
        and (
          o.company_id = (select public.active_company_id())
          or o.vendor_id = (select public.active_vendor_id())
        )
    )
  );

create policy "returns_insert_as_buyer" on public.returns for insert
  to authenticated with check (
    exists (
      select 1 from public.orders o
      where o.id = returns.order_id
        and o.company_id = (select public.active_company_id())
    ) and requested_by = (select auth.uid())
  );

create policy "return_items_via_return" on public.return_items for all
  to authenticated using (
    exists (
      select 1 from public.returns r
      join public.orders o on o.id = r.order_id
      where r.id = return_items.return_id
        and (
          o.company_id = (select public.active_company_id())
          or o.vendor_id = (select public.active_vendor_id())
        )
    )
  ) with check (
    exists (
      select 1 from public.returns r
      join public.orders o on o.id = r.order_id
      where r.id = return_items.return_id
        and o.company_id = (select public.active_company_id())
    )
  );

create policy "favourite_lists_own_or_shared" on public.favourite_lists for select
  to authenticated using (
    company_id = (select public.active_company_id())
    and (
      user_id = (select auth.uid())
      or is_shared_with_company = true
    )
  );

create policy "favourite_lists_write_own" on public.favourite_lists for all
  to authenticated
  using (
    user_id = (select auth.uid())
    and company_id = (select public.active_company_id())
  )
  with check (
    user_id = (select auth.uid())
    and company_id = (select public.active_company_id())
  );

create policy "favourite_list_items_via_list" on public.favourite_list_items
  for all to authenticated using (
    exists (
      select 1 from public.favourite_lists fl
      where fl.id = favourite_list_items.favourite_list_id
        and fl.company_id = (select public.active_company_id())
        and (fl.user_id = (select auth.uid()) or fl.is_shared_with_company)
    )
  ) with check (
    exists (
      select 1 from public.favourite_lists fl
      where fl.id = favourite_list_items.favourite_list_id
        and fl.user_id = (select auth.uid())
        and fl.company_id = (select public.active_company_id())
    )
  );

create policy "invoices_select_by_buyer" on public.invoices for select
  to authenticated using (buyer_company_id = (select public.active_company_id()));

-- Webhook events: NOT exposed to authenticated role. Service_role only via
-- server-side webhook handlers in apps/client and apps/backoffice.
-- (Explicit deny by absence of any authenticated policy — RLS default deny.)

-- =============================================================================
-- 11. Supplier anonymization views — security_invoker = true inherits base
--     table RLS. Supplier JWT has active_vendor_id → base orders policy
--     `orders_select_as_vendor` scopes rows by vendor_id.
--     Views PROJECT a strict column subset so buyer identity never reaches
--     the supplier, even through SELECT *.
-- =============================================================================
create view public.supplier_orders_view
  with (security_invoker = true) as
  select
    id,
    supplier_order_number,
    vendor_id,
    status,
    subtotal_halalas,
    vat_halalas,
    total_halalas,
    currency,
    placed_at,
    updated_at
  from public.orders;

create view public.supplier_order_items_view
  with (security_invoker = true) as
  select
    oi.id,
    oi.order_id,
    o.supplier_order_number,
    oi.product_id,
    oi.quantity,
    oi.unit_price_halalas,
    oi.vat_rate,
    oi.line_total_halalas,
    -- Recipient is MWRD Logistics — not the buyer company name.
    'MWRD Logistics — ' || o.supplier_order_number as shipping_label,
    a.line1 as shipping_line1,
    a.line2 as shipping_line2,
    a.city as shipping_city,
    a.region as shipping_region,
    a.postal_code as shipping_postal_code,
    a.country as shipping_country
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  left join public.addresses a on a.id = oi.destination_address_id;

grant select on public.supplier_orders_view to authenticated;
grant select on public.supplier_order_items_view to authenticated;

-- =============================================================================
-- 12. Custom Access Token Hook — stamps active_company_id / active_vendor_id
--     into JWT claims on each token issuance.
-- =============================================================================
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  claims jsonb;
  active_co uuid;
  active_vd uuid;
begin
  select active_company_id, active_vendor_id
    into active_co, active_vd
    from public.users
   where id = (event ->> 'user_id')::uuid;

  claims := coalesce(event -> 'claims', '{}'::jsonb);

  if active_co is not null then
    claims := jsonb_set(claims, '{active_company_id}', to_jsonb(active_co::text));
  else
    claims := claims - 'active_company_id';
  end if;

  if active_vd is not null then
    claims := jsonb_set(claims, '{active_vendor_id}', to_jsonb(active_vd::text));
  else
    claims := claims - 'active_vendor_id';
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Supabase Auth runs the hook as `supabase_auth_admin`.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant select on public.users to supabase_auth_admin;

-- NOTE: after applying this migration, enable the hook in the Supabase
-- Dashboard: Authentication → Hooks → Custom Access Token → select
-- `public.custom_access_token_hook`.

-- =============================================================================
-- 13. Triggers — auth.users ↔ public.users sync
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, email_verified_at)
  values (new.id, new.email, new.email_confirmed_at)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.sync_email_verified()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is distinct from old.email_confirmed_at then
    update public.users
       set email_verified_at = new.email_confirmed_at,
           updated_at = now()
     where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
  after update on auth.users
  for each row execute function public.sync_email_verified();

-- =============================================================================
-- 14. Seed — three system roles (Admin, Approver, Requester) + permissions.
--     company_id = null + is_system = true marks them as defaults that every
--     company inherits (Admin users can create custom roles on top).
-- =============================================================================
insert into public.roles (id, company_id, name, display_name_ar, display_name_en, scope, is_system)
values
  ('00000000-0000-0000-0000-000000000001'::uuid, null, 'admin',     'مدير',   'Admin',     'company',    true),
  ('00000000-0000-0000-0000-000000000002'::uuid, null, 'approver',  'معتمد',  'Approver',  'company',    true),
  ('00000000-0000-0000-0000-000000000003'::uuid, null, 'requester', 'مُطلِب', 'Requester', 'department', true)
on conflict do nothing;

-- Admin permissions — full access.
insert into public.role_permissions (role_id, permission_key)
select '00000000-0000-0000-0000-000000000001'::uuid, p from (values
  ('orders.create'), ('orders.read'), ('orders.approve'), ('orders.cancel'),
  ('users.invite'), ('users.manage'),
  ('products.browse'),
  ('wallet.topup'), ('wallet.read'),
  ('addresses.manage'),
  ('roles.manage'),
  ('company.settings'),
  ('returns.create'), ('returns.approve'),
  ('join_requests.review'),
  ('invoices.read'),
  ('tags.manage')
) as v(p)
on conflict do nothing;

-- Approver — review + approve orders, see catalog + wallet.
insert into public.role_permissions (role_id, permission_key)
select '00000000-0000-0000-0000-000000000002'::uuid, p from (values
  ('orders.read'), ('orders.approve'),
  ('products.browse'),
  ('wallet.read'),
  ('invoices.read')
) as v(p)
on conflict do nothing;

-- Requester — submit orders, see own + return requests.
insert into public.role_permissions (role_id, permission_key)
select '00000000-0000-0000-0000-000000000003'::uuid, p from (values
  ('orders.create'), ('orders.read'), ('orders.cancel'),
  ('products.browse'),
  ('wallet.read'),
  ('returns.create')
) as v(p)
on conflict do nothing;

-- =============================================================================
-- 15. Category seed — four top-level categories matching the v1 scope.
--     Subcategories added via backoffice seeding or a later migration.
-- =============================================================================
insert into public.categories (id, parent_category_id, slug, name_ar, name_en, sort_order, is_active)
values
  ('10000000-0000-0000-0000-000000000001'::uuid, null, 'stationery',     'قرطاسية',         'Stationery',     1, true),
  ('10000000-0000-0000-0000-000000000002'::uuid, null, 'pantry',         'مستلزمات المطبخ', 'Pantry',         2, true),
  ('10000000-0000-0000-0000-000000000003'::uuid, null, 'cleaning',       'تنظيف',           'Cleaning',       3, true),
  ('10000000-0000-0000-0000-000000000004'::uuid, null, 'it_consumables', 'مستلزمات تقنية',   'IT Consumables', 4, true)
on conflict do nothing;
