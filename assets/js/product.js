
document.addEventListener("DOMContentLoaded",async()=>{
  const id=urlParam("id"); const box=$("#productDetail");
  if(!id||!box){return}
  const p=await ddvApi.product(id);
  if(!p){box.innerHTML=`<p class="muted">Không tìm thấy sản phẩm.</p>`;return}
  document.title=p.name+" | DON DUONG VILLAGE";
  box.innerHTML=`
   <div>
     <div class="gallery-main">${p.image_url?`<img src="${safe(p.image_url)}" alt="${safe(p.name)}">`:`<div class="product-placeholder">Chưa có ảnh sản phẩm</div>`}</div>
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
