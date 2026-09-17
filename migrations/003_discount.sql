-- Owner review required; do not execute automatically.
begin;
alter table public.product add column if not exists discount_percent numeric not null default 0;
alter table public.product drop constraint if exists product_discount_percent_range;
alter table public.product add constraint product_discount_percent_range check(discount_percent between 0 and 100);
commit;
