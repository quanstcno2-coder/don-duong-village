-- Owner review. Atomic checkout, with prices calculated from DB, not browser.
begin;
create or replace function public.ddv_checkout(p_customer jsonb,p_items jsonb) returns bigint
language plpgsql security definer set search_path=public as $$
declare item jsonb; p public.product%rowtype; qty integer; unit numeric; total_price numeric:=0; order_id bigint; seen bigint[]:='{}';
begin
 if p_items is null or jsonb_typeof(p_items)<>'array' then raise exception 'Giỏ hàng không hợp lệ'; end if;
 if jsonb_array_length(p_items) not between 1 and 100 then raise exception 'Giỏ hàng không hợp lệ'; end if;
 if length(trim(coalesce(p_customer->>'customer_name',''))) not between 1 and 200 or length(trim(coalesce(p_customer->>'phone',''))) not between 5 and 30 or length(trim(coalesce(p_customer->>'address',''))) not between 1 and 1000 then raise exception 'Thông tin nhận hàng chưa hợp lệ'; end if;
 -- All operations roll back on any invalid line. Lock catalog rows for consistency.
 for item in select value from jsonb_array_elements(p_items) order by (value->>'id')::bigint loop
   qty:=(item->>'qty')::integer;
   if qty is null or qty not between 1 and 1000 then raise exception 'Số lượng không hợp lệ'; end if;
   if (item->>'id')::bigint=any(seen) then raise exception 'Sản phẩm bị trùng'; end if;
   seen:=array_append(seen,(item->>'id')::bigint);
   select * into p from public.product where id=(item->>'id')::bigint and visibility='visible' and deleted_at is null for share;
   if not found or coalesce(p.stock,0)<qty or coalesce(p.price,-1)<0 then raise exception 'Sản phẩm không còn bán hoặc không đủ số lượng'; end if;
   unit:=round(p.price*(100-p.discount_percent)/100);
   total_price:=total_price+unit*qty;
 end loop;
 insert into public.web_orders(customer_name,phone,email,address,note,subtotal,shipping_fee,total,status,payment_status)
 values(trim(p_customer->>'customer_name'),trim(p_customer->>'phone'),left(p_customer->>'email',320),trim(p_customer->>'address'),left(p_customer->>'note',2000),total_price,0,total_price,'new','unpaid') returning id into order_id;
 for item in select value from jsonb_array_elements(p_items) loop
   select * into p from public.product where id=(item->>'id')::bigint;
   qty:=(item->>'qty')::integer;unit:=round(p.price*(100-p.discount_percent)/100);
   insert into public.web_order_items(order_id,product_id,product_name,quantity,unit_price,line_total) values(order_id,p.id,p.name,qty,unit,unit*qty);
 end loop;
 return order_id;
end $$;
revoke all on function public.ddv_checkout(jsonb,jsonb) from public;
grant execute on function public.ddv_checkout(jsonb,jsonb) to anon,authenticated;
-- Prevent bypassing DB pricing through the old direct INSERT path.
drop policy if exists "public create orders" on public.web_orders;
drop policy if exists "public create order items" on public.web_order_items;
create policy "checkout owns order insert" on public.web_orders as restrictive for insert to anon,authenticated with check(false);
create policy "checkout owns item insert" on public.web_order_items as restrictive for insert to anon,authenticated with check(false);
commit;
