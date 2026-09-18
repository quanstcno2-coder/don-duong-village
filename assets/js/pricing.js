function discountPercent(product){
  const value=Number(product.discount_percent||0);
  return Number.isFinite(value)?Math.min(100,Math.max(0,value)):0;
}
function effectivePrice(product){
  const price=Number(product.price||0);
  return Number.isFinite(price)?Math.round(Math.max(0,price)*(100-discountPercent(product))/100):0;
}
function priceMarkup(product){
  const discount=discountPercent(product);
  return (discount?'<span class="discount-badge">-'+discount+'%</span> <del>'+money(product.price)+'</del> ':'')+'<strong>'+money(effectivePrice(product))+'</strong>';
}
function updateSalePreview(){
  const f=document.querySelector('#productForm');
  document.querySelector('#salePricePreview').textContent='Giá bán: '+money(effectivePrice({price:f.elements.price.value,discount_percent:f.elements.discount_percent.value}));
}
