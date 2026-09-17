function csvCell(value){
  let text=value==null?'':typeof value==='object'?JSON.stringify(value):String(value);
  // Excel formula injection protection for string cells; numbers remain numbers.
  if(typeof value==='string'&&/^[\s]*[=+\-@\t\r]/.test(text))text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
}
function rowsToCsv(rows){
  const columns=[...new Set(rows.flatMap(row=>Object.keys(row)))];
  return '\ufeff'+[columns.map(csvCell).join(','),...rows.map(row=>columns.map(key=>csvCell(row[key])).join(','))].join('\r\n');
}
function downloadBackup(name,text,type){
  const url=URL.createObjectURL(new Blob([text],{type}));
  const a=document.createElement('a');a.href=url;a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function exportData(table,button){
  if(!window.ddvSupabase){toast('Cần kết nối Supabase');return;}
  button.disabled=true;
  try{
    const date=new Date().toISOString().slice(0,10);
    if(table==='backup'){
      const tables={};
      for(const name of ['product','product_images','web_orders','web_order_items','posts','page_sections','site_settings','about_blocks'])tables[name]=await readAllRows(name);
      downloadBackup('ddv-backup-'+date+'.json',JSON.stringify({format:'ddv-backup',version:1,created_at:new Date().toISOString(),tables},null,2),'application/json');
    }else downloadBackup('ddv-'+table+'-'+date+'.csv',rowsToCsv(await readAllRows(table)),'text/csv;charset=utf-8');
    toast('Đã xuất dữ liệu. Hãy cất bản sao lưu ở nơi riêng tư.');
  }catch(error){toast(error.message);}
  finally{button.disabled=false;}
}
