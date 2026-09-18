// Shared homepage/catalog/related card; names and URLs use DOM setters.
function productCard(p){
  const card=document.createElement('article');card.className='product-card';
  const href='product.html?id='+encodeURIComponent(p.id);
  const link=document.createElement('a');link.href=href;link.setAttribute('aria-label',p.name||'Chi tiết sản phẩm');
  const media=document.createElement('div');media.className='product-image';
  if(p.image_url){const image=document.createElement('img');image.src=p.image_url;image.alt=p.name||'';image.loading='lazy';media.append(image);}
  else{const placeholder=document.createElement('div');placeholder.className='product-placeholder';placeholder.textContent='Chưa có ảnh';media.append(placeholder);}
  link.append(media);card.append(link);
  const info=document.createElement('div');info.className='product-info';
  const name=document.createElement('h3');name.textContent=p.name||'';
  const price=document.createElement('div');price.className='price';price.innerHTML=priceMarkup(p);
  const actions=document.createElement('div');actions.className='actions';
  const detail=document.createElement('a');detail.href=href;detail.className='btn secondary small card-detail';detail.textContent='Xem chi tiết';
  const add=document.createElement('button');add.type='button';add.className='btn primary small card-add';add.textContent='+ Giỏ hàng';add.onclick=()=>addToCart(p,1);
  const buy=document.createElement('button');buy.type='button';buy.className='btn gold small card-buy-now';buy.textContent='Mua ngay';buy.onclick=()=>{addToCart(p,1);location.href='cart.html#checkoutForm';};
  actions.append(detail,add,buy);info.append(name,price,actions);card.append(info);return card;
}
function isPublicProduct(p){return p.visibility==='visible'&&!p.deleted_at;}
async function renderRelatedProducts(current){
  const section=document.querySelector('#relatedProductsSection'),grid=document.querySelector('#relatedProducts');
  if(!section||!grid)return;
  grid.replaceChildren();section.hidden=true;
  try{
    const items=await ddvApi.relatedProducts(current);
    items.forEach(p=>grid.append(productCard(p)));
    section.hidden=!items.length;
  }catch{ /* Related recommendations must not interrupt gallery/cart. */ }
}
