/** Small deterministic Phase 4 checks. Run with: node scripts/verify-phase4.mjs
 * This supplements, but does NOT replace, project build and browser testing.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve(import.meta.dirname, '..');
let checks = 0;
const check = (expr, message) => { assert.ok(expr, message); checks++ };
const helper = fs.readFileSync(path.join(root,'src/lib/cms/service-arrangement.ts'),'utf8');
const output = ts.transpileModule(helper,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module = { exports:{} };
new Function('module','exports',output)(module,module.exports);
const { asServiceArrangement, orderByPreference } = module.exports;
check(asServiceArrangement({menu:['panel-beating'],slider:['tesla-approved-repair-centre','prestige-brands']}).slider.length===2, 'valid arrangement');
check(asServiceArrangement({menu:['a','a'],slider:[]})===null, 'duplicate rejected');
check(asServiceArrangement({menu:['javascript:alert(1)'],slider:[]})===null, 'unsafe slug rejected');
check(asServiceArrangement({menu:[],slider:[]}).menu.length===0, 'empty menu supported');
check(asServiceArrangement({menu:['x'],slider:'wrong'})===null, 'array required');
const rows=[{slug:'b'},{slug:'a'},{slug:'c'}];
check(orderByPreference(rows,['c','a'],x=>x.slug).map(x=>x.slug).join(',')==='c,a', 'order and visibility');
check(rows.map(x=>x.slug).join(',')==='b,a,c', 'input never mutated');
const txt=(file)=>fs.readFileSync(path.join(root,file),'utf8');
check(txt('src/components/Public/EditorialServicePage.tsx').includes('service.presentation.data.rightImage'), 'right-side editorial binding');
check(txt('src/components/Public/BrandRepairPage.tsx').includes('rightImage'), 'right-side brand binding');
check(txt('src/app/api/admin/service-arrangement/route.ts').includes('admin.role === "editor"'), 'published order role guard');
check(txt('src/app/api/admin/service-arrangement/route.ts').includes('.eq("updated_at", current.updated_at)'), 'compare-and-set concurrency guard');
check(txt('src/components/Public/GalleryGrid.tsx').includes('bento') || txt('src/components/Public/GalleryGrid.tsx').includes('gallery-grid'), 'gallery structure retained');
console.log(`Phase 4 targeted checks: ${checks} passed, 0 failed`);
