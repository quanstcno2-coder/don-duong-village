async function workerAdmin(path,options={}){
  if(!window.ddvSupabase)throw new Error('Cần kết nối Supabase');
  const {data:{session}}=await ddvSupabase.auth.getSession();
  if(!session?.access_token)throw new Error('Cần đăng nhập lại');
  const base=String(DDV_CONFIG.R2_WORKER_URL||'').replace(/\/+$/,'');
  if(!base)throw new Error('Chưa cấu hình Worker');
  const response=await fetch(base+path,{...options,headers:{Authorization:'Bearer '+session.access_token,...options.headers}});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||'Worker chưa sẵn sàng');
  return data;
}
async function readAllRows(table){
  const rows=[];
  const {count,error:countError}=await ddvSupabase.from(table).select('id',{count:'exact',head:true});
  if(countError||count==null)throw new Error('Không đếm được bảng '+table);
  for(let offset=0;offset<count;){
    const {data,error}=await ddvSupabase.from(table).select('*').order('id').range(offset,offset+499);
    if(error)throw new Error('Không đọc được bảng '+table);
    rows.push(...data);
    if(!data.length)throw new Error('Dữ liệu thay đổi trong khi xuất. Vui lòng thử lại.');
    offset+=data.length;
  }
  return rows;
}
async function loadSystem(){
  const status=$('#systemStatus'),objects=$('#storageObjects');status.textContent='Đang kiểm tra…';objects.replaceChildren();
  if(!window.ddvSupabase){status.textContent='Chế độ demo; cần kết nối Supabase.';return;}
  const results=await Promise.allSettled([
    ...['product','web_orders','posts'].map(async table=>{const {count,error}=await ddvSupabase.from(table).select('id',{count:'exact',head:true});if(error)throw new Error(table+': lỗi kết nối/quyền truy cập');return table+': '+count;}),
    (async()=>{const {data,error}=await ddvSupabase.rpc('ddv_system_stats');if(error)throw new Error('Chưa có quyền/RPC dung lượng DB');return 'Database: '+formatBytes(data.database_bytes);})(),
    workerAdmin('/admin/health').then(()=> 'Worker: OK')
  ]);
  status.textContent=results.map(r=>r.status==='fulfilled'?r.value:r.reason.message).join(' · ');
  try{
    const [images,products]=await Promise.all([readAllRows('product_images'),readAllRows('product')]);
    const references=new Set(images.map(i=>i.image_key).filter(Boolean));
    const referencedUrls=new Set(products.map(p=>p.image_url).filter(Boolean));
    let cursor=null,total=0,count=0,orphans=0;
    do{
      const page=await workerAdmin('/admin/storage'+(cursor?'?cursor='+encodeURIComponent(cursor):''));
      for(const o of page.objects){
        count++;total+=o.size;
        const likelyOrphan=o.key.startsWith('products/')&&!references.has(o.key)&&![...referencedUrls].some(url=>url.endsWith('/'+o.key));
        if(likelyOrphan)orphans++;
        const row=document.createElement('tr');
        for(const value of [o.key,formatBytes(o.size),new Date(o.uploaded).toLocaleString('vi-VN'),likelyOrphan?'Có thể chưa được dùng; cần kiểm tra':'Có tham chiếu hoặc ngoài thư mục sản phẩm']){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}objects.append(row);
      }
      cursor=page.cursor;
    }while(cursor);
    $('#storageSummary').textContent=`R2: ${count} tệp · ${formatBytes(total)} · ${orphans} ảnh có thể không được dùng.`+(count>5000||total>5*1024**3?' Dung lượng/số tệp đang lớn, nên kiểm tra định kỳ.':'');
  }catch(error){$('#storageSummary').textContent=error.message+' — cần tích hợp phần mở rộng Worker để xem R2.';}
}
function formatBytes(n){return n>=1024**3?(n/1024**3).toFixed(2)+' GB':n>=1024**2?(n/1024**2).toFixed(2)+' MB':n>=1024?(n/1024).toFixed(1)+' KB':n+' B';}
async function previewExpiredTrash(){
  const box=$('#expiredTrash');box.replaceChildren();
  try{
    const {products}=await workerAdmin('/admin/purge-preview');
    if(!products.length){box.textContent='Không có sản phẩm quá hạn 14 ngày.';return;}
    for(const p of products){
      const line=document.createElement('p');line.textContent=p.name+' · '+new Date(p.deleted_at).toLocaleDateString('vi-VN')+' ';
      const button=document.createElement('button');button.className='btn danger small';button.textContent='Xóa vĩnh viễn';
      button.onclick=async()=>{
        if(!confirm('Xóa vĩnh viễn '+p.name+' và ảnh R2? Không thể khôi phục.'))return;
        button.disabled=true;
        try{await workerAdmin('/admin/purge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:p.id,confirmation:'XOA VINH VIEN'})});line.remove();toast('Đã xóa dữ liệu quá hạn');}
        catch(error){toast(error.message);button.disabled=false;}
      };
      line.append(button);box.append(line);
    }
  }catch(error){box.textContent=error.message;}
}
