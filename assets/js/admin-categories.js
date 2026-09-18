let adminCategories=[];
let categorySelectRequest=0;
async function fetchAdminCategories(){
  if(!window.ddvSupabase)throw new Error('Cần kết nối Supabase');
  const rows=[];
  for(let offset=0;;){
    const {data,error}=await ddvSupabase.from('product_categories').select('*').order('sort_order').order('id').range(offset,offset+199);
    if(error)throw new Error('Chưa tải được danh mục. Vui lòng kiểm tra kết nối và cấu hình danh mục.');
    if(!data.length)return rows;
    rows.push(...data);offset+=data.length;
  }
}
async function populateProductCategorySelect(categoryId,expectedProduct){
  const request=++categorySelectRequest;
  const select=$('#productCategorySelect');
  select.disabled=true;select.replaceChildren(new Option('Không phân loại',''));
  const status=$('#productCategoryStatus');status.textContent='Đang tải danh mục…';
  try{
    const categories=await fetchAdminCategories();
    if(request!==categorySelectRequest||adminState.editProduct!==expectedProduct)return;
    adminCategories=categories;
    for(const c of adminCategories)select.add(new Option(c.name+(c.is_active?'':' (Đang tắt)'),String(c.id)));
    if(categoryId!=null&&!adminCategories.some(c=>String(c.id)===String(categoryId))){status.textContent='Danh mục hiện tại không tải được; giữ nguyên phân loại khi lưu.';return;}
    select.value=categoryId==null?'':String(categoryId);select.disabled=false;status.textContent='Có thể để Không phân loại.';
  }catch(error){if(request===categorySelectRequest&&adminState.editProduct===expectedProduct)status.textContent=error.message+' Phân loại hiện tại được giữ nguyên khi lưu.';}
}
async function loadCategoriesAdmin(){
  const body=$('#categoriesTable'),status=$('#categoriesStatus');body.replaceChildren();status.textContent='Đang tải…';
  try{
    adminCategories=await fetchAdminCategories();
    status.textContent=adminCategories.length?'':'Chưa có danh mục. Bấm Thêm danh mục để tạo.';
    for(const c of adminCategories){
      const row=document.createElement('tr');
      for(const text of [c.name,c.slug,c.sort_order,c.is_active?'Đang bật':'Đang tắt']){const cell=document.createElement('td');cell.textContent=text;row.append(cell);}
      const actions=document.createElement('td');
      for(const [label,callback] of [['Sửa',()=>openCategory(c)],['Xóa',()=>deleteCategory(c)]]){const b=document.createElement('button');b.type='button';b.className='btn secondary small';b.textContent=label;b.onclick=callback;actions.append(b,' ');}
      row.append(actions);body.append(row);
    }
  }catch(error){status.textContent=error.message;}
}
function openCategory(c=null){
  const f=$('#categoryForm');f.reset();f.elements.id.value=c?.id??'';f.elements.name.value=c?.name??'';f.elements.slug.value=c?.slug??'';f.elements.sort_order.value=c?.sort_order??0;f.elements.is_active.checked=c?.is_active??true;
  $('#categoryError').textContent='';$('#categoryModalTitle').textContent=c?'Sửa danh mục':'Thêm danh mục';$('#categoryModal').classList.remove('hidden');f.elements.name.focus();
}
async function saveCategory(event){
  event.preventDefault();const f=event.target,b=f.querySelector('[type="submit"]'),errorBox=$('#categoryError');
  if(b.disabled||!f.reportValidity())return;
  if(!window.ddvSupabase){errorBox.textContent='Cần kết nối Supabase để lưu danh mục.';return;}
  const payload={name:f.elements.name.value.trim(),slug:f.elements.slug.value.trim()||slugify(f.elements.name.value.trim()),sort_order:Number(f.elements.sort_order.value),is_active:f.elements.is_active.checked};
  if(!payload.name||!payload.slug||!Number.isInteger(payload.sort_order)||payload.sort_order<-2147483648||payload.sort_order>2147483647){errorBox.textContent='Vui lòng nhập tên, slug hợp lệ và thứ tự là số nguyên.';return;}
  b.disabled=true;errorBox.textContent='';
  try{
    const id=f.elements.id.value;
    const query=id?ddvSupabase.from('product_categories').update(payload).eq('id',id):ddvSupabase.from('product_categories').insert(payload);
    const {error}=await query;
    if(error){errorBox.textContent=error.code==='23505'?'Slug đã tồn tại. Vui lòng chọn slug khác.':'Chưa lưu được danh mục. Kiểm tra thông tin và quyền Admin.';return;}
    closeModal('categoryModal');toast('Đã lưu danh mục');await loadCategoriesAdmin();
  }catch{errorBox.textContent='Kết nối bị gián đoạn. Vui lòng thử lại.';}
  finally{b.disabled=false;}
}
async function deleteCategory(c){
  if(!confirm('Xóa danh mục “'+c.name+'”? Sản phẩm được giữ lại và chuyển thành Không phân loại.'))return;
  try{
    const {error}=await ddvSupabase.from('product_categories').delete().eq('id',c.id);
    if(error){toast('Chưa xóa được danh mục. Vui lòng kiểm tra quyền hoặc thử lại sau.');return;}
    toast('Đã xóa danh mục; sản phẩm vẫn được giữ lại.');await loadCategoriesAdmin();
  }catch{toast('Kết nối bị gián đoạn. Vui lòng thử lại.');}
}
