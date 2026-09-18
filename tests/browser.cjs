const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/quanv/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{const file=fs.statSync(p).isDirectory()?path.join(p,'index.html'):p;res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'image/png');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
const stub=`window.supabase={createClient:()=>({auth:{getSession:()=>new Promise(r=>setTimeout(()=>r({data:{session:null}}),600)),onAuthStateChange:()=>{},signInWithPassword:async()=>({error:{message:'bad'}}),signOut:async()=>({})},from:()=>{const q={select:()=>q,eq:()=>q,is:()=>q,order:()=>q,limit:()=>q,maybeSingle:()=>Promise.resolve({data:null}),then:r=>Promise.resolve({data:[],count:0}).then(r)};return q;}})};`;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
 browser=await chromium.launch({headless:true,channel:'msedge'});const context=await browser.newContext();
 await context.route('https://**/*',route=>route.request().url().includes('supabase-js')?route.fulfill({contentType:'application/javascript',body:stub}):route.abort());
 await context.route('**/assets/js/config.js',route=>route.fulfill({contentType:'application/javascript',body:'window.DDV_CONFIG={SUPABASE_URL:"https://test.invalid",SUPABASE_ANON_KEY:"public-test",R2_WORKER_URL:"https://worker.invalid"};'}));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/admin/?email=legacy-test&password=synthetic-old',{waitUntil:'domcontentloaded'});
 assert.equal(new URL(page.url()).search,'');
 await page.locator('[name=email]').first().fill('owner@example.test');await page.locator('[name=password]').fill('synthetic-test-password');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
 await page.waitForTimeout(650);assert.equal(new URL(page.url()).search,'');assert.equal(await page.locator('[name=password]').inputValue(),'');
 // Mock catalog only. Never call a production backend during verification.
 for(const width of [1280,390,320]){
 await page.setViewportSize({width,height:850});await page.goto(base+'/product.html?id=1');
 await page.evaluate(()=>{ddvApi.product=async()=>({id:1,name:'Sản phẩm thử',price:100000,discount_percent:20,stock:8,image_url:'assets/images/story-main.png',product_details:'Thông tin thử'});});
 // Run the page initialization again after injecting the mock API.
 await page.evaluate(()=>document.dispatchEvent(new Event('DOMContentLoaded')));
 await page.locator('#productMainImage').waitFor();
 await page.locator('#productMainImage').click();assert.equal(await page.locator('dialog').evaluate(d=>d.open),true);
 await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').evaluate(d=>d.open),false);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), 'overflow at '+width);
 await page.locator('#plus').click();await page.locator('#addBtn').click();
 const cart=await page.evaluate(()=>cartGet());assert.equal(cart.find(x=>x.id===1).price,80000);
 await page.screenshot({path:path.join(root,'tests','product-'+width+'.png'),fullPage:true});
 }
 // Exercise real gallery controls with 1, 3 and 8 mock image URLs.
 for(const count of [1,3,8]){
   await page.evaluate(count=>{
     document.querySelectorAll('dialog').forEach(d=>d.remove());
     const main=document.querySelector('#productMainImage');
     const thumbs=document.querySelector('.product-thumbnails')||document.createElement('div');thumbs.className='product-thumbnails';thumbs.replaceChildren();
     const urls=Array.from({length:count},(_,i)=>'assets/images/story-main.png?test='+i);
     if(count>1){for(let i=0;i<count;i++){const b=document.createElement('button');b.className='product-thumb';b.textContent=String(i);thumbs.append(b);}main.parentNode.after(thumbs);}
     setupProductGallery(urls,'Thử '+count+' ảnh');
   },count);
   await page.locator('#productMainImage').click();
   if(count>1){await page.locator('.lightbox-next').click();assert.equal(await page.locator('dialog p').textContent(),'2 / '+count);await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('dialog p').textContent(),'1 / '+count);await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('dialog p').textContent(),count+' / '+count);}
   else assert.equal(await page.locator('.lightbox-next').isVisible(),false);
   await page.locator('.lightbox-close').click();
   if(count>1){await page.locator('.product-thumb').nth(count-1).click();assert.equal(await page.locator('#productMainImage').getAttribute('src'),'assets/images/story-main.png?test='+(count-1));}
 }
 // Buy now merges into one cart line with the selected quantity and price.
 await page.evaluate(()=>cartSave([]));await page.locator('#buyNowBtn').click();
 await page.waitForURL('**/cart.html#checkoutForm');
 const bought=await page.evaluate(()=>cartGet());assert.equal(bought.length,1);assert.equal(bought[0].qty,2);assert.equal(bought[0].price,80000);
 // Regression of the actual Admin gallery save using an in-memory DB adapter.
 await page.goto(base+'/admin/');
 const listResult=await page.evaluate(async()=>{
   const data=[
     {id:1,name:'Visible featured',image_url:'assets/images/story-main.png',is_featured:true,visibility:'visible',price:100000,stock:2},
     {id:2,name:'Hidden regular',image_url:null,is_featured:false,visibility:'hidden',price:200000,stock:3},
     {id:3,name:'Trash featured',image_url:'assets/images/logo-horizontal.png',is_featured:true,visibility:'visible',deleted_at:new Date().toISOString(),price:300000,stock:4}
   ];
   ddvSupabase.from=()=>{const q={select:()=>q,order:()=>q,then:resolve=>Promise.resolve({data,error:null}).then(resolve)};return q;};
   const filter=document.querySelector('#productStatusFilter');filter.value='all';await loadProductsAdmin();
   const body=document.querySelector('#productsTable');
   const headers=[...body.closest('table').querySelectorAll('th')].map(th=>th.textContent);
   const rows=[...body.rows].map(row=>({cells:[...row.cells].map(c=>c.textContent),image:row.cells[0].querySelector('img')?.getAttribute('src')||null,alt:row.cells[0].querySelector('img')?.alt||null}));
   const filters={};
   for(const value of ['visible','hidden','trash']){filter.value=value;await loadProductsAdmin();filters[value]=[...body.rows].map(row=>row.cells[1].textContent);}
   return {headers,rows,filters};
 });
 assert.deepEqual(listResult.headers,['Ảnh','Tên','Giá','Tồn','Nổi bật','Trạng thái','Thao tác']);
 assert.ok(listResult.rows.every(row=>row.cells.length===7));
 assert.equal(listResult.rows[0].image,'../assets/images/story-main.png');assert.equal(listResult.rows[0].alt,'Visible featured');
 assert.equal(listResult.rows[0].cells[4],'Nổi bật');assert.equal(listResult.rows[0].cells[5],'Hiển thị');
 assert.equal(listResult.rows[1].image,null);assert.equal(listResult.rows[1].cells[0],'—');assert.equal(listResult.rows[1].cells[4],'—');assert.equal(listResult.rows[1].cells[5],'Đang ẩn');
 assert.equal(listResult.rows[2].cells[4],'Nổi bật');assert.equal(listResult.rows[2].cells[5],'Thùng rác');
 assert.deepEqual(listResult.filters,{visible:['Visible featured'],hidden:['Hidden regular'],trash:['Trash featured']});
 const galleryResult=await page.evaluate(async()=>{
   const p={id:77,name:'Kiểm thử gallery',price:100000,stock:8,discount_percent:20};
   let rows=Array.from({length:8},(_,i)=>({id:i+1,product_id:77,image_url:'assets/images/story-main.png?'+i,image_key:'products/'+i+'.webp',sort_order:i,is_primary:i===0}));
   const removed=[];
   ddvSupabase.from=table=>{
     let operation='read',payload,filters=[];
     const q={select:()=>q,order:()=>q,eq:(key,value)=>{filters.push([key,value]);return q;},update:value=>{operation='update';payload=value;return q;},insert:value=>{rows.push({id:100,...value});return q;},single:async()=>({data:{...rows.at(-1)},error:null}),delete:()=>{operation='delete';return q;},then:resolve=>{
       const all=table==='product_images'?rows:[p],matches=all.filter(r=>filters.every(([k,v])=>String(r[k])===String(v)));
       if(operation==='update')matches.forEach(r=>Object.assign(r,payload));
       if(operation==='delete')rows=rows.filter(r=>!matches.includes(r));
       return Promise.resolve({data:matches.map(r=>({...r})),error:null}).then(resolve);
     }};return q;
   };
   deleteProductImageFromR2=async key=>removed.push(key);
   loadProductsAdmin=async()=>{};
   await openProduct(p);
   const preview=document.querySelector('#productPreview');
   // Move last image first using the new touch-friendly controls.
   for(let i=0;i<7;i++)preview.querySelector('[data-image-id="8"] .image-order-controls button').click();
   preview.querySelector('[data-remove-old="2"]').click();
   const beforeSave={count:rows.length,removed:removed.length,first:preview.firstElementChild.dataset.imageId};
   await saveProduct({preventDefault(){},target:document.querySelector('#productForm')});
   const sorted=rows.sort((a,b)=>a.sort_order-b.sort_order);
   await openProduct(p);
   const firstReload=preview.firstElementChild.dataset.imageId;
   preview.querySelector('[data-remove-old="8"]').click();
   await saveProduct({preventDefault(){},target:document.querySelector('#productForm')});
   const existingResult={beforeSave,firstReload,count:rows.length,orders:rows.map(r=>r.sort_order).sort((a,b)=>a-b),primary:rows.filter(r=>r.is_primary).map(r=>r.id),image_url:p.image_url,removed};
   await openProduct(p);
   const file=new File(['mock'],'new.png',{type:'image/png'});
   adminState.pendingProductFiles=[{file,previewUrl:URL.createObjectURL(file)}];
   uploadProductImageToR2=async()=>({url:'assets/images/logo-horizontal.png',key:'products/new.webp'});
   renderProductImagesAdmin(adminState.productImages);
   for(let i=0;i<6;i++)preview.querySelector('[data-new-index="0"] .image-order-controls button').click();
   await saveProduct({preventDefault(){},target:document.querySelector('#productForm')});
   return {...existingResult,newPrimary:rows.filter(r=>r.is_primary).map(r=>r.id),newImageUrl:p.image_url,newOrders:rows.map(r=>r.sort_order).sort((a,b)=>a-b)};
 });
 assert.deepEqual(galleryResult.beforeSave,{count:8,removed:0,first:'8'});assert.equal(galleryResult.firstReload,'8');assert.equal(galleryResult.count,6);
 assert.deepEqual(galleryResult.orders,[0,1,2,3,4,5]);assert.deepEqual(galleryResult.primary,[1]);assert.equal(galleryResult.image_url,'assets/images/story-main.png?0');assert.deepEqual(galleryResult.removed,['products/1.webp','products/7.webp']);
 assert.deepEqual(galleryResult.newPrimary,[100]);assert.equal(galleryResult.newImageUrl,'assets/images/logo-horizontal.png');assert.deepEqual(galleryResult.newOrders,[0,1,2,3,4,5,6]);
 assert.deepEqual(errors,[]);console.log('PASS: login URL safety, password clearing, lightbox Escape, discounted cart, mobile 320/390 and desktop 1280');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;server.close();});
