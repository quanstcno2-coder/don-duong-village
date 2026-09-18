// Static schema checks plus isolated API tests, no SQL execution or production.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const sql=fs.readFileSync(path.join(root,'migrations/011_product_categories.sql'),'utf8').replace(/--[^\n]*/g,'');
assert.match(sql,/add column if not exists category_id bigint\s*;/i,'Nullable, no default/backfill for existing products');
assert.match(sql,/foreign key\(category_id\) references public\.product_categories\(id\) on delete set null/i);
assert.match(sql,/if not exists\(select 1 from pg_constraint where conrelid='public\.product'::regclass and contype='f' and conkey=array\[category_att\][\s\S]*?confrelid='public\.product_categories'::regclass and confkey=array\[target_att\] and confdeltype='n'\) then[\s\S]*?add constraint product_category_id_fkey/i,'Equivalent FK guard, including differently named FK');
assert.match(sql,/conname='product_category_id_fkey'\) then\s+raise exception/i,'Fail closed on conflicting name');
assert.match(sql,/confdeltype<>'n'\)\) then\s+raise exception/i,'Fail closed on incompatible FK');
assert.match(sql,/drop trigger if exists ddv_category_updated_at on public\.product_categories;\s*create trigger ddv_category_updated_at/i);
for(const match of sql.matchAll(/create policy "([^"]+)" on public\.product_categories/g)){
 const drop='drop policy if exists "'+match[1]+'" on public.product_categories;';
 assert.ok(sql.indexOf(drop)>=0&&sql.indexOf(drop)<match.index,match[1]+': drop before recreate');
}
assert.ok(!/drop column|restart|setval|disable row level security/i.test(sql),'No column removal, identity reset, or RLS weakening');
assert.ok(!/delete from|truncate|drop table|update public\.product|product_images|ddv_checkout|product_lifecycle/i.test(sql),'Additive only; no product data reset or unrelated modifications');
assert.match(sql,/product_categories enable row level security/i);
assert.match(sql,/for select to anon,authenticated using\(is_active=true\)/i);
assert.match(sql,/for all to authenticated using\(public\.ddv_is_admin\(\) is true\) with check\(public\.ddv_is_admin\(\) is true\)/i);
for(const action of ['insert','update','delete'])assert.match(sql,new RegExp('as restrictive\\s+for '+action+' to authenticated[\\s\\S]*?ddv_is_admin\\(\\) is true','i'));
assert.ok(!/grant (?:insert|update|delete)[^;]+to anon/i.test(sql));
assert.ok(!fs.readFileSync(path.join(root,'products.html'),'utf8').includes('Dữ liệu cập nhật từ Admin'));
const products=[
 {id:1,name:'Current',category_id:10,visibility:'visible',deleted_at:null},
 {id:2,name:'Same A',category_id:10,visibility:'visible',deleted_at:null,price:100000,discount_percent:20},
 {id:3,name:'Hidden',category_id:10,visibility:'hidden',deleted_at:null},
 {id:4,name:'Trash',category_id:10,visibility:'visible',deleted_at:'2026-01-01'},
 {id:5,name:'Same B',category_id:10,visibility:'visible',deleted_at:null},
 {id:6,name:'Other',category_id:20,visibility:'visible',deleted_at:null},
 {id:7,name:'Unclassified',category_id:null,visibility:'visible',deleted_at:null},
 {id:8,name:'Inactive category',category_id:30,visibility:'visible',deleted_at:null}
];
const categories=[{id:10,name:'A',is_active:true,sort_order:2},{id:20,name:'B',is_active:true,sort_order:1},{id:30,name:'Inactive',is_active:false,sort_order:0}];
let calls=[];
const client={from:table=>{
 const filters=[],orders=[];let start=0,end=Infinity,limit=Infinity;
 const q={select:()=>q,eq:(k,v)=>{filters.push(p=>String(p[k])===String(v));return q;},is:(k,v)=>{filters.push(p=>p[k]===v);return q;},neq:(k,v)=>{filters.push(p=>String(p[k])!==String(v));return q;},order:(k,opts)=>{orders.push([k,opts?.ascending!==false]);return q;},limit:n=>{limit=n;return q;},range:(a,b)=>{start=a;end=b;return q;},then:resolve=>{
   calls.push(table);const data=(table==='product'?products:categories).filter(p=>filters.every(f=>f(p))).sort((a,b)=>{for(const [k,asc] of orders){if(a[k]===b[k])continue;return(a[k]<b[k]?-1:1)*(asc?1:-1);}return 0;}).slice(start,end+1).slice(0,limit);
   return Promise.resolve({data,error:null}).then(resolve);
 }};return q;
}};
const context=vm.createContext({Set,DDV_CONFIG:{SUPABASE_URL:'test',SUPABASE_ANON_KEY:'public'},supabase:{createClient:()=>client}});context.window=context;
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/supabase.js'),'utf8'),context);
(async()=>{
 const active=await context.ddvApi.categories();assert.deepEqual(Array.from(active,c=>c.id),[20,10]);
 assert.deepEqual(Array.from(await context.ddvApi.products(),p=>p.id),[1,2,5,6,7,8]);
 const many=Array.from({length:205},(_,i)=>({...products[1],id:1000+i}));products.push(...many);
 assert.equal((await context.ddvApi.products()).length,211,'Catalog pagination');assert.equal((await context.ddvApi.products({limit:3})).length,3,'Homepage limit remains intact');products.splice(-205);
 const related=await context.ddvApi.relatedProducts(products[0]);assert.deepEqual(Array.from(related,p=>p.id),[2,5,6,7]);
 assert.ok(related.every(p=>p.visibility==='visible'&&!p.deleted_at&&p.id!==1));assert.equal(new Set(related.map(p=>p.id)).size,4);
 const unclassified=await context.ddvApi.relatedProducts(products[6]);assert.equal(unclassified.length,4);assert.ok(!unclassified.some(p=>p.id===7));
 const inactive=await context.ddvApi.relatedProducts(products[7]);assert.ok(!inactive.some(p=>p.id===8));assert.equal(inactive.length,4);
 const extra=[{...products[1],id:9},{...products[1],id:10}];products.push(...extra);calls=[];
 assert.deepEqual(Array.from(await context.ddvApi.relatedProducts(products[0]),p=>p.id),[2,5,9,10]);assert.equal(calls.filter(t=>t==='product').length,1,'No fallback when category already supplies four');products.splice(-2);
 const more=Array.from({length:201},(_,i)=>({id:1000+i,name:'Test '+i,is_active:true,sort_order:3}));categories.push(...more);
 assert.equal((await context.ddvApi.categories()).length,203,'Categories are paginated');categories.splice(-201);
 // No fabricated rows when no candidates remain.
 const saved=products.splice(1);assert.equal((await context.ddvApi.relatedProducts(products[0])).length,0);products.push(...saved);
 console.log('PASS: additive nullable category FK/SET NULL and RLS (static), active category order, related priority/fallback/exclusions/dedup/max4');
})().catch(error=>{console.error(error);process.exitCode=1;});
