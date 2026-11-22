export const fixtures={
 status:{label:'案件進度查詢',tag:'FIXTURE 01',copy:'輸入參考編號，查看案件目前進度。',heading:'案件進度查詢',primary:'參考編號',repair:'進度查詢流程示意',note:'查詢結果不會保存，請依畫面提示操作。',result:'已完成本機進度查詢示範。',icon:'↗'},
 venue:{label:'場地使用申請',tag:'FIXTURE 02',copy:'填寫場地用途，確認預約前的注意事項。',heading:'場地使用申請',primary:'場地用途',repair:'場地使用申請流程示意',note:'申請送出前，請先確認活動日期與人數。',result:'已完成本機場地申請示範。',icon:'＋'}
};
const illustration='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 92 80"><rect x="1" y="1" width="90" height="78" rx="18" fill="#dcece2"/><path d="M24 56h44M36 56V27l22 7v22m-14-17h5m-5 8h5" fill="none" stroke="#27644f" stroke-width="2.5" stroke-linecap="round"/><circle cx="68" cy="22" r="5" fill="#cf895b"/></svg>');
export function mount(root,key) {
  const s=fixtures[key];
  // Construct the fixtures from constants only; never ingest user-supplied HTML.
  root.innerHTML=`<div class="fixture-shell"><div class="fixture-heading"><img id="service-illustration" src="${illustration}" width="76" height="66"><div><small>公共服務情境｜合成資料</small><h3>${s.heading}</h3></div></div><p>${s.copy}</p><div id="label-slot"></div><div class="fixture-form"><input id="request-field" placeholder="在此輸入（合成示範）" autocomplete="off"><button id="request-action" type="button" class="fixture-button"><span aria-hidden="true">${s.icon}</span></button></div><p data-contrast id="service-note">${s.note}</p></div>`;
  const feedback=root.ownerDocument.createElement('p');
  feedback.id='fixture-feedback';
  feedback.setAttribute('role','status');
  root.querySelector('.fixture-shell').append(feedback);
  root.querySelector('#request-action').addEventListener('click',()=>{
    feedback.textContent=root.querySelector('#request-field').value.trim()
      ?s.result:'請先輸入合成測試值。';
  });
}
export function applyFixtureFix(root,key,id) {
  const s=fixtures[key];
  if(id==='A11Y-01') root.querySelector('#service-illustration').alt=s.repair;
  if(id==='A11Y-02') {
    const label=root.ownerDocument.createElement('label');
    label.htmlFor='request-field';label.textContent=s.primary;
    root.querySelector('#label-slot').replaceChildren(label);
  }
  if(id==='A11Y-03') root.querySelector('#request-action').setAttribute('aria-label',key==='status'?'查詢案件進度':'新增場地申請');
  if(id==='A11Y-04') root.querySelector('#service-note').style.color='#3c534b';
}
