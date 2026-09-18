const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/quanv/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{const file=fs.statSync(p).isDirectory()?path.join(p,'index.html'):p;res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'image/png');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
function fakeBackend(){
 window.__admin=true;window.__missingCategories=false;
 const product=(id,name,category_id,extra={})=>({id,name,category_id,visibility:'visible',deleted_at:null,price:100000,discount_percent:20,stock:10,is_featured:false,description:'Mô tả',product_details:'Chi tiết',image_url:'assets/images/story-main.png',created_at:'2026-01-01',...extra});
 window.__db={product:[product(1,'Trà hoa',10),product(2,'Trà sen',10),product(3,'Quà hoa',20),product(4,'Không phân loại',null),product(5,'Ẩn',10,{visibility:'hidden'}),product(6,'Thùng rác',10,{deleted_at:'2026-01-01'}),product(7,'Danh mục tắt',30),product(8,'Trà cao nguyên',10)],product_categories:[{id:10,name:'Trà',slug:'tra',sort_order:1,is_active:true},{id:20,name:'Quà sức khỏe',slug:'qua',sort_order:0,is_active:true},{id:30,name:'Mùa cũ',slug:'mua-cu',sort_order:2,is_active:false}],product_images:[],site_settings:[],page_sections:[]};
 const client={auth:{getSession:async()=>({data:{session:{access_token:'synthetic-test-token'}}}),onAuthStateChange:()=>{},signOut:async()=>({})},rpc:async name=>({data:name==='ddv_is_admin'?window.__admin:null,error:null}),from:table=>{
   const filters=[],orders=[];let operation='read',payload,start=0,end=Infinity,max=Infinity,options={};
   const execute=()=>{
     if(table==='product_categories'&&window.__missingCategories)return {data:null,error:{code:'42P01'}};
     let data=(window.__db[table]||[]).filter(r=>filters.every(f=>f(r)));
     if(table==='product_categories'&&!window.__admin){if(operation!=='read')return {data:null,error:{code:'42501'}};data=data.filter(c=>c.is_active);}
     if(operation==='insert'){
       const added={id:Math.max(0,...(window.__db[table]||[]).map(r=>r.id))+1,...payload};window.__db[table]??=[];window.__db[table].push(added);data=[added];
     }
     if(operation==='update')data.forEach(r=>Object.assign(r,payload));
     if(operation==='delete'){
       if(table==='product_categories')for(const p of window.__db.product)if(data.some(c=>c.id===p.category_id))p.category_id=null;
       window.__db[table]=(window.__db[table]||[]).filter(r=>!data.includes(r));
     }
     data=data.slice().sort((a,b)=>{for(const [k,asc] of orders){if(a[k]===b[k])continue;return(a[k]<b[k]?-1:1)*(asc?1:-1);}return 0;}).slice(start,end+1).slice(0,max);
     return {data:data.map(r=>({...r})),error:null,count:options.count?data.length:null};
   };
   const q={select:(cols,opts)=>{options=opts||{};return q;},eq:(k,v)=>{filters.push(r=>String(r[k])===String(v));return q;},is:(k,v)=>{filters.push(r=>r[k]===v);return q;},neq:(k,v)=>{filters.push(r=>String(r[k])!==String(v));return q;},order:(k,opts)=>{orders.push([k,opts?.ascending!==false]);return q;},range:(a,b)=>{start=a;end=b;return q;},limit:n=>{max=n;return q;},insert:value=>{operation='insert';payload=value;return q;},update:value=>{operation='update';payload=value;return q;},delete:()=>{operation='delete';return q;},maybeSingle:async()=>{const r=execute();return {...r,data:r.data?.[0]||null};},single:async()=>{const r=execute();return {...r,data:r.data?.[0]||null};},then:resolve=>Promise.resolve(execute()).then(resolve)};return q;
 }};
 window.supabase={createClient:()=>client};
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let browser;
 try{
 browser=await chromium.launch({headless:true,channel:'msedge'});const context=await browser.newContext();
 await context.route('https://**/*',route=>route.request().url().includes('supabase-js')?route.fulfill({contentType:'application/javascript',body:'('+fakeBackend.toString()+')();'}):route.abort());
 await context.route('**/assets/js/config.js',route=>route.fulfill({contentType:'application/javascript',body:'window.DDV_CONFIG={SUPABASE_URL:"https://test.invalid",SUPABASE_ANON_KEY:"public-test",R2_WORKER_URL:"https://worker.invalid"};'}));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const names=()=>page.locator('#productGrid h3').allTextContents();
 for(const width of [320,390,1280]){
   await page.setViewportSize({width,height:850});await page.goto(base+'/products.html');await page.locator('.category-filter').first().waitFor();
   assert.equal(await page.getByText('Dữ liệu cập nhật từ Admin',{exact:true}).count(),0);
   assert.deepEqual(await page.locator('.category-filter').allTextContents(),['Tất cả sản phẩm','Quà sức khỏe','Trà']);
   assert.deepEqual(await names(),['Trà hoa','Trà sen','Quà hoa','Không phân loại','Danh mục tắt','Trà cao nguyên']);
   await page.getByRole('button',{name:'Trà',exact:true}).click();assert.deepEqual(await names(),['Trà hoa','Trà sen','Trà cao nguyên']);
   assert.equal(await page.getByRole('button',{name:'Trà',exact:true}).getAttribute('aria-pressed'),'true');
   await page.locator('#productSearch').fill('hoa');assert.deepEqual(await names(),['Trà hoa']);
   await page.getByRole('button',{name:'Tất cả sản phẩm',exact:true}).click();assert.deepEqual(await names(),['Trà hoa','Quà hoa']);
   await page.locator('#productSearch').fill('');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'catalog overflow '+width);
   await page.screenshot({path:path.join(root,'tests','categories-'+width+'.png'),fullPage:true});
   await page.goto(base+'/product.html?id=1');await page.locator('#relatedProducts .product-card').nth(3).waitFor();
   const related=await page.locator('#relatedProducts h3').allTextContents();assert.deepEqual(related,['Trà sen','Trà cao nguyên','Quà hoa','Không phân loại']);
   assert.equal(await page.locator('#relatedProducts .price strong').first().textContent(),'80.000đ');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'related overflow '+width);
   assert.ok((await page.locator('#relatedProducts a').first().getAttribute('href')).includes('id=2'));
 }
 await page.goto(base+'/admin/');await page.locator('#adminView').waitFor({state:'visible'});
 await page.getByRole('button',{name:'Danh mục sản phẩm',exact:true}).click();await page.locator('#categoriesTable tr').nth(2).waitFor();
 await page.getByRole('button',{name:'Thêm danh mục',exact:true}).click();await page.locator('#categoryName').fill('Danh mục mới');await page.locator('#categorySlug').fill('danh-muc-moi');await page.locator('#categorySort').fill('4');await page.getByRole('button',{name:'Lưu danh mục',exact:true}).click();
 await page.locator('#categoriesTable tr').nth(3).waitFor();assert.equal(await page.evaluate(()=>__db.product_categories.length),4);
 const row=page.locator('#categoriesTable tr').filter({hasText:'Danh mục mới'});await row.getByRole('button',{name:'Sửa',exact:true}).click();await page.locator('#categoryName').fill('Danh mục đổi tên');await page.locator('#categorySlug').fill('danh-muc-doi');await page.locator('#categoryForm [name=is_active]').uncheck();await page.getByRole('button',{name:'Lưu danh mục',exact:true}).click();
 await page.waitForFunction(()=>__db.product_categories.some(c=>c.name==='Danh mục đổi tên'&&!c.is_active&&c.slug==='danh-muc-doi'));
 await page.evaluate(async()=>{await openProduct(__db.product[0]);});assert.equal(await page.locator('#productCategorySelect').inputValue(),'10');
 assert.equal(await page.locator('#productCategorySelect option').first().textContent(),'Không phân loại');
 assert.ok(await page.locator('#productCategorySelect option').filter({hasText:'Mùa cũ (Đang tắt)'}).count());
 await page.locator('#productCategorySelect').selectOption('20');await page.locator('#productForm').getByRole('button',{name:'Lưu sản phẩm',exact:true}).click();await page.waitForFunction(()=>__db.product[0].category_id===20);
 await page.evaluate(async()=>{await openProduct(__db.product[0]);});assert.equal(await page.locator('#productCategorySelect').inputValue(),'20');
 await page.locator('#productCategorySelect').selectOption('');await page.locator('#productForm').getByRole('button',{name:'Lưu sản phẩm',exact:true}).click();await page.waitForFunction(()=>__db.product[0].category_id===null);
 // Missing migration/query failure must not silently clear an existing category.
 await page.evaluate(async()=>{__db.product[0].category_id=10;__missingCategories=true;await openProduct(__db.product[0]);});assert.equal(await page.locator('#productCategorySelect').isDisabled(),true);
 await page.locator('#productForm').getByRole('button',{name:'Lưu sản phẩm',exact:true}).click();await page.locator('#productModal').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>__db.product[0].category_id),10);
 await page.evaluate(async()=>{__missingCategories=false;await loadCategoriesAdmin();});
 page.once('dialog',d=>d.dismiss());await page.locator('#categoriesTable tr').filter({hasText:'Trà'}).getByRole('button',{name:'Xóa',exact:true}).click();assert.equal(await page.evaluate(()=>__db.product_categories.length),4);
 page.once('dialog',d=>d.accept());await page.locator('#categoriesTable tr').filter({hasText:'Trà'}).getByRole('button',{name:'Xóa',exact:true}).click();await page.waitForFunction(()=>!__db.product_categories.some(c=>c.id===10));
 assert.equal(await page.evaluate(()=>__db.product.length),8);assert.ok(await page.evaluate(()=>__db.product.filter(p=>[1,2,5,6,8].includes(p.id)).every(p=>p.category_id===null)));
 // Mock role rejection verifies UI error path; real RLS is checked statically.
 await page.evaluate(()=>{__admin=false;openCategory();});await page.locator('#categoryName').fill('Không có quyền');await page.locator('#categorySlug').fill('khong-quyen');await page.getByRole('button',{name:'Lưu danh mục',exact:true}).click();await page.locator('#categoryError').filter({hasText:'quyền Admin'}).waitFor();assert.equal(await page.evaluate(()=>__db.product_categories.length),3);
 assert.deepEqual(errors,[]);console.log('PASS: category CRUD/toggle/confirm, nullable form save/load/error preservation, catalog search+filters, lifecycle exclusions, related pricing/priority, 320/390/1280 (mock backend)');
 }finally{if(browser)await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
