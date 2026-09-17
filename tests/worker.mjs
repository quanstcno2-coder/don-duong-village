import assert from 'node:assert/strict';
import {handleAdminRequest} from '../worker/admin-extension.mjs';
const env={SUPABASE_URL:'https://db.invalid',SUPABASE_PUBLIC_KEY:'public-test',ADMIN_USER_IDS:'owner',ADMIN_ORIGINS:'https://site.invalid',DDV_IMAGES:{list:async()=>({objects:[{key:'products/a.webp',size:12,uploaded:'2026-01-01'}],truncated:true,cursor:'next'}),delete:async key=>deleted.push(key)}};
let deleted=[],rpcCalls=[],shared=false,keys=['products/a.webp'],sharedKey=null,errorKey=null,unknownKey=null,events=[];
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,opts)=>{
 if(url.endsWith('/auth/v1/user'))return Response.json({id:opts.headers.Authorization==='Bearer owner-token'?'owner':'stranger'});
 const name=url.split('/').at(-1);rpcCalls.push(name);
 if(name==='claim_product_purge')return Response.json({keys});
 if(name==='product_image_key_shared'){
   const key=JSON.parse(opts.body).p_key;events.push('check:'+key);
   if(key===errorKey)return new Response(null,{status:500});
   return Response.json(key===unknownKey?null:shared||key===sharedKey);
 }
 if(name==='finish_product_purge')return new Response(null,{status:204});
 return Response.json([]);
};
try{
 const req=(path,token='owner-token',options={})=>new Request('https://worker.invalid'+path,{...options,headers:{Origin:'https://site.invalid',...(token?{Authorization:'Bearer '+token}:{}),...options.headers}});
 assert.equal(await handleAdminRequest(req('/upload'),env),null);
 assert.equal((await handleAdminRequest(req('/admin/storage',null),env)).status,401);
 assert.equal((await handleAdminRequest(req('/admin/storage','stranger'),env)).status,403);
 assert.equal((await handleAdminRequest(req('/admin/storage','owner-token',{headers:{Origin:'https://bad.invalid'}}),env)).status,403);
 assert.equal((await handleAdminRequest(req('/admin/storage',null,{method:'OPTIONS'}),env)).status,204);
 const listing=await (await handleAdminRequest(req('/admin/storage'),env)).json();assert.equal(listing.cursor,'next');assert.equal(listing.objects[0].size,12);
 const body=JSON.stringify({product_id:1,confirmation:'XOA VINH VIEN'});
 assert.equal((await handleAdminRequest(req('/admin/purge','owner-token',{method:'POST',body:'{}'}),env)).status,400);
 shared=true;assert.equal((await handleAdminRequest(req('/admin/purge','owner-token',{method:'POST',body}),env)).status,502);assert.deepEqual(deleted,[]);
 shared=false;rpcCalls=[];assert.equal((await handleAdminRequest(req('/admin/purge','owner-token',{method:'POST',body}),env)).status,200);
 assert.deepEqual(deleted,['products/a.webp']);assert.deepEqual(rpcCalls,['claim_product_purge','product_image_key_shared','finish_product_purge']);
 // Later unsafe keys must never allow an earlier safe object to be deleted.
 const purge=()=>handleAdminRequest(req('/admin/purge','owner-token',{method:'POST',body}),env);
 for(const failure of ['shared','error','unknown','invalid','traversal','non-string']){
   deleted=[];rpcCalls=[];events=[];sharedKey=null;errorKey=null;unknownKey=null;
   keys=['products/a.webp','products/b.webp'];
   if(failure==='shared')sharedKey=keys[1];
   if(failure==='error')errorKey=keys[1];
   if(failure==='unknown')unknownKey=keys[1];
   if(failure==='invalid')keys[1]='site/unsafe.webp';
   if(failure==='traversal')keys[1]='products/../unsafe.webp';
   if(failure==='non-string')keys[1]=null;
   assert.equal((await purge()).status,502,failure);
   assert.deepEqual(deleted,[],failure+': no partial R2 deletion');
   assert.ok(!rpcCalls.includes('finish_product_purge'),failure+': no DB finalization');
 }
 sharedKey=null;errorKey=null;unknownKey=null;deleted=[];events=[];
 keys=['products/a.webp','products/b.webp'];
 env.DDV_IMAGES.delete=async key=>{events.push('delete:'+key);deleted.push(key);};
 assert.equal((await purge()).status,200);
 assert.deepEqual(events,['check:products/a.webp','check:products/b.webp','delete:products/a.webp','delete:products/b.webp']);
 console.log('PASS: Worker auth, admin allowlist, CORS, pagination, confirmation, shared image protection, purge order');
}finally{globalThis.fetch=originalFetch;}
