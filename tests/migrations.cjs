// Static regression checks only. Never connects to or executes SQL.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.join(__dirname,'..','migrations');
const read=name=>fs.readFileSync(path.join(dir,name),'utf8').replace(/--[^\n]*/g,'');
const initial=read('005_product_lifecycle.sql'),admin=read('007_admin_system.sql'),authorization=read('010_admin_authorization.sql');
const signature='public.product_lifecycle(bigint,text)';
for(const [name,sql] of [['005',initial],['007',admin]]){
 assert.ok(sql.includes('revoke all on function '+signature+' from public,anon,authenticated;'),name+': revoke every browser role');
 assert.ok(!/grant\s+execute\s+on\s+function\s+public\.product_lifecycle\b/i.test(sql),name+': lifecycle must stay unavailable');
}
const body=sql=>sql.match(/function public\.product_lifecycle\(p_id bigint,p_action text\)[\s\S]*?as \$\$([\s\S]*?)\$\$/)[1];
assert.ok(!/update\s+public\.product/i.test(body(initial)),'005: placeholder cannot modify a product');
assert.ok(/raise exception/.test(body(initial)),'005: placeholder fails closed');
const hardened=body(admin);
assert.ok(admin.indexOf('function public.ddv_is_admin()')<admin.indexOf('function public.product_lifecycle('),'007: check exists before lifecycle');
assert.ok(hardened.includes("if public.ddv_is_admin() is distinct from true then raise exception 'Không có quyền Admin'; end if;"),'007: false AND null must reject');
assert.ok(hardened.indexOf('public.ddv_is_admin()')<hardened.indexOf('update public.product'),'007: authorize before any write');
assert.ok(!hardened.includes('auth.uid()'),'007: cannot authorize merely by login');
for(const action of ['hide','show','trash','restore'])assert.ok(hardened.includes("'"+action+"'"),action+': protected action retained');
const grant=authorization.indexOf('grant execute on function '+signature+' to authenticated;');
assert.ok(grant>authorization.lastIndexOf('create policy'),'010: grant after every policy');
assert.ok(/^\s*commit;\s*$/i.test(authorization.slice(grant).split(';').slice(1).join(';')),'010: authorization and grant commit together');
const grants=fs.readdirSync(dir).filter(name=>/\.sql$/.test(name)&&/grant\s+execute\s+on\s+function\s+public\.product_lifecycle\b/i.test(read(name)));
assert.deepEqual(grants,['010_admin_authorization.sql']);
console.log('PASS: lifecycle fail-closed stages, Admin-only writes, grant after authorization (static; no SQL executed)');
