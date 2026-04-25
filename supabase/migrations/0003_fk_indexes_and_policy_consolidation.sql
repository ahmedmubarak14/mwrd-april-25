-- Advisor hardening: add indexes on every FK column + collapse duplicate
-- permissive SELECT policies into single OR-policies for query performance.

-- ============================================================================
-- FK indexes
-- ============================================================================
create index if not exists address_group_members_address_idx on public.address_group_members (address_id);
create index if not exists address_groups_company_idx on public.address_groups (company_id);
create index if not exists addresses_company_idx on public.addresses (company_id);
create index if not exists analytics_tags_created_by_idx on public.analytics_tags (created_by);
create index if not exists branches_department_idx on public.branches (department_id);
create index if not exists branches_address_idx on public.branches (address_id);
create index if not exists cart_items_product_idx on public.cart_items (product_id);
create index if not exists cart_items_destination_idx on public.cart_items (destination_address_id);
create index if not exists carts_company_idx on public.carts (company_id);
create index if not exists carts_vendor_idx on public.carts (vendor_id);
create index if not exists company_join_requests_reviewed_by_idx on public.company_join_requests (reviewed_by);
create index if not exists company_members_department_idx on public.company_members (department_id);
create index if not exists company_members_role_idx on public.company_members (role_id);
create index if not exists company_members_invited_by_idx on public.company_members (invited_by);
create index if not exists departments_parent_idx on public.departments (parent_department_id);
create index if not exists favourite_list_items_product_idx on public.favourite_list_items (product_id);
create index if not exists order_approvals_requested_by_idx on public.order_approvals (requested_by);
create index if not exists order_items_product_idx on public.order_items (product_id);
create index if not exists order_items_destination_idx on public.order_items (destination_address_id);
create index if not exists order_tags_tag_idx on public.order_tags (tag_id);
create index if not exists orders_requested_by_idx on public.orders (requested_by);
create index if not exists orders_approved_by_idx on public.orders (approved_by);
create index if not exists payments_wallet_idx on public.payments (wallet_id);
create index if not exists return_items_order_item_idx on public.return_items (order_item_id);
create index if not exists returns_requested_by_idx on public.returns (requested_by);
create index if not exists returns_decided_by_idx on public.returns (decided_by);
create index if not exists users_active_company_idx on public.users (active_company_id);
create index if not exists users_active_vendor_idx on public.users (active_vendor_id);
create index if not exists vendor_users_vendor_idx on public.vendor_users (vendor_id);
create index if not exists wallet_transactions_created_by_idx on public.wallet_transactions (created_by);
create index if not exists webhook_events_related_payment_idx on public.webhook_events (related_payment_id);
create index if not exists webhook_events_related_order_idx on public.webhook_events (related_order_id);

-- ============================================================================
-- Collapse duplicate permissive SELECT policies
-- ============================================================================

-- companies: member OR same-domain prospect
drop policy if exists companies_select_member on public.companies;
drop policy if exists companies_select_join_domain on public.companies;
create policy companies_select on public.companies for select to authenticated using (
  id = (select public.active_company_id())
  or (
    email_domain is not null
    and email_domain = split_part((select auth.email()), '@', 2)
  )
);

-- users: self OR same-active-company member
drop policy if exists users_select_self on public.users;
drop policy if exists users_select_same_company on public.users;
create policy users_select on public.users for select to authenticated using (
  id = (select auth.uid())
  or exists (
    select 1 from public.company_members cm
    where cm.user_id = users.id
      and cm.company_id = (select public.active_company_id())
      and cm.is_active
  )
);

-- company_members: self OR same active company
drop policy if exists company_members_select_self on public.company_members;
drop policy if exists company_members_select_same_company on public.company_members;
create policy company_members_select on public.company_members for select to authenticated using (
  user_id = (select auth.uid())
  or company_id = (select public.active_company_id())
);

-- company_join_requests: requester OR admins of target company
drop policy if exists join_requests_select_self on public.company_join_requests;
drop policy if exists join_requests_select_same_company on public.company_join_requests;
create policy join_requests_select on public.company_join_requests for select to authenticated using (
  user_id = (select auth.uid())
  or company_id = (select public.active_company_id())
);

