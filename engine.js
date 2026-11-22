export const checks = [
  {id:'A11Y-01',sc:'1.1.1',title:'圖片缺少替代文字',query:'img',bad:n=>!n.hasAttribute('alt'),value:()=> '未設定 alt 屬性',fix:'依內容提供合適的 alt；純裝飾才使用空 alt。'},
  {id:'A11Y-02',sc:'3.3.2 / 4.1.2',title:'表單欄位缺少標籤',query:'input:not([type=hidden]), select, textarea',bad:n=>!name(n,true),value:()=> '無非空白的標籤或名稱',fix:'加入有意義的可見 label，並正確連結至欄位。'},
  {id:'A11Y-03',sc:'4.1.2',title:'按鈕缺少名稱',query:'button',bad:n=>!name(n),value:()=> '沒有可辨識的名稱來源',fix:'以可見文字或適當的 aria-label 說明按鈕用途。'},
  {id:'A11Y-04',sc:'1.4.3',title:'一般文字對比不足',query:'[data-contrast]',bad:n=>(ratioFor(n)??Infinity)<4.5,value:n=>`${ratioFor(n).toFixed(2)}:1（預期 ≥ 4.50:1）`,fix:'加深文字顏色或調整背景；修正後以計算樣式重測。'}
];
const tidy = x => (x??'').trim();
function name(node,input=false) {
  const get = a=>tidy(node.getAttribute(a));
  const by = get('aria-labelledby');
  if(by && by.split(/\s+/).some(id=>tidy(node.ownerDocument.getElementById(id)?.textContent))) return true;
  if(get('aria-label')) return true;
  if(input) return Array.from(node.labels??[]).some(label=>tidy(label.textContent));
  return Array.from(node.childNodes??[]).some(n=>n.nodeType===3?tidy(n.textContent):n.nodeType===1&&!n.hasAttribute('hidden')&&n.getAttribute('aria-hidden')!=='true'&&tidy(n.textContent));
}
export function contrastRatio(a,b) {
  const linear=x=>x<=0.04045 ? x/12.92 : ((x+.055)/1.055)**2.4;
  const lum=color=>color.map(x=>linear(x/255)).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
  const x=lum(a),y=lum(b);
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
function rgb(s) {
  const m=s.match(/^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\s*\)$/);
  return m && (!m[4] || +m[4]===1) ? m.slice(1,4).map(Number) : null;
}
function ratioFor(node) {
  const cs=node.ownerDocument.defaultView.getComputedStyle(node);
  const fg=rgb(cs.color), bg=rgb(cs.backgroundColor);
  return fg&&bg&&cs.backgroundImage==='none' ? contrastRatio(fg,bg) : null;
}
export function inspect(root,enabled=checks.map(x=>x.id)) {
  return checks.filter(c=>enabled.includes(c.id)).flatMap(c=>Array.from(root.querySelectorAll(c.query))
   .filter(c.bad).map(n=>({id:c.id, criterion:c.sc, title:c.title, selector:'#'+n.id, observation:c.value(n), recommendation:c.fix})));
}
export function compare(base,after) {
  const key=x=>x.id+':'+x.selector;
  const original=new Set(base.map(key)), current=new Set(after.map(key));
  return {resolved:base.filter(x=>!current.has(key(x))), remaining:after.filter(x=>original.has(key(x))), newFindings:after.filter(x=>!original.has(key(x)))};
}
export function report({fixture,enabled,baseline,latest,manual,revision}) {
  return {schema:'service-a11y-evidence.v1',synthetic:true,scope:'built-in fixture only',fixture,enabled,revision,baseline,latest,diff:compare(baseline,latest),manual,certification:false};
}
