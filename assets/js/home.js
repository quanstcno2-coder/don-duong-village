
document.addEventListener("DOMContentLoaded",async()=>{
  const sec=await ddvApi.sections();

  $("#featuredSubtitle").textContent=sec.featured_intro?.title??DDV_DEMO.sections.featured_intro.title;
  $("#storyEyebrow").textContent=sec.story_labels?.title??DDV_DEMO.sections.story_labels.title;
  $("#storyImageLine").textContent=sec.story_labels?.body??DDV_DEMO.sections.story_labels.body;
  const hero=sec.hero||{};
  const heroEl=$("#hero");
  if(heroEl){
    heroEl.style.backgroundImage=`url('${resolvePath(hero.image_url||"assets/images/hero-main.png")}')`;
    $("#heroTitle").textContent=hero.title||"";
    $("#heroSub").textContent=hero.subtitle||"";
    const b=$("#heroBtn");
    b.textContent=(hero.button_text||"Khám phá sản phẩm")+" →";
    b.href=hero.button_url||"products.html";
    $("#heroQuote").innerHTML=(hero.body||"Sức khỏe<br>bắt đầu từ<br>những lựa chọn nhỏ<br>mỗi ngày").replace(/\n/g,"<br>");
  }

  const side=sec.side_banner||{};
  const sideBg=$("#sideBannerBg");
  if(sideBg) sideBg.style.backgroundImage=`url('${resolvePath(side.image_url||"assets/images/side-banner.png")}')`;
  if($("#sideBannerTitle")) $("#sideBannerTitle").textContent=side.title||"Quà sức khỏe từ cao nguyên Lâm Đồng";
  if($("#sideBannerSub")) $("#sideBannerSub").textContent=side.subtitle||"Một khoảng dành cho chiến dịch nổi bật hoặc quà tặng theo mùa.";
  const sbt=$("#sideBannerBtn");
  if(sbt){
    sbt.textContent=(side.button_text||"Xem sản phẩm")+" →";
    sbt.href=side.button_url||"products.html";
  }

  const story=sec.brand_story||{};
  const sm=$("#storyMedia");
  if(sm) sm.style.backgroundImage=`url('${resolvePath(story.image_url||"assets/images/story-main.png")}')`;
  if($("#storyTitle")) $("#storyTitle").textContent=story.title||"";
  if($("#storySub")) $("#storySub").textContent=story.subtitle||"";
  if($("#storyBody")) $("#storyBody").textContent=story.body||"";
  const storyBtn=$("#storyBtn");
  if(storyBtn){
    storyBtn.textContent=(story.button_text||"Tìm hiểu thêm")+" →";
    storyBtn.href=story.button_url||"about.html";
  }

  const bb=sec.bottom_banner||{};
  const be=$("#bottomBanner");
  if(be) be.style.backgroundImage=`url('${resolvePath(bb.image_url||"assets/images/bottom-banner.png")}')`;
  if($("#bottomTitle")) $("#bottomTitle").textContent=bb.title||"";
  const bbtn=$("#bottomBtn");
  if(bbtn){
    bbtn.textContent=(bb.button_text||"Khám phá ngay")+" →";
    bbtn.href=bb.button_url||"products.html";
  }

  const products=await ddvApi.products({featured:true,limit:3});
  const grid=$("#featuredProducts");
  if(grid){
    grid.innerHTML="";
    if(!products.length){
      for(let i=0;i<3;i++){
        grid.insertAdjacentHTML("beforeend",`
          <article class="product-card">
            <div class="product-image"><div class="product-placeholder">Ảnh sản phẩm thật<br>sẽ hiển thị tại đây</div></div>
            <div class="product-info"><h3>Sản phẩm đang cập nhật</h3><p class="muted">Bạn sẽ thêm từ Admin mà không sửa code.</p></div>
          </article>
        `);
      }
    } else {
      products.forEach(p=>grid.appendChild(productCard(p)));
    }
  }
});

function productCard(p){
  const a=document.createElement("article");
  a.className="product-card";
  const img=p.image_url?`<img src="${safe(p.image_url)}" alt="${safe(p.name)}">`:`<div class="product-placeholder">Chưa có ảnh</div>`;
  a.innerHTML=`
    <a href="product.html?id=${p.id}">
      <div class="product-image">${img}</div>
    </a>
    <div class="product-info">
      <h3>${safe(p.name)}</h3>
      <div class="price">${priceMarkup(p)}</div>
      <div class="actions">
        <a class="btn secondary small" href="product.html?id=${p.id}">Xem chi tiết</a>
        <button class="btn primary small">+ Giỏ hàng</button>
      </div>
    </div>
  `;
  a.querySelector("button").onclick=()=>addToCart(p,1);
  return a;
}
