'use strict';
window.OJ = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let toastTimer;
  function toast(message){const el=document.getElementById('toast');el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,4500);}
  function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{toast('기기 저장에 실패했습니다. 기록을 파일로 내보내세요.');return false;}}
  function load(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
  function download(name,data,type='application/json'){const blob=new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
  const fields=Object.values(CAREER.fields).flat();
  const labels=Object.fromEntries([...fields.map(f=>[f[0],f[1]]),['title','활동명'],['date','활동일'],['with','함께한 사람'],['due','실행 기한'],['checkDate','확인일'],['status','실행 정도'],['self0','오 · 자기이해'],['self1','작 · 선택 근거'],['self2','교 · 질문과 연결']]);
  const allowed=new Set([...Object.keys(labels),'designType']);
  function validate(input){
    if(!input||input.app!=='ojakgyo'||input.version!==1||!Array.isArray(input.records)||input.records.length>300)throw Error('오작교 v1 기록 파일이 아닙니다 (최대 300개 활동).');
    const p=input.profile;
    if(!p||typeof p.code!=='string'||!/^[가-힣a-zA-Z0-9_-]{1,32}$/.test(p.code)||!['1','2','3'].includes(p.grade)||typeof p.className!=='string'||p.className.length>20)throw Error('학생 코드 또는 학년·반 정보가 올바르지 않습니다.');
    const seen=new Set();
    const records=input.records.map(r=>{
      if(!r||typeof r.id!=='string'||!r.id||r.id.length>80||seen.has(r.id)||!r.fields||typeof r.fields!=='object'||Array.isArray(r.fields)||!Array.isArray(r.picks)||r.picks.length>2)throw Error('활동 기록 형식이 올바르지 않습니다.');
      seen.add(r.id);const clean={};
      for(const [k,v] of Object.entries(r.fields)){if(allowed.has(k)){if(typeof v!=='string'||v.length>12000)throw Error('활동 문항 내용이 너무 길거나 올바르지 않습니다.');clean[k]=v;}}
      if(clean.designType&&!['design2','design3'].includes(clean.designType))throw Error('설계 유형이 올바르지 않습니다.');
      if(clean.status&&!['해 보았다','일부 했다','아직 못 했다'].includes(clean.status))throw Error('실행 상태가 올바르지 않습니다.');
      const picks=[...new Set(r.picks.filter(v=>CAREER.jobs.some(j=>j[0]===v)))];
      return {id:r.id,fields:clean,picks,updated:typeof r.updated==='string'?r.updated.slice(0,40):''};
    });return {app:'ojakgyo',version:1,profile:{code:p.code,grade:p.grade,className:p.className},records};
  }
  async function readFile(file){if(file.size>5*1024*1024)throw Error('5MB 이하의 JSON 파일을 선택하세요.');return validate(JSON.parse(await file.text()));}
  function recordHTML(r){const type=r.fields.designType||'design2';const exclude=new Set(CAREER.fields[type==='design2'?'design3':'design2'].map(f=>f[0]));return `<article class="card portfolio-entry"><h3>${esc(r.fields.title||'이름 없는 활동')}</h3><p class="muted">${esc(r.fields.date||'날짜 미입력')} · 관심 분야: ${r.picks.map(id=>esc(CAREER.jobs.find(j=>j[0]===id)?.[1]||'')).join(', ')||'미선택'}</p><dl>${Object.entries(labels).filter(([key])=>r.fields[key]&&!exclude.has(key)&&key!=='title').map(([key,label])=>`<dt>${esc(label)}</dt><dd>${esc(r.fields[key])}</dd>`).join('')}</dl></article>`;}
  return {esc,toast,save,load,download,labels,validate,readFile,recordHTML};
})();
