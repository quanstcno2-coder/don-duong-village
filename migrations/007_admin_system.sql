-- OWNER REVIEW. Insert owner auth UUID manually into ddv_admin_users after this.
-- No password or privileged API key is required in this file.
begin;
create table if not exists public.ddv_admin_users(user_id uuid primary key references auth.users(id));
alter table public.ddv_admin_users enable row level security;
revoke all on public.ddv_admin_users from anon,authenticated;
create or replace function public.ddv_is_admin() returns boolean
language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.ddv_admin_users where user_id=auth.uid())
$$;
revoke all on function public.ddv_is_admin() from public;
grant execute on function public.ddv_is_admin() to authenticated;
-- SECURITY INVOKER retains product RLS; explicit Admin check fails closed even
-- if older permissive policies still exist. 010 alone enables this RPC.
create or replace function public.product_lifecycle(p_id bigint,p_action text)
returns void language plpgsql security invoker set search_path=public as $$
begin
  if public.ddv_is_admin() is distinct from true then raise exception 'Không có quyền Admin'; end if;
  if p_action='trash' then
    update public.product set deleted_at=now() where id=p_id and deleted_at is null;
  elsif p_action='restore' then
    update public.product set deleted_at=null where id=p_id and deleted_at>now()-interval '14 days' and purge_started_at is null;
  elsif p_action='hide' or p_action='show' then
    update public.product set visibility=case when p_action='hide' then 'hidden' else 'visible' end where id=p_id and deleted_at is null;
  else raise exception 'Thao tác không hợp lệ'; end if;
  if not found then raise exception 'Sản phẩm đã thay đổi hoặc quá hạn khôi phục'; end if;
end $$;
revoke all on function public.product_lifecycle(bigint,text) from public,anon,authenticated;
create or replace function public.ddv_system_stats() returns jsonb
language plpgsql security definer set search_path=public as $$
begin
 if not public.ddv_is_admin() then raise exception 'Không có quyền Admin'; end if;
 return jsonb_build_object('database_bytes',pg_database_size(current_database()));
end $$;
create or replace function public.expired_product_trash() returns jsonb
language plpgsql security definer set search_path=public as $$
begin
 if not public.ddv_is_admin() then raise exception 'Không có quyền Admin'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'deleted_at',deleted_at)) from public.product where deleted_at<=now()-interval '14 days'),'[]'::jsonb);
end $$;
create or replace function public.claim_product_purge(p_id bigint) returns jsonb
language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
 if not public.ddv_is_admin() then raise exception 'Không có quyền Admin'; end if;
 perform 1 from public.product where id=p_id and deleted_at<=now()-interval '14 days' for update;
 if not found then return null; end if;
 update public.product set purge_started_at=now() where id=p_id and purge_started_at is null;
 select jsonb_build_object('keys',coalesce(jsonb_agg(image_key) filter(where image_key is not null),'[]'::jsonb)) into result from public.product_images where product_id=p_id;
 return result;
end $$;
create or replace function public.product_image_key_shared(p_id bigint,p_key text) returns boolean
language plpgsql security definer set search_path=public as $$
begin
 if not public.ddv_is_admin() then raise exception 'Không có quyền Admin'; end if;
 return exists(select 1 from public.product_images where image_key=p_key and product_id<>p_id);
end $$;
create or replace function public.finish_product_purge(p_id bigint) returns void
language plpgsql security definer set search_path=public as $$
begin
 if not public.ddv_is_admin() then raise exception 'Không có quyền Admin'; end if;
 perform 1 from public.product where id=p_id and deleted_at<=now()-interval '14 days' and purge_started_at is not null for update;
 if not found then raise exception 'Không đủ điều kiện xóa'; end if;
 delete from public.product_images where product_id=p_id;
 delete from public.product where id=p_id;
end $$;
-- Prevent changing gallery or restoring a product while its R2 cleanup is running.
create or replace function public.ddv_guard_purge() returns trigger
language plpgsql set search_path=public as $$
declare target_id bigint;
begin
 if tg_table_name='product' then
   if old.purge_started_at is not null then raise exception 'Đang dọn dữ liệu sản phẩm'; end if;
 else
   if tg_op='UPDATE' then
     perform 1 from public.product where id=old.product_id for update;
     if exists(select 1 from public.product where id=old.product_id and purge_started_at is not null) then raise exception 'Đang dọn ảnh sản phẩm'; end if;
   end if;
   target_id:=case when tg_op='DELETE' then old.product_id else new.product_id end;
   perform 1 from public.product where id=target_id for update;
   if exists(select 1 from public.product where id=target_id and purge_started_at is not null) then
     -- Only authorized security-definer purge may remove claimed image rows.
     if tg_op<>'DELETE' or current_user= 'authenticated' then raise exception 'Đang dọn ảnh sản phẩm'; end if;
   end if;
 end if;
 if tg_op='DELETE' then return old; end if;return new;
end $$;
drop trigger if exists ddv_product_purge_guard on public.product;
create trigger ddv_product_purge_guard before update on public.product for each row execute function public.ddv_guard_purge();
drop trigger if exists ddv_image_purge_guard on public.product_images;
create trigger ddv_image_purge_guard before insert or update or delete on public.product_images for each row execute function public.ddv_guard_purge();
revoke all on function public.ddv_system_stats(),public.expired_product_trash(),public.claim_product_purge(bigint),public.product_image_key_shared(bigint,text),public.finish_product_purge(bigint) from public,anon;
grant execute on function public.ddv_system_stats(),public.expired_product_trash(),public.claim_product_purge(bigint),public.product_image_key_shared(bigint,text),public.finish_product_purge(bigint) to authenticated;
commit;
