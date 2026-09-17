-- Owner must review existing policies first. Never run automatically.
begin;
alter table public.product add column if not exists visibility text not null default 'visible' check(visibility in ('visible','hidden'));
alter table public.product add column if not exists deleted_at timestamptz;
alter table public.product add column if not exists purge_started_at timestamptz;
drop policy if exists "public read product" on public.product;
create policy "public read product" on public.product for select using(visibility='visible' and deleted_at is null);
-- RLS policies are permissive: owner must audit any OTHER anonymous select policy.
create or replace function public.product_lifecycle(p_id bigint,p_action text)
returns void language plpgsql security invoker set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Cần đăng nhập'; end if;
  if p_action='trash' then
    update public.product set deleted_at=now() where id=p_id and deleted_at is null;
  elsif p_action='restore' then
    update public.product set deleted_at=null where id=p_id and deleted_at>now()-interval '14 days' and purge_started_at is null;
  elsif p_action='hide' or p_action='show' then
    update public.product set visibility=case when p_action='hide' then 'hidden' else 'visible' end where id=p_id and deleted_at is null;
  else raise exception 'Thao tác không hợp lệ'; end if;
  if not found then raise exception 'Sản phẩm đã thay đổi hoặc quá hạn khôi phục'; end if;
end $$;
revoke all on function public.product_lifecycle(bigint,text) from public,anon;
grant execute on function public.product_lifecycle(bigint,text) to authenticated;
commit;
