
let allProducts=[];
document.addEventListener("DOMContentLoaded",async()=>{
  allProducts=await ddvApi.products();
  render(allProducts);
  $("#productSearch")?.addEventListener("input",e=>{
    const q=e.target.value.toLowerCase().trim();
    render(allProducts.filter(p=>(p.name||"").toLowerCase().includes(q)||(p.description||"").toLowerCase().includes(q)));
  });
});
function render(items){
  const grid=$("#productGrid"); if(!grid) return; grid.innerHTML="";
  if(!items.length){grid.innerHTML=`<p class="muted">Chưa có sản phẩm. Hãy thêm sản phẩm trong Admin.</p>`;return}
  items.forEach(p=>{
    const card=document.createElement("article");card.className="product-card";
    card.innerHTML=`<a href="product.html?id=${p.id}"><div class="product-image">${p.image_url?`<img src="${safe(p.image_url)}" alt="${safe(p.name)}">`:`<div class="product-placeholder">Chưa có ảnh</div>`}</div></a>
    <div class="product-info"><h3>${safe(p.name)}</h3><div class="price">${priceMarkup(p)}</div><div class="actions"><a class="btn secondary small" href="product.html?id=${p.id}">Chi tiết</a><button class="btn primary small">+ Giỏ hàng</button></div></div>`;
    card.querySelector("button").onclick=()=>addToCart(p,1);grid.appendChild(card);
  });
}
