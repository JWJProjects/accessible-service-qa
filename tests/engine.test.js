import test from 'node:test';
import assert from 'node:assert/strict';
import {contrastRatio,compare,inspect,report} from '../engine.js';
test('WCAG sRGB reference contrast and fixture colors',()=>{
 assert.equal(contrastRatio([0,0,0],[255,255,255]),21);
 assert.equal(contrastRatio([10,10,10],[10,10,10]),1);
 assert.ok(contrastRatio([165,175,171],[255,255,255])<4.5);
 assert.ok(contrastRatio([60,83,75],[255,255,255])>=4.5);
});
test('compare tracks selector identity and detects regressions',()=>{
 const a={id:'A',selector:'#one'},b={id:'A',selector:'#two'},c={id:'B',selector:'#one'};
 assert.deepEqual(compare([a,b],[b,c]),{resolved:[a],remaining:[b],newFindings:[c]});
});
test('scan honors rule selection, reads the actual node attribute',()=>{
 let alt=false;
 const root={querySelectorAll:q=>q==='img'?[{id:'picture',hasAttribute:()=>alt}]:[]};
 assert.equal(inspect(root,[]).length,0);
 assert.equal(inspect(root,['A11Y-01'])[0].selector,'#picture');
 alt=true;
 assert.equal(inspect(root,['A11Y-01']).length,0);
});
test('zero automatic findings does not change pending manual records or imply certification',()=>{
 const r=report({fixture:{id:'status'},enabled:['A11Y-01'],baseline:[],latest:[],manual:[{id:'MAN-01',status:'pending'}],revision:1});
 assert.equal(r.synthetic,true);assert.equal(r.certification,false);assert.equal(r.manual[0].status,'pending');assert.equal(r.diff.remaining.length,0);
});
