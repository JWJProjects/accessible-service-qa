import {checks,inspect,compare,report} from './engine.js';
import {fixtures,mount,applyFixtureFix} from './fixtures.js';

const q=s=>document.querySelector(s);
const root=q('#fixture');
const select=q('#fixture-select');
const manualChecks=[
  {id:'MAN-01',name:'鍵盤流程與焦點',criterion:'2.1.1 / 2.4.7',procedure:'只用 Tab、Shift+Tab 與 Enter 操作，記錄順序、可見焦點及可操作性。'},
  {id:'MAN-02',name:'螢幕閱讀器實測',criterion:'1.1.1 / 4.1.2',procedure:'使用螢幕閱讀器確認圖片資訊、欄位與按鈕名稱是否切合情境。'}
];
const state={key:select.value,enabled:checks.map(c=>c.id),baseline:[],latest:[],manual:{},revision:0};
const el=(tag,className,value)=>{const n=document.createElement(tag); if(className)n.className=className;if(value!==undefined)n.textContent=value;return n;};
function announce(t){q('#announce').textContent=t;}
function snapshot(){return report({fixture:{id:state.key,label:fixtures[state.key].label},enabled:[...state.enabled],baseline:state.baseline,latest:state.latest,manual:manualChecks.map(m=>({...m,status:state.manual[m.id]})),revision:state.revision});}
function reset(){
  state.revision=0; state.manual=Object.fromEntries(manualChecks.map(m=>[m.id,'pending']));
  mount(root,state.key);
  q('#fixture-tag').textContent=fixtures[state.key].tag;
  state.baseline=inspect(root,state.enabled);
  state.latest=[...state.baseline];
  draw();
}
function scan(message='重新掃描完成'){
  state.latest=inspect(root,state.enabled);state.revision++;
  const invalidated=manualChecks.some(m=>state.manual[m.id]!=='pending');
  if(invalidated) for(const m of manualChecks) state.manual[m.id]='pending';
  draw();
  announce(`${message}；尚有 ${state.latest.length} 項自動發現。${invalidated?'人工覆核需於本次複測重新確認。':''}`);
}
function draw(){
  const diff=compare(state.baseline,state.latest);
  const pending=Object.values(state.manual).filter(s=>s==='pending').length;
  q('#base-count').textContent=state.baseline.length;
  q('#open-count').textContent=state.latest.length;
  q('#fixed-count').textContent=diff.resolved.length;
  q('#manual-count').textContent=pending;
  drawFindings(diff);
  drawManual();
  drawSummary(diff,pending);
}
function drawFindings(diff){
  const list=q('#findings');list.replaceChildren();
  if(!state.latest.length){
    const box=el('li','empty');
    const noScope=!state.enabled.length;
    box.append(el('h3',null,noScope?'目前未啟用自動檢查':'本次範圍未再發現問題'),el('p',null,noScope?'請至少選一個檢查項目，才可建立有效的自動基線。':'請完成鍵盤與螢幕閱讀器人工覆核，這並不代表整頁合規。'));list.append(box);
  }
  const findingRow=(f,resolved)=>{
    const item=el('li','finding-item');
    const row=el('div','finding-row');
    const title=el('div','finding-title');
    title.append(el('span','chip',f.id),el('strong',null,f.title));
    const action=el('div','fixline');
    if(!resolved){
      const b=el('button','fix','套用修正');b.setAttribute('aria-label','套用修正：'+f.title);
      b.onclick=()=>{applyFixtureFix(root,state.key,f.id);scan('已修改 DOM 並複測');(q('.fix')??q('#scan')).focus();};
      action.append(b);
    } else action.append(el('span','small','不需再修正'));
    row.append(title,el('span',resolved?'status status-ok':'status status-bad',resolved?'已排除':'待修正'),action);
    const details=el('details','finding-meta');
    details.append(el('summary',null,resolved?'查看初測依據':'查看位置與判定原因'));
    const observation=el('p');observation.append(el('code',null,f.selector),document.createTextNode(`　｜ ${f.criterion}　｜ ${f.observation}`));
    details.append(observation,el('p',null,f.recommendation));item.append(row,details);return item;
  };
  for(const f of state.latest)list.append(findingRow(f,false));
  if(diff.resolved.length){
    const li=el('li','resolved');li.append(el('h3',null,'本次複測已排除'));
    const ul=el('ul');for(const f of diff.resolved)ul.append(findingRow(f,true));
    li.append(ul);list.append(li);
  }
}
function drawManual(){
  const panel=q('#manual');panel.replaceChildren();
  for(const m of manualChecks){
    const a=el('article'), l=el('label',null,m.id+' 覆核狀態');l.htmlFor=m.id;
    const s=el('select');s.id=m.id;
    for(const [code,content] of [['pending','待覆核'],['pass','操作符合（人工填記）'],['fail','需修正（人工填記）']]) s.add(new Option(content,code));
    s.value=state.manual[m.id];s.onchange=()=>{state.manual[m.id]=s.value;q('#manual-count').textContent=Object.values(state.manual).filter(v=>v==='pending').length;drawSummary(compare(state.baseline,state.latest),Number(q('#manual-count').textContent));announce('已填記人工覆核，不改變自動掃描結果。');};
    a.append(el('h3',null,m.name),el('p',null,m.procedure),l,s);panel.append(a);
  }
}
function drawSummary(diff,pending){
  const failures=Object.values(state.manual).filter(v=>v==='fail').length;
  q('#summary').textContent=`情境  ${fixtures[state.key].label}\n規則  ${state.enabled.length} 組\n初測  ${state.baseline.length} 項｜最新  ${state.latest.length} 項\n排除  ${diff.resolved.length} 項｜新增  ${diff.newFindings.length} 項\n人工  待覆核 ${pending} 項｜需修正 ${failures} 項\n範圍  合成頁；非認證`;
  q('#export').disabled=!state.enabled.length;
}
select.onchange=()=>{state.key=select.value;reset();announce('已切換情境並建立新基線。');};
q('#reset').onclick=()=>{reset();announce('已重設合成 DOM 與人工紀錄。');};
q('#scan').onclick=()=>scan();
q('#export').onclick=()=>{
  if(!state.enabled.length)return;
  const data=new Blob([JSON.stringify(snapshot(),null,2)+'\n'],{type:'application/json'});
  const href=URL.createObjectURL(data);
  const a=el('a');a.href=href;a.download=`a11y-evidence-${state.key}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),1000);
  announce('已建立合成頁證據 JSON。');
};
for(const c of checks){
  const l=el('label');const i=el('input');i.type='checkbox';i.checked=true;i.value=c.id;
  i.onchange=()=>{state.enabled=[...document.querySelectorAll('#rules input:checked')].map(x=>x.value);reset();announce('已改變檢查範圍並重建基線。');};
  l.append(i,document.createTextNode(' '+c.id+' '+c.title));q('#rules').append(l);
}
function showView(view){
  for(const n of document.querySelectorAll('[data-view]')){
    const on=n.dataset.view===view;n.setAttribute('aria-pressed',String(on));q('#'+n.dataset.view).hidden=!on;
  }
}
for(const b of document.querySelectorAll('[data-view]')) b.onclick=()=>showView(b.dataset.view);
function revealStep(hash, moveFocus=false){
  const link=Array.from(document.querySelectorAll('.steps a')).find(a=>a.hash===hash);
  if(!link)return;
  if(link.dataset.stepView)showView(link.dataset.stepView);
  const title=document.getElementById(hash.slice(1));
  if(title&&moveFocus){title.focus();title.scrollIntoView({block:'start'});}
}
for(const link of document.querySelectorAll('.steps a')) link.addEventListener('click',()=>{
  revealStep(link.hash,true);
});
window.addEventListener('hashchange',()=>revealStep(location.hash,true));
reset();
revealStep(location.hash,Boolean(location.hash));
