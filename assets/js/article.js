
document.addEventListener("DOMContentLoaded",async()=>{
  const slug=urlParam("slug"), box=$("#articleBox"); if(!slug||!box)return;
  const p=await ddvApi.post(slug); if(!p){box.innerHTML=`<p class="muted">Không tìm thấy bài viết.</p>`;return}
  document.title=p.title+" | DON DUONG VILLAGE";
  box.innerHTML=`<div class="eyebrow">KIẾN THỨC SỨC KHỎE</div><h1>${safe(p.title)}</h1><div class="post-meta">${p.published_at?new Date(p.published_at).toLocaleDateString("vi-VN"):""}</div>
    ${p.cover_url?`<div class="article-cover"><img src="${safe(p.cover_url)}" alt="${safe(p.title)}"></div>`:""}<div class="article-content">${p.content_html||""}</div>`;
});
