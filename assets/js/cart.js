
document.addEventListener("DOMContentLoaded",()=>{
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
  if(!await refreshCartPrices())return;
  renderCart();
  const cart=cartGet(); if(!cart.length){toast("Giỏ hàng đang trống");return}
  const fd=new FormData(e.target), customer=Object.fromEntries(fd.entries());
  const total=cart.reduce((s,x)=>s+x.price*x.qty,0);
  if(!window.ddvSupabase){toast("Bản demo: cần kết nối Supabase để lưu đơn hàng");return}
  const {data:order,error}=await ddvSupabase.from("web_orders").insert({
    customer_name:customer.customer_name, phone:customer.phone, email:customer.email||null,
    address:customer.address, note:customer.note||null, subtotal:total,total:total,status:"new",payment_status:"unpaid"
  }).select().single();
  if(error){toast("Chưa lưu được đơn hàng");console.error(error);return}
  const rows=cart.map(x=>({order_id:order.id,product_id:x.id,product_name:x.name,quantity:x.qty,unit_price:x.price,line_total:x.qty*x.price}));
  const {error:itemErr}=await ddvSupabase.from("web_order_items").insert(rows);
  if(itemErr){toast("Đơn đã tạo nhưng có lỗi chi tiết");console.error(itemErr);return}
  cartSave([]);e.target.reset();renderCart();toast("Đặt hàng thành công");
}
