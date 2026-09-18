let allProducts=[],selectedCategory='';
document.addEventListener('DOMContentLoaded',async()=>{
  const [products,categories]=await Promise.all([ddvApi.products(),ddvApi.categories()]);
  allProducts=products.filter(isPublicProduct);
  const menu=$('#categoryFilters');menu.replaceChildren();
  const button=(label,id)=>{
    const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.category=id;b.className='category-filter';
    b.onclick=()=>{selectedCategory=id;applyProductFilters();};menu.append(b);
  };
  button('Tất cả sản phẩm','');
  categories.filter(c=>c.is_active).forEach(c=>button(c.name,String(c.id)));
  $('#productSearch')?.addEventListener('input',applyProductFilters);applyProductFilters();
});
function applyProductFilters(){
  const q=($('#productSearch')?.value||'').toLocaleLowerCase('vi-VN').trim();
  const items=allProducts.filter(p=>(!selectedCategory||String(p.category_id)===selectedCategory)&&((p.name||'').toLocaleLowerCase('vi-VN').includes(q)||(p.description||'').toLocaleLowerCase('vi-VN').includes(q)));
  $$('.category-filter').forEach(b=>{const active=b.dataset.category===selectedCategory;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  render(items);
}
function render(items){
  const grid=$('#productGrid');if(!grid)return;grid.replaceChildren();
  if(!items.length){const message=document.createElement('p');message.className='muted';message.textContent='Không có sản phẩm phù hợp.';grid.append(message);return;}
  items.forEach(p=>grid.append(productCard(p)));
}
