// Integrate this handler BEFORE existing upload/delete routing. Do not deploy
// without reviewing the deployed Worker's auth/CORS and the migration.
// Secrets stay in Worker bindings. Browser sends only its Supabase access token.
export async function handleAdminRequest(request, env){
  const url=new URL(request.url);
  if(!['/admin/health','/admin/storage','/admin/purge-preview','/admin/purge'].includes(url.pathname))return null;
  const origin=request.headers.get('Origin');
  const allowed=(env.ADMIN_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
  if(origin&&!allowed.includes(origin))return new Response('{"error":"Origin không được phép"}',{status:403,headers});
  if(origin)Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'});
  const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(!env.SUPABASE_URL||!env.SUPABASE_PUBLIC_KEY||!env.ADMIN_USER_IDS||!env.DDV_IMAGES)return json({error:'Chưa cấu hình hệ thống'},503);
  const authorization=request.headers.get('Authorization')||'';
  if(!/^Bearer \S+$/.test(authorization))return json({error:'Cần đăng nhập'},401);
  try{
    const auth=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{apikey:env.SUPABASE_PUBLIC_KEY,Authorization:authorization}});
    if(!auth.ok)return json({error:'Phiên không hợp lệ'},401);
    const user=await auth.json();
    if(!env.ADMIN_USER_IDS.split(',').map(s=>s.trim()).includes(user.id))return json({error:'Không có quyền Admin'},403);
    const rpc=async(name,args={})=>{
      const response=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:env.SUPABASE_PUBLIC_KEY,Authorization:authorization,'Content-Type':'application/json'},body:JSON.stringify(args)});
      if(!response.ok)throw new Error('Database RPC thất bại');
      return response.status===204?null:response.json();
    };
    if(request.method==='GET'&&url.pathname==='/admin/health')return json({ok:true});
    if(request.method==='GET'&&url.pathname==='/admin/storage'){
      const listed=await env.DDV_IMAGES.list({limit:200,cursor:url.searchParams.get('cursor')||undefined});
      return json({objects:listed.objects.map(o=>({key:o.key,size:o.size,uploaded:o.uploaded})),cursor:listed.truncated?listed.cursor:null});
    }
    if(request.method==='GET'&&url.pathname==='/admin/purge-preview')return json({products:await rpc('expired_product_trash')});
    if(request.method==='POST'&&url.pathname==='/admin/purge'){
      const body=await request.json();
      if(body.confirmation!=='XOA VINH VIEN'||!body.product_id)return json({error:'Thiếu xác nhận'},400);
      // Claim locks out restoration and image edits; idempotent retries are safe.
      const claim=await rpc('claim_product_purge',{p_id:body.product_id});
      if(!claim)return json({error:'Sản phẩm chưa đủ 14 ngày'},409);
      if(!Array.isArray(claim.keys))throw new Error('Danh sách image keys không hợp lệ');
      const keys=[...new Set(claim.keys)];
      // Preflight the entire batch before making any irreversible R2 write.
      for(const key of keys){
        if(typeof key!=='string'||!key.startsWith('products/')||key.length>1024||/[\\\x00-\x1f\x7f]/.test(key)||key.split('/').some(part=>!part||part==='.'||part==='..'))throw new Error('Image key không hợp lệ');
        // Do not delete an object referenced by another product.
        const shared=await rpc('product_image_key_shared',{p_id:body.product_id,p_key:key});
        if(shared!==false)throw new Error('Ảnh dùng chung hoặc chưa xác minh được');
      }
      for(const key of keys){
        await env.DDV_IMAGES.delete(key);
      }
      await rpc('finish_product_purge',{p_id:body.product_id});
      return json({ok:true});
    }
    return json({error:'Phương thức không được hỗ trợ'},405);
  }catch{return json({error:'Không hoàn tất được thao tác. Dữ liệu đang chờ có thể thử lại.'},502);}
}
