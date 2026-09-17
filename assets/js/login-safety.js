// Runs before async initialization. Also removes legacy credential parameters
// from the current history entry without sending another network request.
{
  const url=new URL(location.href);
  let dirty=false;
  for(const key of [...url.searchParams.keys()]){
    if(/^(email|password|passwd|pwd)$/i.test(key)){url.searchParams.delete(key);dirty=true;}
  }
  if(dirty)history.replaceState(history.state,'',url.pathname+url.search+url.hash);
}
document.addEventListener('submit',event=>{
  if(event.target.id!=='loginForm')return;
  event.preventDefault();
  if(typeof login==='function')login(event);
},true);
