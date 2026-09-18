const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const originalTables=['product','product_images','web_orders','web_order_items','posts','page_sections','site_settings','about_blocks'];
const categoryRows=[{id:10,name:'Trà hoa',slug:'tra-hoa',sort_order:1,is_active:true},{id:20,name:'Danh mục tắt',slug:'tat',sort_order:2,is_active:false}];
let reads=[],downloads=[],messages=[],failure=null;
const context=vm.createContext({Date,Set,JSON,window:{ddvSupabase:{}},readAllRows:async table=>{reads.push(table);if(table===failure)throw new Error('Không đọc được bảng '+table);return table==='product_categories'?categoryRows:[{id:1,name:'Dữ liệu '+table}];},toast:msg=>messages.push(msg)});
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/admin-backup.js'),'utf8'),context);
context.downloadBackup=(name,text,type)=>downloads.push({name,text,type});
(async()=>{
 const button={disabled:false};await context.exportData('backup',button);
 assert.equal(button.disabled,false);assert.equal(downloads.length,1);
 const backup=JSON.parse(downloads[0].text);
 assert.deepEqual(Object.keys(backup),['format','version','created_at','tables']);assert.equal(backup.format,'ddv-backup');assert.equal(backup.version,1);assert.ok(!Number.isNaN(Date.parse(backup.created_at)));
 assert.deepEqual(Object.keys(backup.tables),[...originalTables,'product_categories']);assert.deepEqual(backup.tables.product_categories,categoryRows);
 assert.deepEqual(reads,[...originalTables,'product_categories']);assert.ok(downloads[0].name.endsWith('.json'));
 for(const table of [...originalTables,'product_categories']){
   downloads=[];await context.exportData(table,button);assert.equal(downloads.length,1);assert.equal(button.disabled,false);assert.ok(downloads[0].name.endsWith('.csv'));assert.ok(downloads[0].text.startsWith('\ufeff'));
 }
 assert.ok(downloads[0].text.includes('Trà hoa')&&downloads[0].text.includes('Danh mục tắt'));
 // Never download a misleading partial full backup if the new table fails.
 downloads=[];failure='product_categories';await context.exportData('backup',button);
 assert.equal(downloads.length,0);assert.equal(button.disabled,false);assert.ok(messages.at(-1).includes('product_categories'));
 const html=fs.readFileSync(path.join(root,'admin/index.html'),'utf8');assert.match(html,/exportData\('product_categories',this\)">Danh mục CSV/);
 console.log('PASS: JSON format v1 retained, all existing tables plus categories (active/inactive), every CSV export, no partial backup on category error');
})().catch(error=>{console.error(error);process.exitCode=1;});
