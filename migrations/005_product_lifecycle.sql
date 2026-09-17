-- Owner must review existing policies first. Never run automatically.
begin;
alter table public.product add column if not exists visibility text not null default 'visible' check(visibility in ('visible','hidden'));
alter table public.product add column if not exists deleted_at timestamptz;
alter table public.product add column if not exists purge_started_at timestamptz;
drop policy if exists "public read product" on public.product;
create policy "public read product" on public.product for select using(visibility='visible' and deleted_at is null);
-- RLS policies are permissive: owner must audit any OTHER anonymous select policy.
-- Fail closed until 007 defines the admin-checked implementation and 010
-- completes restrictive authorization policies and grants execution atomically.
create or replace function public.product_lifecycle(p_id bigint,p_action text)
returns void language plpgsql security invoker set search_path=public as $$
begin
  raise exception 'Chưa hoàn tất cấu hình quyền Admin';
end $$;
revoke all on function public.product_lifecycle(bigint,text) from public,anon,authenticated;
commit;
