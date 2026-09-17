
document.addEventListener("DOMContentLoaded",async()=>{
  await refreshCartPrices();
  renderCart();
  $("#checkoutForm")?.addEventListener("submit",submitOrder);
});
function renderCart(){
  const cart=cartGet(), list=$("#cartList"), summary=$("#cartSummary");
  if(!list)return;
  list.innerHTML="";
  if(!cart.length){list.innerHTML=`<p class="muted">Giỏ hàng đang trống.</p>`}
  cart.forEach((x,i)=>{
    const row=document.createElement("div");row.className="cart-item";
    row.innerHTML=`<div class="cart-thumb">${x.image_url?`<img src="${safe(x.image_url)}">`:""}</div>
      <div><b>${safe(x.name)}</b><div class="price">${money(x.price)}</div><div class="qty"><button data-d="-1">−</button><span>${x.qty}</span><button data-d="1">+</button></div></div>
      <div class="item-actions"><button class="btn danger small">Xóa</button></div>`;
    row.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{x.qty=Math.max(1,x.qty+Number(b.dataset.d));cartSave(cart);renderCart()});
    row.querySelector(".danger").onclick=()=>{cart.splice(i,1);cartSave(cart);renderCart()};list.appendChild(row);
  });
  const total=cart.reduce((s,x)=>s+x.price*x.qty,0);
  if(summary) summary.innerHTML=`<div class="total-row"><span>Tạm tính</span><b>${money(total)}</b></div><div class="total-row grand"><span>Tổng cộng</span><span>${money(total)}</span></div>`;
}
async function refreshCartPrices(){
  if(!window.ddvSupabase)return true;
  const cart=cartGet();
  for(const item of cart){
    const p=await ddvApi.product(item.id);
    if(!p){toast("Có sản phẩm không còn bán. Vui lòng xóa khỏi giỏ hàng.");return false;}
    item.price=effectivePrice(p);item.name=p.name;
  }
  cartSave(cart);return true;
}
async function submitOrder(e){
  e.preventDefault();
  const button=e.target.querySelector('button[type="submit"],button:not([type])');
  if(button?.disabled)return;
  if(button)button.disabled=true;
  try{
    if(!window.ddvSupabase){toast('Bản demo: cần kết nối Supabase để lưu đơn hàng');return;}
    if(!await refreshCartPrices())return;
    renderCart();
    const cart=cartGet();if(!cart.length){toast('Giỏ hàng đang trống');return;}
    const customer=Object.fromEntries(new FormData(e.target).entries());
    const {error}=await ddvSupabase.rpc('ddv_checkout',{p_customer:customer,p_items:cart.map(x=>({id:x.id,qty:x.qty}))});
    if(error){toast('Chưa đặt được hàng. Kiểm tra thông tin, tồn kho và kết nối hệ thống.');return;}
    cartSave([]);e.target.reset();renderCart();toast('Đặt hàng thành công');
  }catch{toast('Kết nối bị gián đoạn. Hãy kiểm tra đơn với cửa hàng trước khi gửi lại.');}
  finally{if(button)button.disabled=false;}
}

