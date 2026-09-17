
let adminState={session:null,tab:"dashboard",editProduct:null,editPost:null,editAbout:null};
const sectionKeys=["hero","side_banner","brand_story","bottom_banner"];
const sectionLabels={
  hero:"Trang chủ · Hero Banner",
  side_banner:"Trang chủ · Banner cạnh sản phẩm",
  brand_story:"Trang chủ · Câu chuyện thương hiệu",
  bottom_banner:"Trang chủ · Banner cuối trang",
};

document.addEventListener("DOMContentLoaded",async()=>{
  if(!window.ddvSupabase){
    $("#loginView").classList.add("hidden");
    $("#adminView").classList.remove("hidden");
    $("#demoNotice").classList.remove("hidden");
    showTab("dashboard"); return;
  }
  const {data:{session}}=await ddvSupabase.auth.getSession();
  if(session){adminState.session=session;openAdmin()} else openLogin();
  $("#loginForm")?.addEventListener("submit",login);
});
function openLogin(){$("#loginView").classList.remove("hidden");$("#adminView").classList.add("hidden")}
function openAdmin(){$("#loginView").classList.add("hidden");$("#adminView").classList.remove("hidden");showTab("dashboard")}
async function login(e){
  e.preventDefault(); const fd=new FormData(e.target);
  const {data,error}=await ddvSupabase.auth.signInWithPassword({email:fd.get("email"),password:fd.get("password")});
  if(error){toast("Đăng nhập chưa thành công");return} adminState.session=data.session;openAdmin();
}
async function logout(){if(ddvSupabase)await ddvSupabase.auth.signOut();location.reload()}
function showTab(tab){
  adminState.tab=tab; $$(".admin-menu button").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
  $$(".admin-section").forEach(x=>x.classList.add("hidden")); $("#tab-"+tab)?.classList.remove("hidden");
  const title={dashboard:"Tổng quan",products:"Sản phẩm",orders:"Đơn hàng",posts:"Bài viết",pages:"Trang website",about:"Về chúng tôi",settings:"Cài đặt"}[tab]||"Admin";
  $("#adminTitle").textContent=title;
  if(tab==="dashboard")loadDashboard();
  if(tab==="products")loadProductsAdmin();
  if(tab==="orders")loadOrders();
  if(tab==="posts")loadPostsAdmin();
  if(tab==="pages")loadPageSections();
  if(tab==="about"){loadAboutFixedSections();loadAboutAdmin();}
  if(tab==="settings")loadSettings();
}
async function loadDashboard(){
  if(!ddvSupabase){$("#stats").innerHTML=`<div class="stat"><span>Sản phẩm</span><strong>0</strong></div><div class="stat"><span>Đơn hàng</span><strong>0</strong></div><div class="stat"><span>Bài viết</span><strong>0</strong></div><div class="stat"><span>Chế độ</span><strong>DEMO</strong></div>`;return}
  const [{count:p},{count:o},{count:b}]=await Promise.all([
    ddvSupabase.from("product").select("*",{count:"exact",head:true}),
    ddvSupabase.from("web_orders").select("*",{count:"exact",head:true}),
    ddvSupabase.from("posts").select("*",{count:"exact",head:true})
  ]);
  $("#stats").innerHTML=`<div class="stat"><span>Sản phẩm</span><strong>${p||0}</strong></div><div class="stat"><span>Đơn hàng</span><strong>${o||0}</strong></div><div class="stat"><span>Bài viết</span><strong>${b||0}</strong></div><div class="stat"><span>Hệ thống</span><strong>OK</strong></div>`;
}
async function loadProductsAdmin(){
 const body=$("#productsTable"); if(!body)return;
 if(!ddvSupabase){body.innerHTML=`<tr><td colspan="6">Chế độ demo — kết nối Supabase để quản lý dữ liệu thật.</td></tr>`;return}
 const {data,error}=await ddvSupabase.from("product").select("*").order("created_at",{ascending:false});
 if(error){console.error(error);return}
 body.innerHTML=(data||[]).map(p=>`<tr><td>${p.image_url?`<img src="${p.image_url}" style="width:54px;height:54px;object-fit:cover;border-radius:8px">`:"—"}</td><td>${safe(p.name)}</td><td>${money(p.price)}</td><td>${p.stock??0}</td><td>${p.is_featured?"Nổi bật":"—"}</td><td><button class="btn secondary small" onclick='openProduct(${JSON.stringify(p)})'>Sửa</button> <button class="btn danger small" onclick="deleteProduct(${p.id})">Xóa</button></td></tr>`).join("");
}
function openProduct(p=null){
 adminState.editProduct=p; $("#productModal").classList.remove("hidden");
 const f=$("#productForm"); f.reset();
 if(p){f.id.value=p.id;f.name.value=p.name||"";f.price.value=p.price||0;f.stock.value=p.stock||0;f.description.value=p.description||"";f.product_details.value=p.product_details||"";f.is_featured.checked=!!p.is_featured; $("#productPreview").innerHTML=p.image_url?`<img src="${p.image_url}">`:"Chưa có ảnh";}
 else {f.id.value="";$("#productPreview").innerHTML="Chọn ảnh sản phẩm thật";}
}
function closeModal(id){$("#"+id).classList.add("hidden")}
async function uploadFile(file,bucket,path){
 const ext=(file.name.split(".").pop()||"jpg").toLowerCase();
 const name=`${path}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
 const {error}=await ddvSupabase.storage.from(bucket).upload(name,file,{upsert:false});
 if(error) throw error;
 return ddvSupabase.storage.from(bucket).getPublicUrl(name).data.publicUrl;
}
async function optimizeProductImage(file){
  const bitmap = await createImageBitmap(file);

  const maxSide = 1600;
  let width = bitmap.width;
  let height = bitmap.height;

  const scale = Math.min(
    1,
    maxSide / Math.max(width, height)
  );

  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);

  const toWebP = (quality) =>
    new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => blob
          ? resolve(blob)
          : reject(new Error("Không thể nén ảnh")),
        "image/webp",
        quality
      );
    });

  let blob;

  for(const quality of [0.90, 0.86, 0.82, 0.78]){
    blob = await toWebP(quality);

    if(blob.size <= 500 * 1024){
      break;
    }
  }

  if(bitmap.close){
    bitmap.close();
  }

  const name =
    file.name.replace(/\.[^.]+$/, "") + ".webp";

  return new File(
    [blob],
    name,
    {type:"image/webp"}
  );
}

async function uploadProductImageToR2(file){
  if(!ddvSupabase){
    throw new Error("Chưa kết nối Supabase");
  }

  const {data:{session}} =
    await ddvSupabase.auth.getSession();

  if(!session?.access_token){
    throw new Error("Phiên đăng nhập Admin đã hết hạn");
  }

  const optimized =
    await optimizeProductImage(file);

  const formData = new FormData();
  formData.append("file", optimized);

  const workerUrl =
    window.DDV_CONFIG.R2_WORKER_URL;

  if(!workerUrl){
    throw new Error("Chưa cấu hình R2 Worker");
  }

  const response = await fetch(
    `${workerUrl}/upload?folder=products`,
    {
      method:"POST",
      headers:{
        Authorization:
          `Bearer ${session.access_token}`
      },
      body:formData
    }
  );

  const result =
    await response.json().catch(() => ({}));

  if(!response.ok){
    throw new Error(
      result.error || "Upload ảnh lên R2 thất bại"
    );
  }

  return result;
}
async function saveProduct(e){
  e.preventDefault();

  if(!ddvSupabase){
    toast("Cần kết nối Supabase");
    return;
  }

  const f = e.target;
  const id = f.id.value;

  const files = Array.from(f.image.files || []);

  if(files.length > 8){
    toast("Mỗi sản phẩm chỉ được tối đa 8 ảnh");
    return;
  }

  try{
    let productId = id;

    const payload = {
      name: f.name.value.trim(),
      price: Number(f.price.value || 0),
      stock: Number(f.stock.value || 0),
      description: f.description.value.trim(),
      product_details: f.product_details.value.trim(),
      is_featured: f.is_featured.checked
    };

    // Lưu thông tin sản phẩm trước
    if(productId){
      const {error} = await ddvSupabase
        .from("product")
        .update(payload)
        .eq("id", productId);

      if(error) throw error;
    }else{
      const {data,error} = await ddvSupabase
        .from("product")
        .insert(payload)
        .select()
        .single();

      if(error) throw error;

      productId = data.id;
    }

    // Lấy số ảnh hiện có
    const {data:existingImages,error:existingError} =
      await ddvSupabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order");

    if(existingError) throw existingError;

    const currentCount = existingImages?.length || 0;

    if(currentCount + files.length > 8){
      toast(`Sản phẩm đã có ${currentCount} ảnh. Chỉ có thể thêm tối đa ${8-currentCount} ảnh nữa.`);
      return;
    }

    // Upload từng ảnh sang R2
    for(let i=0;i<files.length;i++){
      const uploaded =
        await uploadProductImageToR2(files[i]);

      const sortOrder = currentCount + i;

      const {error:imageError} =
        await ddvSupabase
          .from("product_images")
          .insert({
            product_id: productId,
            image_url: uploaded.url,
            image_key: uploaded.key,
            sort_order: sortOrder,
            is_primary: sortOrder === 0
          });

      if(imageError) throw imageError;
    }

    // Đồng bộ ảnh chính vào product.image_url
    const {data:firstImage} =
      await ddvSupabase
        .from("product_images")
        .select("image_url")
        .eq("product_id", productId)
        .order("sort_order")
        .limit(1)
        .maybeSingle();

    if(firstImage?.image_url){
      await ddvSupabase
        .from("product")
        .update({
          image_url:firstImage.image_url
        })
        .eq("id",productId);
    }

    closeModal("productModal");
    toast("Đã lưu sản phẩm");
    loadProductsAdmin();

  }catch(err){
    console.error(err);
    toast(err.message || "Chưa lưu được sản phẩm");
  }
}
async function deleteProduct(id){if(!confirm("Xóa sản phẩm này?")||!ddvSupabase)return;const {error}=await ddvSupabase.from("product").delete().eq("id",id);if(error)toast("Không xóa được");else{toast("Đã xóa");loadProductsAdmin()}}
async function loadOrders(){
 const body=$("#ordersTable"); if(!ddvSupabase){body.innerHTML=`<tr><td colspan="7">Chế độ demo.</td></tr>`;return}
 const {data}=await ddvSupabase.from("web_orders").select("*").order("created_at",{ascending:false}).limit(100);
 body.innerHTML=(data||[]).map(o=>`<tr><td>#${o.id}</td><td>${safe(o.customer_name)}</td><td>${safe(o.phone)}</td><td>${money(o.total)}</td><td>${safe(o.status)}</td><td>${new Date(o.created_at).toLocaleString("vi-VN")}</td><td><select onchange="updateOrder(${o.id},this.value)"><option value="">Đổi trạng thái</option><option>new</option><option>confirmed</option><option>shipping</option><option>completed</option><option>cancelled</option></select></td></tr>`).join("");
}
async function updateOrder(id,status){if(!status)return;const {error}=await ddvSupabase.from("web_orders").update({status}).eq("id",id);if(error)toast("Chưa cập nhật được");else{toast("Đã cập nhật");loadOrders()}}
async function loadPostsAdmin(){
 const body=$("#postsTable");if(!ddvSupabase){body.innerHTML=`<tr><td colspan="5">Chế độ demo.</td></tr>`;return}
 const {data}=await ddvSupabase.from("posts").select("*").order("created_at",{ascending:false});
 body.innerHTML=(data||[]).map(p=>`<tr><td>${p.cover_url?`<img src="${p.cover_url}" style="width:70px;height:45px;object-fit:cover;border-radius:8px">`:"—"}</td><td>${safe(p.title)}</td><td>${safe(p.status)}</td><td>${p.published_at?new Date(p.published_at).toLocaleDateString("vi-VN"):"—"}</td><td><button class="btn secondary small" onclick='openPost(${JSON.stringify(p)})'>Sửa</button> <button class="btn danger small" onclick="deletePost(${p.id})">Xóa</button></td></tr>`).join("");
}
function slugify(s){return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function openPost(p=null){
 adminState.editPost=p;$("#postModal").classList.remove("hidden");const f=$("#postForm");f.reset();$("#postEditor").innerHTML="";
 if(p){f.id.value=p.id;f.title.value=p.title||"";f.slug.value=p.slug||"";f.excerpt.value=p.excerpt||"";f.status.value=p.status||"draft";$("#postEditor").innerHTML=p.content_html||"";$("#postPreview").innerHTML=p.cover_url?`<img src="${p.cover_url}">`:"Chưa có ảnh";}
 else{f.id.value="";$("#postPreview").innerHTML="Ảnh bìa bài viết";}
}
function editorCmd(cmd,val=null){document.execCommand(cmd,false,val);$("#postEditor").focus()}
async function insertEditorImage(){
 if(!ddvSupabase){toast("Cần kết nối Supabase");return}
 const inp=document.createElement("input");inp.type="file";inp.accept="image/*";inp.onchange=async()=>{const file=inp.files[0];if(!file)return;try{const url=await uploadFile(file,"post-images","article");document.execCommand("insertImage",false,url)}catch(e){console.error(e);toast("Upload ảnh lỗi")}};inp.click();
}
async function savePost(e){
 e.preventDefault();if(!ddvSupabase){toast("Cần kết nối Supabase");return}
 const f=e.target,id=f.id.value,file=f.cover.files[0];let cover_url=adminState.editPost?.cover_url||"";
 try{if(file)cover_url=await uploadFile(file,"post-images","covers")}catch(err){console.error(err);toast("Upload ảnh lỗi");return}
 const title=f.title.value.trim(),status=f.status.value;
 const payload={title,slug:f.slug.value.trim()||slugify(title),excerpt:f.excerpt.value.trim(),cover_url,content_html:$("#postEditor").innerHTML,status,published_at:status==="published"?(adminState.editPost?.published_at||new Date().toISOString()):null,updated_at:new Date().toISOString()};
 const res=id?await ddvSupabase.from("posts").update(payload).eq("id",id):await ddvSupabase.from("posts").insert(payload);
 if(res.error){console.error(res.error);toast("Chưa lưu được bài");return}
 closeModal("postModal");toast("Đã lưu bài viết");loadPostsAdmin();
}
async function deletePost(id){if(!confirm("Xóa bài viết này?")||!ddvSupabase)return;const {error}=await ddvSupabase.from("posts").delete().eq("id",id);if(error)toast("Không xóa được");else{toast("Đã xóa");loadPostsAdmin()}}
async function loadPageSections(){
 const wrap=$("#sectionsWrap");wrap.innerHTML="";
 let data=[];
 if(ddvSupabase){const r=await ddvSupabase.from("page_sections").select("*").order("sort_order");data=r.data||[]}
 const by={};data.forEach(x=>by[x.section_key]=x);
 const demo=DDV_DEMO.sections;
 sectionKeys.forEach((k,i)=>{
   const x=by[k]||demo[k]||{};
   const card=document.createElement("div");card.className="panel";card.innerHTML=`<div class="panel-head"><h3>${sectionLabels[k]||k}</h3><span class="muted">Nội dung thay được, layout được khóa</span></div>
   <form class="admin-form" onsubmit="saveSection(event,'${k}')">
    <div class="form-group full"><label>Tiêu đề</label><input class="field" name="title" value="${safe(x.title||"")}"></div>
    <div class="form-group full"><label>Mô tả ngắn</label><textarea class="field" name="subtitle">${safe(x.subtitle||"")}</textarea></div>
    <div class="form-group full"><label>Nội dung dài</label><textarea class="field" name="body">${safe(x.body||"")}</textarea></div>
    <div class="form-group"><label>Chữ nút</label><input class="field" name="button_text" value="${safe(x.button_text||"")}"></div>
    <div class="form-group"><label>Link nút</label><input class="field" name="button_url" value="${safe(x.button_url||"")}"></div>
    <div class="form-group full"><label>Thay ảnh</label><input class="field" type="file" name="image" accept="image/*"><input type="hidden" name="old_image" value="${safe(x.image_url||"")}"></div>
    <div class="form-group full"><div class="preview-box">${x.image_url?`<img src="${resolvePath(x.image_url)}">`:"Chưa có ảnh"}</div></div>
    <div class="full"><button class="btn primary">Lưu thay đổi</button></div>
   </form>`;wrap.appendChild(card);
 });
}
async function saveSection(e,key){
 e.preventDefault();if(!ddvSupabase){toast("Cần kết nối Supabase");return}
 const f=e.target,file=f.image.files[0];let image_url=f.old_image.value||"";
 try{if(file)image_url=await uploadFile(file,"site-media","pages/"+key)}catch(err){console.error(err);toast("Upload ảnh lỗi");return}
 const payload={section_key:key,title:f.title.value.trim(),subtitle:f.subtitle.value.trim(),body:f.body.value.trim(),button_text:f.button_text.value.trim(),button_url:f.button_url.value.trim(),image_url,is_active:true,sort_order:sectionKeys.indexOf(key)+1,updated_at:new Date().toISOString()};
 const {error}=await ddvSupabase.from("page_sections").upsert(payload,{onConflict:"section_key"});
 if(error){console.error(error);toast("Chưa lưu được");return}toast("Đã cập nhật giao diện");loadPageSections();
}


const ABOUT_PRESET_IMAGES=[
  {url:"assets/images/about-story-default.webp",label:"Cao nguyên · Câu chuyện"},
  {url:"assets/images/about-mission-default.webp",label:"Nông trại · Điểm nhấn"},
  {url:"assets/images/about-vision-default.webp",label:"Chân trời · Tầm nhìn"}
];

function renderAboutPresets(selected=""){
  const wrap=$("#aboutPresetImages");
  if(!wrap)return;
  wrap.innerHTML=ABOUT_PRESET_IMAGES.map(x=>`
    <button type="button" class="about-preset-item ${selected===x.url?"active":""}" onclick="chooseAboutPreset('${x.url}')">
      <img src="${resolvePath(x.url)}" alt="">
      <span>${x.label}</span>
    </button>
  `).join("");
}
function chooseAboutPreset(url){
  const f=$("#aboutForm");
  if(!f)return;
  f.old_image.value=url;
  f.image.value="";
  $("#aboutPreview").innerHTML=`<img src="${resolvePath(url)}">`;
  renderAboutPresets(url);
}


const ABOUT_FIXED_KEYS=["about_hero","about_story_meta","about_values_intro","about_closing"];
const ABOUT_FIXED_LABELS={
  about_hero:"Phần mở đầu",
  about_story_meta:"Câu chuyện thương hiệu · nhãn & slogan",
  about_values_intro:"Giá trị cốt lõi · tiêu đề giới thiệu",
  about_closing:"Khối kết trang"
};
const ABOUT_FIXED_HINTS={
  about_hero:"Có thể sửa breadcrumb, dòng nhỏ, tiêu đề, mô tả và ảnh nền.",
  about_story_meta:"Có thể sửa dòng nhỏ phía trên câu chuyện và slogan dưới nội dung.",
  about_values_intro:"Có thể sửa dòng nhỏ, tiêu đề và đoạn mô tả phía trên 3 giá trị.",
  about_closing:"Có thể sửa dòng nhỏ, câu kết, chữ nút và link nút."
};

async function loadAboutFixedSections(){
  const wrap=$("#aboutFixedSections");
  if(!wrap)return;
  const sec=await ddvApi.sections();
  wrap.innerHTML="";
  ABOUT_FIXED_KEYS.forEach(k=>{
    const s=sec[k]||{};
    const heroFields=k==="about_hero";
    const closingFields=k==="about_closing";
    wrap.insertAdjacentHTML("beforeend",`
      <form class="about-fixed-card" data-key="${k}" onsubmit="saveAboutFixedSection(event,'${k}')">
        <div class="panel-head">
          <div>
            <h3>${ABOUT_FIXED_LABELS[k]}</h3>
            <span class="muted">${ABOUT_FIXED_HINTS[k]}</span>
          </div>
        </div>
        <div class="admin-form">
          <div class="form-group full">
            <label>${heroFields?"Tiêu đề chính":"Tiêu đề"}</label>
            <input class="field" name="title" value="${safe(s.title||"")}">
          </div>
          <div class="form-group full">
            <label>${heroFields?"Breadcrumb / dòng phụ":"Dòng nhỏ phía trên"}</label>
            <input class="field" name="subtitle" value="${safe(s.subtitle||"")}">
          </div>
          <div class="form-group full">
            <label>${k==="about_story_meta"?"Slogan / câu nhấn":"Nội dung mô tả"}</label>
            <textarea class="field" name="body" rows="4">${safe(s.body||"")}</textarea>
          </div>
          ${heroFields?`
          <div class="form-group full">
            <label>Dòng nhỏ trên tiêu đề</label>
            <input class="field" name="button_text" value="${safe(s.button_text||"")}">
          </div>
          <div class="form-group full">
            <label>Ảnh nền phần mở đầu</label>
            <input class="field" type="file" name="image" accept="image/*">
            <input type="hidden" name="old_image" value="${safe(s.image_url||"")}">
            <div class="preview-box fixed-preview">${s.image_url?`<img src="${resolvePath(s.image_url)}">`:"Chưa có ảnh"}</div>
          </div>`:""}
          ${closingFields?`
          <div class="form-group">
            <label>Chữ nút</label>
            <input class="field" name="button_text" value="${safe(s.button_text||"")}">
          </div>
          <div class="form-group">
            <label>Link nút</label>
            <input class="field" name="button_url" value="${safe(s.button_url||"")}">
          </div>`:""}
          <div class="full"><button class="btn primary">Lưu phần này</button></div>
        </div>
      </form>
    `);
  });

  wrap.querySelectorAll('input[type="file"]').forEach(inp=>{
    inp.onchange=()=>{
      const file=inp.files?.[0];
      if(!file)return;
      const preview=inp.closest(".form-group").querySelector(".fixed-preview");
      preview.innerHTML=`<img src="${URL.createObjectURL(file)}">`;
    };
  });
}

async function saveAboutFixedSection(e,key){
  e.preventDefault();
  if(!ddvSupabase){toast("Cần kết nối Supabase để lưu thay đổi");return}
  const f=e.target;
  const current=(await ddvApi.sections())[key]||{};
  let image_url=current.image_url||f.old_image?.value||"";
  const file=f.image?.files?.[0];
  try{
    if(file) image_url=await uploadFile(file,"site-media","about");
  }catch(err){
    console.error(err);toast("Upload ảnh lỗi");return;
  }
  const payload={
    section_key:key,
    title:f.title?.value?.trim()||null,
    subtitle:f.subtitle?.value?.trim()||null,
    body:f.body?.value?.trim()||null,
    image_url:image_url||null,
    button_text:f.button_text?.value?.trim()||null,
    button_url:f.button_url?.value?.trim()||null,
    is_active:true
  };
  const {error}=await ddvSupabase.from("page_sections").upsert(payload,{onConflict:"section_key"});
  if(error){console.error(error);toast("Chưa lưu được");return}
  toast("Đã lưu thay đổi");
  loadAboutFixedSections();
}

function aboutTypeLabel(t){
  return {
    story:"Câu chuyện doanh nghiệp",
    mission:"Sứ mệnh",
    vision:"Tầm nhìn",
    value:"Giá trị / nền tảng",
    content:"Nội dung thường"
  }[t] || t;
}

async function loadAboutAdmin(){
  const wrap=$("#aboutBlocksAdmin");
  if(!wrap)return;
  if(!ddvSupabase){
    const data=DDV_DEMO.about_blocks||[];
    wrap.innerHTML=data.map(x=>aboutAdminCard(x,true)).join("");
    return;
  }
  const {data,error}=await ddvSupabase.from("about_blocks").select("*").order("sort_order",{ascending:true}).order("id",{ascending:true});
  if(error){console.error(error);wrap.innerHTML='<p class="muted">Không tải được nội dung Về chúng tôi.</p>';return}
  wrap.innerHTML=(data||[]).length ? (data||[]).map(x=>aboutAdminCard(x,false)).join("") : '<div class="empty-state">Chưa có nội dung. Bấm “+ Thêm nội dung” để tạo mới.</div>';
}

function aboutAdminCard(x,demo=false){
  const image=x.image_url?`<img src="${resolvePath(x.image_url)}" alt="">`:`<div class="about-admin-noimage">Không ảnh</div>`;
  const serialized=encodeURIComponent(JSON.stringify(x));
  return `<article class="about-admin-card">
    <div class="about-admin-thumb">${image}</div>
    <div class="about-admin-copy">
      <div class="about-admin-meta"><span class="badge">${safe(aboutTypeLabel(x.block_type))}</span><span>Thứ tự ${x.sort_order??0}</span><span>${x.is_active===false?"Đang ẩn":"Đang hiển thị"}</span></div>
      <h4>${safe(x.title||"(Không tiêu đề)")}</h4>
      <p>${safe((x.body||"").slice(0,180))}${(x.body||"").length>180?"…":""}</p>
    </div>
    <div class="about-admin-actions">
      <button class="btn secondary small" ${demo?'disabled title="Kết nối Supabase để sửa dữ liệu thật"':`onclick="openAboutBlock(JSON.parse(decodeURIComponent('${serialized}')))"`}>Sửa</button>
      <button class="btn danger small" ${demo?'disabled title="Kết nối Supabase để xóa dữ liệu thật"':`onclick="deleteAboutBlock(${x.id})"`}>Xóa</button>
    </div>
  </article>`;
}

function openAboutBlock(x=null){
  if(!ddvSupabase){toast("Cần kết nối Supabase để thêm/sửa nội dung thật");return}
  adminState.editAbout=x;
  const modal=$("#aboutModal"),f=$("#aboutForm");
  modal.classList.remove("hidden");
  f.reset();
  f.id.value=x?.id||"";
  f.block_type.value=x?.block_type||"content";
  f.sort_order.value=x?.sort_order??10;
  f.title.value=x?.title||"";
  f.body.value=x?.body||"";
  f.old_image.value=x?.image_url||"";
  f.is_active.checked=x?.is_active!==false;
  $("#aboutModalTitle").textContent=x?"Sửa nội dung Về chúng tôi":"Thêm nội dung Về chúng tôi";
  $("#aboutPreview").innerHTML=x?.image_url?`<img src="${resolvePath(x.image_url)}">`:"Chưa có ảnh";
  renderAboutPresets(x?.image_url||"");
  const imageInput=f.image;
  imageInput.onchange=()=>{
    const file=imageInput.files?.[0];
    if(!file)return;
    const url=URL.createObjectURL(file);
    $("#aboutPreview").innerHTML=`<img src="${url}">`;
    renderAboutPresets("");
  };
}

async function saveAboutBlock(e){
  e.preventDefault();
  if(!ddvSupabase){toast("Cần kết nối Supabase");return}
  const f=e.target;
  const id=f.id.value;
  const file=f.image.files[0];
  let image_url=f.old_image.value||"";
  try{
    if(file) image_url=await uploadFile(file,"site-media","about");
  }catch(err){
    console.error(err);toast("Upload ảnh lỗi");return;
  }
  const payload={
    block_type:f.block_type.value,
    title:f.title.value.trim(),
    body:f.body.value.trim(),
    image_url,
    sort_order:Number(f.sort_order.value||0),
    is_active:f.is_active.checked,
    updated_at:new Date().toISOString()
  };
  const res=id
    ? await ddvSupabase.from("about_blocks").update(payload).eq("id",id)
    : await ddvSupabase.from("about_blocks").insert(payload);
  if(res.error){console.error(res.error);toast("Chưa lưu được nội dung");return}
  closeModal("aboutModal");
  toast(id?"Đã sửa nội dung":"Đã thêm nội dung");
  loadAboutAdmin();
}

async function deleteAboutBlock(id){
  if(!ddvSupabase || !confirm("Xóa nội dung này khỏi trang Về chúng tôi?"))return;
  const {error}=await ddvSupabase.from("about_blocks").delete().eq("id",id);
  if(error){console.error(error);toast("Không xóa được nội dung");return}
  toast("Đã xóa nội dung");
  loadAboutAdmin();
}

async function loadSettings(){
 const f=$("#settingsForm");const s=await ddvApi.settings();
 ["brand_name","phone","email","address","facebook_url","tiktok_url","shopee_url","zalo_url","support_hours"].forEach(k=>{if(f[k])f[k].value=s[k]||""});
}
async function saveSettings(e){
 e.preventDefault();if(!ddvSupabase){toast("Cần kết nối Supabase");return}
 const f=e.target,p={id:1};["brand_name","phone","email","address","facebook_url","tiktok_url","shopee_url","zalo_url","support_hours"].forEach(k=>p[k]=f[k].value.trim());
 const {error}=await ddvSupabase.from("site_settings").upsert(p,{onConflict:"id"});
 if(error){console.error(error);toast("Chưa lưu được");return}toast("Đã lưu thông tin doanh nghiệp");
}