-- orders: buyer scope OR vendor scope
drop policy if exists orders_select_as_buyer on public.orders;
drop policy if exists orders_select_as_vendor on public.orders;
create policy orders_select on public.orders for select to authenticated using (
  company_id = (select public.active_company_id())
  or vendor_id = (select public.active_vendor_id())
);

-- addresses: company owner OR supplier via order-item
drop policy if exists addresses_all_by_company on public.addresses;
drop policy if exists addresses_select_supplier_via_order on public.addresses;
create policy addresses_select on public.addresses for select to authenticated using (
  company_id = (select public.active_company_id())
  or exists (
    select 1 from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.destination_address_id = addresses.id
      and o.vendor_id = (select public.active_vendor_id())
  )
);
create policy addresses_insert_by_company on public.addresses for insert to authenticated
  with check (company_id = (select public.active_company_id()));
create policy addresses_update_by_company on public.addresses for update to authenticated
  using (company_id = (select public.active_company_id()))
  with check (company_id = (select public.active_company_id()));
create policy addresses_delete_by_company on public.addresses for delete to authenticated
  using (company_id = (select public.active_company_id()));

-- roles: system or own company readable; writes are company-scoped non-system
drop policy if exists roles_select_system_or_company on public.roles;
drop policy if exists roles_write_company_admin on public.roles;
create policy roles_select on public.roles for select to authenticated using (
  is_system = true
  or company_id = (select public.active_company_id())
);
create policy roles_insert_company on public.roles for insert to authenticated
  with check (company_id = (select public.active_company_id()) and is_system = false);
create policy roles_update_company on public.roles for update to authenticated
  using (company_id = (select public.active_company_id()) and is_system = false)
  with check (company_id = (select public.active_company_id()) and is_system = false);
create policy roles_delete_company on public.roles for delete to authenticated
  using (company_id = (select public.active_company_id()) and is_system = false);

-- vendors: active (public browse) OR own vendor
drop policy if exists vendors_select_active_for_buyers on public.vendors;
drop policy if exists vendors_select_own_for_vendor_users on public.vendors;
create policy vendors_select on public.vendors for select to authenticated using (
  status = 'active'
  or id = (select public.active_vendor_id())
);

-- products: active (public browse) OR own vendor; vendor-scoped writes
drop policy if exists products_select_active on public.products;
drop policy if exists products_write_by_vendor on public.products;
create policy products_select on public.products for select to authenticated using (
  is_active = true
  or vendor_id = (select public.active_vendor_id())
);
create policy products_insert_by_vendor on public.products for insert to authenticated
  with check (vendor_id = (select public.active_vendor_id()));
create policy products_update_by_vendor on public.products for update to authenticated
  using (vendor_id = (select public.active_vendor_id()))
  with check (vendor_id = (select public.active_vendor_id()));
create policy products_delete_by_vendor on public.products for delete to authenticated
  using (vendor_id = (select public.active_vendor_id()));

-- favourite_lists: own-or-shared read, own-only writes
drop policy if exists favourite_lists_own_or_shared on public.favourite_lists;
drop policy if exists favourite_lists_write_own on public.favourite_lists;
create policy favourite_lists_select on public.favourite_lists for select to authenticated using (
  company_id = (select public.active_company_id())
  and (user_id = (select auth.uid()) or is_shared_with_company = true)
);
create policy favourite_lists_insert_own on public.favourite_lists for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and company_id = (select public.active_company_id())
  );
create policy favourite_lists_update_own on public.favourite_lists for update to authenticated
  using (
    user_id = (select auth.uid())
    and company_id = (select public.active_company_id())
  )
  with check (
    user_id = (select auth.uid())
    and company_id = (select public.active_company_id())
  );
create policy favourite_lists_delete_own on public.favourite_lists for delete to authenticated
  using (
    user_id = (select auth.uid())
    and company_id = (select public.active_company_id())
  );
