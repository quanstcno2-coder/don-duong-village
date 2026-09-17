-- Run only AFTER inserting owner UUID into ddv_admin_users via SQL Editor.
-- Audit existing permissive policies too. Restrictive policies compose with them.
begin;
do $$ declare tbl text; begin
 foreach tbl in array array['product','product_images','web_orders','web_order_items','posts','page_sections','site_settings','about_blocks'] loop
   execute format('alter table public.%I enable row level security',tbl);
   execute format('drop policy if exists "ddv admin restriction" on public.%I',tbl);
   execute format('create policy "ddv admin restriction" on public.%I as restrictive for all to authenticated using(public.ddv_is_admin()) with check(public.ddv_is_admin())',tbl);
 end loop;
end $$;
-- Permanent deletion uses the owner-reviewed purge path, after R2 deletion.
create policy "ddv prevent direct product delete" on public.product as restrictive for delete to authenticated using(false);
create policy "ddv private order read" on public.web_orders as restrictive for select to anon using(false);
create policy "ddv private item read" on public.web_order_items as restrictive for select to anon using(false);
create policy "ddv visible images only" on public.product_images as restrictive for select to anon using(exists(select 1 from public.product p where p.id=product_id and p.visibility='visible' and p.deleted_at is null));
drop policy if exists "ddv public image read" on public.product_images;
create policy "ddv public image read" on public.product_images for select to anon using(exists(select 1 from public.product p where p.id=product_id and p.visibility='visible' and p.deleted_at is null));
drop policy if exists "ddv admin image manage" on public.product_images;
create policy "ddv admin image manage" on public.product_images for all to authenticated using(public.ddv_is_admin()) with check(public.ddv_is_admin());
-- Existing Supabase storage uploads for site/post media also require Admin.
create policy "ddv storage admin insert" on storage.objects as restrictive for insert to authenticated with check(public.ddv_is_admin());
create policy "ddv storage admin update" on storage.objects as restrictive for update to authenticated using(public.ddv_is_admin()) with check(public.ddv_is_admin());
create policy "ddv storage admin delete" on storage.objects as restrictive for delete to authenticated using(public.ddv_is_admin());
commit;
