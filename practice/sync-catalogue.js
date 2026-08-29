/*
 * sync-catalogue.js
 *
 * The Directory's Solutions tab is a projection of the SolCat Matrix. It carries
 * an embedded snapshot so it stays a standalone file, which means the snapshot
 * can drift the moment the Matrix is edited. Run this after any change to the
 * Matrix catalogue and it rebuilds the snapshot and re-stamps its date.
 *
 *   node sync-catalogue.js
 */
const fs = require('fs');
const PRISM = 'staffnet-solution-prism.html';
const SID   = 'staffnet-intelligent-directory.html';
const PAT = {'business-advisory':'rings','data-ai':'dots','security':'diag','apps-automation':'grid',
  'euc':'bars','collaboration':'wave','networking':'net','hybrid-cloud':'block','lifecycle':'steps'};
const PIC = {'business-advisory':'journey','data-ai':'spark','security':'shield','apps-automation':'workflow',
  'euc':'device','collaboration':'people','networking':'network','hybrid-cloud':'cloud','lifecycle':'reset'};

function stub(){const o={innerHTML:'',textContent:'',value:'',dataset:{},style:{setProperty(){}},
  classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},getAttribute(){return null},
  appendChild(){},remove(){},focus(){},addEventListener(){},closest(){return null},insertAdjacentHTML(){},
  querySelector(){return stub()},querySelectorAll(){return []},offsetHeight:60};return o;}
global.performance={now:()=>1};
global.localStorage={getItem(){return null},setItem(){},removeItem(){}};
global.location={hash:''};
global.document={documentElement:{style:{setProperty(){}}},body:{className:'',classList:{add(){},remove(){},toggle(){},contains(){return false}}},
  querySelector(){return stub()},querySelectorAll(){return []},createElement(){return stub()},
  getElementById(){return stub()},addEventListener(){},activeElement:{tagName:'BODY'},head:{appendChild(){return stub()}}};
global.window={addEventListener(){},scrollTo(){}};
global.URL={createObjectURL(){return 'b'},revokeObjectURL(){}}; global.Blob=function(){};
global.setTimeout=fn=>0; global.clearTimeout=()=>{};

let out;
eval(fs.readFileSync(PRISM,'utf8').match(/<script>\n([\s\S]*)\n<\/script>/)[1] + `
const saleable = db.solutions.filter(s=>s.status==='saleable' && s.customerFacing!==false);
out = {
  solutions: saleable.map(s=>({ i:s.id, n:s.name, p:s.primaryPractice.replace('practice-',''),
    l:L(s.primaryLens).key, o:s.customerOutcome||'', d:s.shortDescription||'',
    c:(s.contributingPractices||[]).map(x=>x.replace('practice-','')),
    in:relsFor(s.id).map(r=>r.industryId.replace('industry-','')),
    pr:(s.products||[]).map(x=>PR(x).name) })),
  practices: db.practices.map(p=>({ id:p.id.replace('practice-',''), name:p.displayName, colour:p.colour,
    layer:(LAYERS.find(l=>l.id===p.layer)||{}).name })),
  lenses: db.lenses.map(l=>({k:l.key,n:l.name,c:l.colour}))
};`);

const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const d=new Date(), stamp=d.getDate()+' '+MONTHS[d.getMonth()]+' '+d.getFullYear();
const esc = t => String(t).replace(/'/g,"\\'");
const PRAC = out.practices.map(p=>`['${p.id}','${esc(p.name)}','${p.colour}','${PAT[p.id]||'rings'}','${esc(p.layer)}','${PIC[p.id]||'lens'}']`).join(',');
const LENS = out.lenses.map(l=>`['${l.k}','${esc(l.n)}','${l.c}']`).join(',');

let sid = fs.readFileSync(SID,'utf8'), before = sid.length, changed = [];
const swap = (re, next, label) => {
  if(!re.test(sid)) { console.error('  could not find ' + label); process.exit(1); }
  const now = sid.replace(re, next); if(now !== sid) changed.push(label); sid = now;
};
swap(/const PRACTICES=\[.*?\];\n/s, `const PRACTICES=[${PRAC}];\n`, 'practices');
swap(/const LENSES=\[.*?\];\n/s, `const LENSES=[${LENS}];\n`, 'lenses');
swap(/const SOLUTIONS=\[.*?\];\n/s, `const SOLUTIONS=${JSON.stringify(out.solutions)};\n`, 'solutions');
swap(/const CATALOGUE_AS_AT='[^']*';/, `const CATALOGUE_AS_AT='${stamp}';`, 'date stamp');

fs.writeFileSync(SID, sid);
console.log('  synced ' + out.solutions.length + ' saleable solutions, ' + out.practices.length + ' practices');
console.log('  stamped: ' + stamp);
console.log('  changed: ' + (changed.length ? changed.join(', ') : 'nothing, already in step'));
console.log('  file ' + before + ' -> ' + sid.length + ' chars');
