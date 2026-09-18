
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

function money(v){
  const n=Number(v||0);
  return n.toLocaleString("vi-VN")+"đ";
}
function safe(v){ return (v??"").toString(); }
function urlParam(name){ return new URLSearchParams(location.search).get(name); }

function cartGet(){try{return JSON.parse(localStorage.getItem("ddv_cart")||"[]")}catch{return []}}
function cartSave(c){localStorage.setItem("ddv_cart",JSON.stringify(c));updateCartCount()}
function updateCartCount(){const el=$("#cartCount"); if(el) el.textContent=cartGet().reduce((a,x)=>a+Number(x.qty||0),0)}
function addToCart(product,qty=1){
  const c=cartGet(), id=String(product.id);
  const found=c.find(x=>String(x.id)===id);
  if(found){found.qty=Number(found.qty)+Number(qty);found.price=effectivePrice(product);} else c.push({id:product.id,name:product.name,price:effectivePrice(product),image_url:product.image_url||"",qty});
  cartSave(c); toast("Đã thêm vào giỏ hàng");
}
function toast(msg){
  const el=document.createElement("div"); el.className="toast"; el.textContent=msg; document.body.appendChild(el);
  setTimeout(()=>el.remove(),2200);
}
function resolvePath(p){
  if(!p) return "";
  if(/^https?:\/\//.test(p)||p.startsWith("data:")||p.startsWith("/")) return p;
  const inAdmin=location.pathname.includes("/admin/");
  return inAdmin ? "../"+p : p;
}
async function applyGlobal(){
  const settings=await ddvApi.settings();
  const phone=settings.phone||"";
  const email=settings.email||"";
  $$(".js-phone").forEach(el=>{el.textContent=phone||"SĐT cập nhật sau"; if(el.tagName==="A") el.href=phone?"tel:"+phone.replace(/\s/g,""):"#"});
  $$(".js-email").forEach(el=>{el.textContent=email||"Email cập nhật sau"; if(el.tagName==="A") el.href=email?"mailto:"+email:"#"});
  const support=$(".js-support"); if(support) support.textContent=settings.support_hours||"";
  const map={facebook:settings.facebook_url,tiktok:settings.tiktok_url,shopee:settings.shopee_url,zalo:settings.zalo_url};
  Object.entries(map).forEach(([k,v])=>$$(`[data-social="${k}"]`).forEach(el=>{el.href=v||"#"; el.style.display=v?"inline-flex":"none"}));
  updateCartCount();
}
function toggleMenu(){
  const n=$("#navLinks");
  if(!n) return;
  n.classList.toggle("open");
}
document.addEventListener("DOMContentLoaded",()=>{
  applyGlobal();
  const nav=$("#navLinks");
  if(nav){
    nav.addEventListener("click",e=>{
      if(e.target.closest("a")) nav.classList.remove("open");
    });
  }
  window.addEventListener("resize",()=>{
    if(window.innerWidth>760 && nav) nav.classList.remove("open");
  });
});
