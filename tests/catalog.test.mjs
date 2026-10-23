import {test} from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {makeCatalog,serialize,safeURL} from '../scripts/catalog-lib.mjs';
const c={owner:'owner',featured:['one'],exclude:['portfolio'],projects:{one:{demo:'https://owner.github.io/one/',embed:true}}};
const repo=(name,extra={})=>({name,id:name,owner:{login:'owner'},private:false,html_url:`https://github.com/owner/${name}`,description:'A project',...extra});
test('public owned projects only; private, foreign, and self are excluded',()=>{const d=makeCatalog([repo('one'),repo('private',{private:true}),repo('foreign',{owner:{login:'other'}}),repo('portfolio')],c);assert.deepEqual(d.projects.map(p=>p.name),['one']);});
test('empty results or missing favorites fail instead of replacing the catalog',()=>{assert.throws(()=>makeCatalog([],c));assert.throws(()=>makeCatalog([repo('two')],c));});
test('optional media remains absent and unsafe demo URLs cannot become actions',()=>{const d=makeCatalog([repo('one')],{...c,projects:{one:{demo:'javascript:alert(1)',embed:true}}});assert.equal(d.projects[0].demo,null);assert.equal(d.projects[0].embed,false);assert.equal(d.projects[0].image,null);assert.equal(safeURL('https://secret@example.com'),null);});
test('repository text stays inert in generated script',()=>{const d=makeCatalog([repo('one',{description:'</script><script>bad()</script>'})],{...c,projects:{}});const source=serialize(d);assert.ok(!source.includes('</script>'));const context={window:{}};vm.runInNewContext(source,context);assert.equal(context.window.OBSERVATORY_DATA.projects[0].summary,'</script><script>bad()</script>');});

test('published constellations feature the new games and keep RubiKit in the complete catalog',async()=>{
  const curation=JSON.parse(await readFile(new URL('../data/curation.json',import.meta.url),'utf8'));
  const context={window:{}};
  vm.runInNewContext(await readFile(new URL('../data/catalog.js',import.meta.url),'utf8'),context);
  const catalog=JSON.parse(JSON.stringify(context.window.OBSERVATORY_DATA));
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const featured=['seven-hunters','theGame','GolfProbably','Kinwild','Hydra'];
  assert.deepEqual(curation.featured,featured);
  assert.deepEqual(catalog.featured,featured);
  assert.ok(catalog.projects.some(project=>project.name==='RubiKit'));
  for(const name of ['seven-hunters','theGame']){
    const project=catalog.projects.find(project=>project.name===name);
    assert.ok(project,`${name} is available in the published catalog`);
    assert.equal(project.demo,`https://thehillbeyondthisone.github.io/${name}/`);
    assert.equal(project.image,curation.projects[name].image);
    assert.ok(project.imageAlt);
    assert.ok(html.includes(`href="${project.url}"`),`${name} is available without JavaScript`);
  }
});
