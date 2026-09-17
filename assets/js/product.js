
document.addEventListener("DOMContentLoaded",async()=>{
  const id=urlParam("id"); const box=$("#productDetail");
  if(!id||!box){return}
  const p=await ddvApi.product(id);
  if(!p){box.innerHTML=`<p class="muted">Không tìm thấy sản phẩm.</p>`;return}
  let productImages = [];

if(ddvSupabase){
  const {data, error} = await ddvSupabase
    .from("product_images")
    .select("image_url, sort_order, is_primary")
    .eq("product_id", id)
    .order("sort_order", {ascending:true});

  if(!error && data){
    productImages = data;
  }
}

const imageUrls = productImages.length
  ? productImages.map(item => item.image_url).filter(Boolean)
  : (p.image_url ? [p.image_url] : []);

const mainImage = imageUrls[0] || "";
  const thumbnailsHtml = imageUrls.length > 1
  ? `<div class="product-thumbnails">
      ${imageUrls.map((url, index) => `
        <button
          type="button"
          class="product-thumb ${index === 0 ? "active" : ""}"
          data-index="${index}"
        >
          <img
            src="${safe(url)}"
            alt="${safe(p.name)} - ảnh ${index + 1}"
          >
        </button>
      `).join("")}
    </div>`
  : "";
  document.title=p.name+" | DON DUONG VILLAGE";
  box.innerHTML=`
  <div>
  <div class="gallery-main">
    ${mainImage
      ? `<img id="productMainImage" src="${safe(mainImage)}" alt="${safe(p.name)}">`
      : `<div class="product-placeholder">Chưa có ảnh sản phẩm</div>`}
  </div>

  ${thumbnailsHtml}
</div>
   <div>
     <div class="eyebrow">DON DUONG VILLAGE</div>
     <h1 class="detail-title">${safe(p.name)}</h1>
     <div class="detail-price">${money(p.price)}</div>
     <div class="stock-ok">${Number(p.stock||0)>0?`Còn hàng · ${p.stock} sản phẩm`:"Tạm hết hàng"}</div>
     <p>${safe(p.description||"Thông tin sản phẩm đang được cập nhật.")}</p>
     <div class="qty"><button id="minus">−</button><span id="qv">1</span><button id="plus">+</button></div>
     <div><button id="addBtn" class="btn primary">Thêm vào giỏ hàng →</button></div>
   </div>`;
  const mainImg = $("#productMainImage");
const thumbButtons = [...document.querySelectorAll(".product-thumb")];

thumbButtons.forEach(btn => {
  btn.onclick = () => {
    const index = Number(btn.dataset.index);

    if(!mainImg || !imageUrls[index]) return;

    mainImg.src = imageUrls[index];

    thumbButtons.forEach(item => {
      item.classList.remove("active");
    });

    btn.classList.add("active");
  };
});
  setupProductGallery(imageUrls,p.name);
  const detailsEl = $("#productDetails");
const infoSection = $("#productInfoSection");

if(detailsEl && infoSection){
  const details = (p.product_details || "").trim();

  if(details){
    detailsEl.textContent = details;
    detailsEl.style.whiteSpace = "pre-line";
  }else{
    infoSection.style.display = "none";
  }
}
  let q=1;$("#minus").onclick=()=>{$("#qv").textContent=q=Math.max(1,q-1)};$("#plus").onclick=()=>{$("#qv").textContent=++q};
  const add=()=>addToCart(p,q);
  $("#addBtn").onclick=add;

  const mobileBar=document.createElement("div");
  mobileBar.className="mobile-product-bar";
  mobileBar.innerHTML=`<div class="mobile-product-price">${money(p.price)}</div><button class="btn primary">Thêm vào giỏ hàng</button>`;
  mobileBar.querySelector("button").onclick=add;
  document.body.appendChild(mobileBar);
  document.body.classList.add("has-mobile-product-bar");
});

