// Accessible product lightbox; no credentials or remote writes.
function setupProductGallery(urls, name){
  const main=document.querySelector('#productMainImage');
  if(!main || !urls.length) return;
  let index=0;
  const dialog=document.createElement('dialog');
  dialog.className='product-lightbox';
  dialog.setAttribute('aria-label','Ảnh sản phẩm '+name);
  dialog.innerHTML='<button type="button" class="lightbox-close" aria-label="Đóng">×</button><button type="button" class="lightbox-prev" aria-label="Ảnh trước">‹</button><img alt=""><button type="button" class="lightbox-next" aria-label="Ảnh tiếp theo">›</button><p aria-live="polite"></p>';
  document.body.append(dialog);
  const paint=()=>{
    main.src=urls[index];
    dialog.querySelector('img').src=urls[index];
    dialog.querySelector('img').alt=name+' · ảnh '+(index+1);
    dialog.querySelector('p').textContent=(index+1)+' / '+urls.length;
    document.querySelectorAll('.product-thumb').forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-pressed',String(i===index));});
  };
  const step=n=>{index=(index+n+urls.length)%urls.length;paint();};
  document.querySelectorAll('.product-thumb').forEach((b,i)=>b.onclick=()=>{index=i;paint();});
  main.tabIndex=0;main.setAttribute('role','button');main.setAttribute('aria-label','Phóng to ảnh sản phẩm');
  const open=()=>{paint();dialog.showModal();document.body.classList.add('lightbox-open');};
  main.onclick=open;
  main.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};
  dialog.querySelector('.lightbox-close').onclick=()=>dialog.close();
  dialog.querySelector('.lightbox-prev').onclick=()=>step(-1);
  dialog.querySelector('.lightbox-next').onclick=()=>step(1);
  for(const b of dialog.querySelectorAll('.lightbox-prev,.lightbox-next')) b.hidden=urls.length<2;
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}if(e.key==='ArrowRight'){e.preventDefault();step(1);}});
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>{document.body.classList.remove('lightbox-open');main.focus();});
  paint();
}
