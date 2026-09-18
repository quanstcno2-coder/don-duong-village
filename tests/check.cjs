const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
for(const folder of ['assets/js','worker'])for(const name of fs.readdirSync(path.join(root,folder)))if(/\.(js|mjs)$/.test(name))execFileSync(process.execPath,['--check',path.join(root,folder,name)]);
const context=vm.createContext({Number,Math,Set,JSON,money:n=>n+'đ'});
for(const file of ['pricing.js','admin-backup.js'])vm.runInContext(fs.readFileSync(path.join(root,'assets/js',file),'utf8'),context);
for(const [price,discount,expected] of [[100000,0,100000],[100000,20,80000],[100000,100,0],[101,50,51]])assert.equal(vm.runInContext(`effectivePrice({price:${price},discount_percent:${discount}})`,context),expected);
assert.equal(vm.runInContext('priceMarkup({price:100,discount_percent:0}).includes("<del>")',context),false);
assert.equal(context.csvCell('=HYPERLINK("bad")'),'"\'=HYPERLINK(""bad"")"');
assert.equal(vm.runInContext('csvCell("a,b\\nc")',context),'"a,b\nc"');
assert.equal(vm.runInContext('csvCell(-10)',context),'"-10"');
for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html')).concat('admin/index.html')){
 const full=path.join(root,file),text=fs.readFileSync(full,'utf8');
 for(const match of text.matchAll(/(?:src|href)="([^"#?]+)"/g))if(!/^(https?:|data:|mailto:|tel:)/.test(match[1]))assert.ok(fs.existsSync(path.resolve(path.dirname(full),match[1])),file+': missing '+match[1]);
 assert.ok(text.includes('rel="icon"'),file+': favicon');
 const icon=text.match(/<link rel="icon"[^>]*href="([^"]+)"/);
 assert.equal(icon?.[1],file.startsWith('admin/')?'../assets/images/logo-mark.png':'assets/images/logo-mark.png',file+': official favicon');
}
assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'assets/images/logo-mark.png'))).digest('hex'),'7cf8eb8d5a61bd774af0a8ff62b7a1693de893025643f9bbb5f65f66295b896c','Official logo must remain byte-identical to supplied file');
console.log('PASS: syntax, prices, CSV injection/escaping, local references, favicons');
