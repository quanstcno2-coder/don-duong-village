
document.addEventListener("DOMContentLoaded",async()=>{
  const posts=await ddvApi.posts(); const grid=$("#blogGrid"); if(!grid)return;
  grid.innerHTML="";
  if(!posts.length){grid.innerHTML=`<p class="muted">Chưa có bài viết. Bạn có thể đăng từ Admin.</p>`;return}
  posts.forEach(p=>{
    const a=document.createElement("article");a.className="post-card";
    a.innerHTML=`<a href="article.html?slug=${encodeURIComponent(p.slug)}"><div class="post-cover">${p.cover_url?`<img src="${safe(p.cover_url)}" alt="${safe(p.title)}">`:""}</div></a>
      <div class="post-body"><div class="post-meta">${p.published_at?new Date(p.published_at).toLocaleDateString("vi-VN"):""}</div><h3>${safe(p.title)}</h3><p>${safe(p.excerpt||"")}</p><a class="btn secondary small" href="article.html?slug=${encodeURIComponent(p.slug)}">Đọc bài →</a></div>`;
    grid.appendChild(a);
  });
});
