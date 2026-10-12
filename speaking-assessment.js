/* Our French Platform: pronunciation-first lessons and secure speaking assessments. */
(function(){
'use strict';
const COURSE=window.FRENCH_CURRICULUM||{};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const app=()=>window.OUR_FRENCH_APP||null;
const client=()=>{try{return app()&&app().getClient?app().getClient():null}catch(_){return null}};
const session=()=>{try{return app()&&app().getSession?app().getSession():null}catch(_){return null}};

function styles(){
 if($('#sa-styles'))return;
 const s=document.createElement('style');s.id='sa-styles';
 s.textContent='.sa-card{border:1px solid #d4e4ea;border-radius:18px;background:linear-gradient(180deg,#fff,#f7fbfd);padding:18px;margin:18px 0;box-shadow:0 8px 22px rgba(16,45,66,.06)}\n'+
 '.sa-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;margin-bottom:10px}.sa-kicker{font:800 10px Inter,sans-serif;letter-spacing:.1em;color:#0d7a70;direction:ltr;text-align:left}.sa-title{margin:4px 0;color:#102d42;font-size:21px;font-weight:800}.sa-desc{margin:5px 0 12px;color:#526a7b;font-size:14px}.sa-pill{border-radius:999px;padding:5px 10px;background:#e4f6f1;color:#0b665d;font-weight:800;font-size:12px;white-space:nowrap}\n'+
 '.sa-examples{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:12px 0}.sa-example{border:1px solid #dce8ed;border-radius:13px;padding:12px;background:#fff;min-width:0}.sa-fr{font-size:18px;font-weight:800;color:#102d42;direction:ltr;text-align:left;display:block;line-height:1.5}.sa-ar{color:#526a7b;font-size:13px;margin-top:4px}.sa-speak{margin-top:8px;border:1px solid #c2dcd8;background:#eff9f6;color:#075e57;border-radius:9px;padding:6px 10px;font-size:12px;font-weight:800}\n'+
 '.sa-record-area{background:#edf4f8;border-radius:13px;padding:14px;margin-top:14px}.sa-prompt{font-size:14px;background:#fff;border-right:4px solid #e5b45d;border-radius:8px;padding:12px;margin:8px 0;color:#17364b}.sa-actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.sa-btn{border:1px solid #cadce4;background:#fff;color:#183a50;border-radius:10px;padding:9px 12px;font-weight:800;font-size:13px}.sa-btn.primary{background:#0d7a70;color:#fff;border-color:#0d7a70}.sa-btn.stop{background:#fff3df;color:#855810;border-color:#f0d7a6}.sa-btn:disabled{opacity:.45;cursor:not-allowed}.sa-status{display:block;margin-top:7px;font-size:12px;color:#526a7b;min-height:22px}.sa-consent{display:flex;gap:8px;align-items:flex-start;font-size:12px;line-height:1.7;margin-top:10px}.sa-consent input{margin-top:5px;flex:0 0 auto}.sa-audio{display:block;width:100%;margin:10px 0}.sa-privacy{font-size:12px;color:#526a7b;background:#fff;border:1px solid #dbe7ec;border-radius:10px;padding:10px;margin-top:10px}.sa-result-list{display:grid;gap:12px;margin-top:12px}.sa-my-submissions{border-top:1px solid #dbe7ec;margin-top:14px;padding-top:12px}.sa-my-title{font-weight:800;color:#102d42;margin-bottom:8px}.sa-my-item{border:1px solid #dce5ec;border-radius:10px;padding:10px;background:#fff;margin:8px 0}.sa-my-meta{font-size:12px;color:#526a7b;margin-bottom:7px}.sa-delete-audio{border:1px solid #efcaca;background:#fff2f2;color:#a52a2a;border-radius:9px;padding:7px 10px;font-weight:800;font-size:12px}.sa-review-item{border:1px solid #dce5ec;border-radius:13px;padding:14px;background:#fff}.sa-review-meta{font-size:12px;color:#526a7b;margin:4px 0 10px}.sa-review-feedback{display:block;width:100%;min-height:78px;border:1px solid #cbdbe3;border-radius:10px;padding:10px;margin:8px 0;resize:vertical}.sa-empty{color:#617687;background:#f5f8fa;border-radius:11px;padding:14px;font-size:13px}.sa-rubric{display:grid;gap:8px;margin:10px 0}.sa-rubric-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(150px,220px);gap:10px;align-items:center;border-bottom:1px solid #e2ebef;padding:7px 0;font-size:13px}.sa-rubric-select{border:1px solid #cbdbe3;border-radius:9px;padding:7px;background:white;color:#17364b;width:100%}.sa-total{font-weight:800;color:#075e57;background:#e4f6f1;border-radius:9px;padding:8px 10px;margin:8px 0}@media(max-width:680px){.sa-examples{grid-template-columns:1fr}.sa-card{padding:13px}.sa-title{font-size:18px}}';
 document.head.appendChild(s);
}
function speak(text){
 const t=String(text||'').replace(/\s+/g,' ').trim();if(!t)return;
 if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){if(app()?.toast)app().toast('النطق الآلي غير مدعوم في هذا المتصفح.');return;}
 try{window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);const vs=window.speechSynthesis.getVoices()||[];const fr=vs.filter(v=>/^fr([-_]|$)/i.test(v.lang||''));const v=fr.find(x=>/fr[-_]FR/i.test(x.lang||''))||fr[0];u.lang=v?.lang||'fr-FR';if(v)u.voice=v;u.rate=.76;window.speechSynthesis.speak(u);}catch(e){console.warn(e);}
}
function samples(unit){
 const list=[],seen=new Set();
 (unit.days||[]).forEach(d=>(d.examples||[]).forEach(e=>{const fr=String(e.fr||'').trim();if(fr&&!seen.has(fr.toLowerCase())){seen.add(fr.toLowerCase());list.push({fr,ar:e.ar||''});}}));
 if(!list.length)String(unit.grammar||unit.focus||unit.name||'').split(/[·،,]/).map(x=>x.trim()).filter(Boolean).slice(0,4).forEach(fr=>list.push({fr,ar:'تدريب نطق من موضوع الوحدة'}));
 return list.slice(0,4);
}
function recorderHtml(key,title,prompt,limit,submitLabel){
 return '<div class="sa-record-area" data-sa-recorder data-assessment-key="'+esc(key)+'" data-limit="'+Number(limit||90)+'">'+
 '<div class="sa-kicker">SPEAKING & PRONUNCIATION</div><strong>'+esc(title)+'</strong><p class="sa-prompt">'+esc(prompt)+'</p>'+
 '<div class="sa-actions"><button type="button" class="sa-btn primary" data-sa-start>🎙️ بدء التسجيل</button><button type="button" class="sa-btn stop" data-sa-stop disabled>⏹ إيقاف</button><button type="button" class="sa-btn" data-sa-play disabled>▶ الاستماع للتسجيل</button><a class="sa-btn" data-sa-download hidden download="french-speaking-practice.webm">⬇ تنزيل التسجيل</a><button type="button" class="sa-btn primary" data-sa-submit disabled>'+esc(submitLabel||'إرسال التسجيل إلى المدرّس')+'</button></div>'+
 '<audio class="sa-audio" data-sa-audio controls hidden></audio><label class="sa-consent"><input type="checkbox" data-sa-consent><span>أوافق على إرسال هذا التسجيل الصوتي إلى مدرّس المنصة لتقييم النطق والتحدث وحفظه في حسابي. لن يُرسل دون موافقتي.</span></label><span class="sa-status" data-sa-status aria-live="polite">يمكنك التسجيل والاستماع والتنزيل محلياً. يتطلب الإرسال إلى المدرّس تسجيل الدخول.</span><div class="sa-my-submissions" data-sa-my-submissions><div class="sa-my-title">تسجيلاتي المرسلة</div><div class="sa-empty">سجّل الدخول لعرض التسجيلات السابقة.</div></div><div class="sa-privacy">الحد الأقصى '+Number(limit||90)+' ثانية. التسجيلات المرسلة خاصة بالطالب والمدرّس المخوّل.</div></div>';
}
function bindRecorder(box){
 if(box.dataset.saBound==='1')return;box.dataset.saBound='1';
 const start=$('[data-sa-start]',box),stop=$('[data-sa-stop]',box),play=$('[data-sa-play]',box),dl=$('[data-sa-download]',box),send=$('[data-sa-submit]',box),consent=$('[data-sa-consent]',box),status=$('[data-sa-status]',box),audio=$('[data-sa-audio]',box);
 let rec=null,stream=null,chunks=[],blob=null,url=null,startAt=0,seconds=0,timer=null,busy=false;
 const say=t=>{status.textContent=t};
 const mySubmissions=$('[data-sa-my-submissions]',box);
 const initialSendLabel=send.textContent;
 mySubmissions?.addEventListener('click',e=>{if(e.target.closest('[data-sa-refresh]'))refreshMySubmissions();});
 function submissionsHeading(label){return '<div class="sa-my-title" style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span>'+esc(label)+'</span><button type="button" class="sa-btn" data-sa-refresh>تحديث</button></div>';}
 async function refreshMySubmissions(){
  if(!mySubmissions)return;
  const db=client(),ss=session();
  if(!db||!ss?.user?.id){mySubmissions.innerHTML=submissionsHeading('تسجيلاتي المرسلة')+'<div class="sa-empty">سجّل الدخول لعرض التسجيلات السابقة وإدارتها.</div>';return;}
  mySubmissions.innerHTML=submissionsHeading('تسجيلاتي المرسلة')+'<div class="sa-empty">جارٍ تحميل تسجيلاتك…</div>';
  const key=String(box.dataset.assessmentKey||'speaking-practice').replace(/[^a-z0-9_-]/gi,'-');
  const result=await db.from('speaking_submissions').select('id,assessment_key,prompt,storage_path,mime_type,duration_seconds,submitted_at,teacher_feedback,score_total').eq('user_id',ss.user.id).eq('assessment_key',key).order('submitted_at',{ascending:false});
  if(result.error){mySubmissions.innerHTML=submissionsHeading('تسجيلاتي المرسلة')+'<div class="sa-empty">تعذر تحميل تسجيلاتك. '+esc(result.error.message)+'</div>';return;}
  mySubmissions.innerHTML=submissionsHeading('تسجيلاتي المرسلة ('+result.data.length+')');
  if(!result.data.length){mySubmissions.insertAdjacentHTML('beforeend','<div class="sa-empty">لا توجد تسجيلات مرسلة لهذا التمرين. يمكنك تسجيل إجابة جديدة وإرسالها.</div>');return;}
  for(const item of result.data){
   const card=document.createElement('div');card.className='sa-my-item';
   const meta=document.createElement('div');meta.className='sa-my-meta';meta.textContent=new Date(item.submitted_at).toLocaleString('ar',{dateStyle:'medium',timeStyle:'short'})+' · '+Number(item.duration_seconds||0)+' ثانية'+(item.score_total!=null?' · الدرجة: '+item.score_total+'/10':'');card.appendChild(meta);
   const player=document.createElement('audio');player.controls=true;player.preload='none';player.className='sa-audio';
   const signed=await db.storage.from('student-audio').createSignedUrl(item.storage_path,900);
   if(!signed.error)player.src=signed.data.signedUrl;else {player.hidden=true;const warn=document.createElement('div');warn.className='sa-empty';warn.textContent='تعذر فتح التسجيل الصوتي.';card.appendChild(warn);}
   card.appendChild(player);
   if(item.teacher_feedback){const fb=document.createElement('p');fb.className='sa-desc';fb.textContent='ملاحظات المدرّس: '+item.teacher_feedback;card.appendChild(fb);}
   const del=document.createElement('button');del.type='button';del.className='sa-delete-audio';del.textContent='حذف هذا التسجيل وإعادة الإرسال';
   const statusLine=document.createElement('span');statusLine.className='sa-status';statusLine.setAttribute('aria-live','polite');
   del.addEventListener('click',async()=>{
    if(!window.confirm('حذف هذا التسجيل نهائياً؟ سيُحذف معه تقييم المدرّس وملاحظاته إن وُجدت. يمكنك بعدها تسجيل إجابة جديدة.'))return;
    del.disabled=true;statusLine.textContent='جارٍ حذف التسجيل…';
    try{
     const current=session();if(!current?.user?.id||current.user.id!==ss.user.id)throw new Error('انتهت جلسة الدخول؛ سجّل الدخول مجدداً.');
     const removed=await db.storage.from('student-audio').remove([item.storage_path]);
     if(removed.error)throw removed.error;
     const deleted=await db.from('speaking_submissions').delete().eq('id',item.id).eq('user_id',current.user.id).select('id');
     if(deleted.error)throw deleted.error;
     if(!deleted.data||!deleted.data.length)throw new Error('لم يُحذف سجل قاعدة البيانات. تواصل مع المدرّس إذا استمر الأمر.');
     app()?.toast?.('تم حذف التسجيل. يمكنك تسجيل إجابة جديدة وإرسالها.');
     await refreshMySubmissions();
    }catch(error){console.error('Student audio deletion failed',error);statusLine.textContent='تعذر حذف التسجيل بالكامل: '+(error?.message||'خطأ غير معروف');del.disabled=false;}
   });
   card.appendChild(del);card.appendChild(statusLine);mySubmissions.appendChild(card);
  }
 }
 function cleanup(){if(timer){clearTimeout(timer);timer=null;}if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}}
 function dropUrl(){if(url){URL.revokeObjectURL(url);url=null;}}
 function stopNow(){if(rec&&rec.state!=='inactive'){try{rec.stop()}catch(_){}}cleanup();}
 start.addEventListener('click',async()=>{
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){say('التسجيل غير مدعوم في هذا المتصفح. جرّب Chrome أو Safari حديثاً.');return;}
  if(!window.isSecureContext){say('يلزم فتح المنصة عبر HTTPS والسماح باستخدام الميكروفون.');return;}
  try{
   start.disabled=true;send.textContent=initialSendLabel;say('نطلب إذن الميكروفون…');stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
   const types=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg'];const mime=types.find(t=>MediaRecorder.isTypeSupported(t));rec=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream);
   chunks=[];blob=null;seconds=0;startAt=Date.now();
   rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
   rec.onerror=e=>{console.error('MediaRecorder error',e);say('حدث خطأ أثناء التسجيل. أعد المحاولة.');start.disabled=false;stop.disabled=true;cleanup()};
   rec.onstop=()=>{
    seconds=Math.max(1,Math.round((Date.now()-startAt)/1000));blob=new Blob(chunks,{type:rec?.mimeType||'audio/webm'});dropUrl();url=URL.createObjectURL(blob);
    audio.src=url;audio.hidden=false;play.disabled=!blob.size;dl.hidden=!blob.size;send.disabled=!blob.size||!consent.checked;dl.href=url;dl.download=box.dataset.assessmentKey+'-'+new Date().toISOString().slice(0,10)+(blob.type.includes('mp4')?'.m4a':blob.type.includes('ogg')?'.ogg':'.webm');
    start.disabled=false;stop.disabled=true;cleanup();say('تم التسجيل ('+seconds+' ثانية). استمع إليه ثم أرسله أو نزّله.');
   };
   rec.start();stop.disabled=false;play.disabled=true;send.disabled=true;dl.hidden=true;say('التسجيل جارٍ. تحدث بوضوح؛ سيتوقف تلقائياً بعد '+box.dataset.limit+' ثانية.');timer=setTimeout(stopNow,Math.max(15,Number(box.dataset.limit)||90)*1000);
  }catch(e){console.error('Microphone error',e);start.disabled=false;stop.disabled=true;cleanup();say(e?.name==='NotAllowedError'?'لم تسمح للمتصفح باستخدام الميكروفون. فعّل الإذن ثم أعد المحاولة.':'تعذر تشغيل الميكروفون. تحقق من الإذن والجهاز.');}
 });
 stop.addEventListener('click',()=>{if(rec&&rec.state==='recording'){say('جارٍ تجهيز التسجيل…');stopNow()}});
 play.addEventListener('click',()=>audio.src&&audio.play().catch(()=>say('استخدم مشغل الصوت للاستماع للتسجيل.')));
 consent.addEventListener('change',()=>{send.disabled=!blob||busy||!consent.checked});
 send.addEventListener('click',async()=>{
  if(!blob){say('سجّل إجابتك أولاً.');return;}
  if(!consent.checked){say('ضع علامة الموافقة قبل إرسال التسجيل.');return;}
  const db=client(),ss=session();
  if(!db||!ss?.user?.id){say('التسجيل محلي حتى الآن. سجّل الدخول من «حساب الطالب»، ثم أرسل التسجيل مرة أخرى.');app()?.navigate?.('account');return;}
  busy=true;send.disabled=true;start.disabled=true;say('جارٍ رفع التسجيل وحفظه في سجل الاختبارات…');let path=null;
  try{
   const uid=ss.user.id,key=String(box.dataset.assessmentKey||'speaking-practice').replace(/[^a-z0-9_-]/gi,'-');
   const ext=blob.type.includes('mp4')?'m4a':blob.type.includes('ogg')?'ogg':blob.type.includes('wav')?'wav':'webm';
   path=uid+'/'+key+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,9)+'.'+ext;
   const mime=blob.type.includes('mp4')?'audio/mp4':blob.type.includes('ogg')?'audio/ogg':blob.type.includes('wav')?'audio/wav':'audio/webm';
   const up=await db.storage.from('student-audio').upload(path,blob,{contentType:mime,upsert:false,cacheControl:'3600'});if(up.error)throw up.error;
   const promptText=box.querySelector('.sa-prompt')?.textContent||'تسجيل نطق وتحدث باللغة الفرنسية';
   const ins=await db.from('speaking_submissions').insert({user_id:uid,assessment_key:key,prompt:promptText,storage_path:path,mime_type:mime,duration_seconds:seconds}).select('id').single();
   if(ins.error)throw ins.error;
   say('تم إرسال التسجيل بنجاح إلى المدرّس. يمكنك عرض تسجيلاتك السابقة أدناه وحذف أي تسجيل وإعادة إرساله.');send.textContent='✓ تم الإرسال';send.disabled=true;app()?.toast?.('تم إرسال التسجيل الصوتي إلى المدرّس.');await refreshMySubmissions();
  }catch(e){console.error('Speaking upload failed',e);if(path){try{await db.storage.from('student-audio').remove([path])}catch(_){}}say('تعذر إرسال التسجيل. تحقق من الاتصال وتسجيل الدخول ثم حاول مجدداً. '+(e?.message||''));send.disabled=!blob||!consent.checked;}
  finally{busy=false;start.disabled=false;}
 });
 box.addEventListener('DOMNodeRemoved',cleanup);
 refreshMySubmissions();
}
function buildCard(c){
 const el=document.createElement('section');el.className='sa-card';
 const examples=(c.examples||[]).map(x=>'<article class="sa-example"><span class="sa-fr" lang="fr" dir="ltr">'+esc(x.fr)+'</span><div class="sa-ar">'+esc(x.ar||'اقرأ العبارة بصوت مرتفع.')+'</div><button type="button" class="sa-speak" data-sa-speak="'+esc(x.fr)+'">🔊 استمع ببطء</button></article>').join('');
 el.innerHTML='<div class="sa-head"><div><div class="sa-kicker">'+esc(c.kicker||'PRONONCIATION · PARLER')+'</div><h2 class="sa-title">'+esc(c.title)+'</h2><p class="sa-desc">'+esc(c.description||'استمع إلى النموذج، وكرره 3–5 مرات، ثم سجّل صوتك وقارنه.')+'</p></div><span class="sa-pill">'+esc(c.badge||'النطق أساسي')+'</span></div>'+(examples?'<div class="sa-examples">'+examples+'</div>':'')+recorderHtml(c.key,c.recordTitle||'تسجيل الإجابة الصوتية',c.prompt,c.limit,c.buttonLabel);
 el.querySelectorAll('[data-sa-recorder]').forEach(bindRecorder);return el;
}
function insertOnce(target,c,afterHead){
 if(!target||target.querySelector('[data-sa-section="'+c.key+'"]'))return;
 const card=buildCard(c);card.dataset.saSection=c.key;
 if(afterHead&&target.querySelector('.panel-head'))target.querySelector('.panel-head').insertAdjacentElement('afterend',card);else target.appendChild(card);
}
function renderUnits(){
 (COURSE.bookUnits||[]).forEach(unit=>{
  const panel=$('#panel-week'+unit.u);if(!panel)return;
  const ex=samples(unit),short=ex.slice(0,2).map(x=>x.fr).join(' — ')||unit.name;
  insertOnce(panel,{key:'pronunciation-unit-'+unit.u,title:'مختبر النطق والتحدث — '+unit.name,description:'خطوة أساسية في كل وحدة: استمع ببطء، كرر العبارة 3–5 مرات، ثم سجّل صوتك واستمع إليه قبل الإرسال.',badge:'الوحدة '+unit.u+' · صوت',examples:ex,prompt:'سجّل 20–45 ثانية: اقرأ عبارتين من الوحدة ثم كوّن جملة جديدة. أمثلة: '+short,limit:45,buttonLabel:'إرسال تسجيل الوحدة إلى المدرّس',recordTitle:'تقييم النطق — الوحدة '+unit.u},true);
 });
}
function renderBookPlanUnits(){
 const host=$('#panel-bookplan');const details=$$('.book-index-unit',host);
 (COURSE.bookUnits||[]).forEach((unit,index)=>{
  const detail=details[index];if(!detail)return;
  const ex=samples(unit),short=ex.slice(0,2).map(x=>x.fr).join(' — ')||unit.name;
  insertOnce(detail,{key:'pronunciation-unit-'+unit.u,title:'مختبر النطق والتحدث — '+unit.name,description:'النطق خطوة أساسية في هذه الوحدة: استمع ببطء، كرر 3–5 مرات، ثم سجّل صوتك وقارنه بالنموذج.',badge:'الوحدة '+unit.u+' · صوت',examples:ex,prompt:'سجّل 20–45 ثانية: اقرأ عبارتين من الوحدة ثم كوّن جملة جديدة. أمثلة: '+short,limit:45,buttonLabel:'إرسال تسجيل الوحدة إلى المدرّس',recordTitle:'تقييم النطق — الوحدة '+unit.u},false);
 });
}
function renderPlacement(){
 const panel=$('#panel-placement');if(!panel)return;
 const prompt='تحدث لمدة 60–90 ثانية بالفرنسية. قدّم نفسك واذكر اسمك ومهنتك ومدينة سكنك واللغات التي تتحدثها ولماذا تتعلم الفرنسية. استخدم: Bonjour, je m’appelle… / Je suis… / J’habite à… / Je parle… / J’apprends le français parce que…';
 const c={key:'placement-speaking',title:'الجزء الشفهي من اختبار تحديد المستوى',description:'جزء عملي من التقييم. يراجع المدرّس وضوح النطق والطلاقة والمفردات وبناء الجمل؛ لا يُقيّم اللكنة وحدها.',badge:'60–90 ثانية',examples:[{fr:'Bonjour, je m’appelle…',ar:'مرحباً، اسمي…'},{fr:'Je suis…',ar:'أنا… (المهنة أو الصفة)'},{fr:'J’habite à…',ar:'أسكن في…'},{fr:'J’apprends le français parce que…',ar:'أتعلم الفرنسية لأن…'}],prompt,limit:120,buttonLabel:'إرسال الإجابة الشفهية إلى المدرّس',recordTitle:'تسجيل اختبار تحديد المستوى'};
 insertOnce(panel,c,false);
 const card=panel.querySelector('[data-sa-section="placement-speaking"]'),actions=panel.querySelector('.placement-actions');if(card&&actions)actions.insertAdjacentElement('beforebegin',card);
}
function renderCitizenshipModules(){
 $$('.civ-module').forEach((module,index)=>{
  const idMatch=String(module.id||'').match(/civic-module-(\d+)/);
  const number=idMatch?Number(idMatch[1]):index+1;
  const key='citizenship-speaking-'+number;
  if(module.querySelector('[data-sa-section="'+key+'"]'))return;
  const examples=[],seen=new Set();
  $$('.civ-phrase .fr,.civ-dialogue-line .fr',module).forEach(el=>{
   const fr=(el.textContent||'').trim();
   if(!fr||seen.has(fr.toLowerCase())||examples.length>=3)return;
   seen.add(fr.toLowerCase());
   const translation=el.nextElementSibling;
   examples.push({fr,ar:translation?(translation.textContent||'').trim():'عبارة من درس الجنسية والاندماج.'});
  });
  const contentTitle=module.querySelector('summary strong')?.textContent||('الوحدة '+number);
  insertOnce(module,{
   key,title:'مختبر النطق والتحدث — الجنسية والاندماج · '+contentTitle,
   description:'استمع إلى العبارات المدنية ببطء، كررها 3–5 مرات، ثم لخّص ما فهمته بصوتك وسجّل إجابتك.',
   badge:'الوحدة '+number+' · صوت',
   examples,
   prompt:'سجّل 30–60 ثانية: اقرأ عبارة أو عبارتين من هذه الوحدة، ثم اشرح بالفرنسية ما فهمته بجمل بسيطة.',
   limit:60,
   buttonLabel:'إرسال تسجيل الوحدة إلى المدرّس',
   recordTitle:'تقييم النطق — الجنسية والاندماج · الوحدة '+number
  },false);
 });
}
function renderMonthly(){
 const p=$('#panel-evaluations');if(!p)return;
 insertOnce(p,{key:'monthly-speaking',title:'اختبار التحدث الشهري — تسجيل صوتي',description:'يتضمن منهج الشهر الأول عينة تحدث لمدة 60–90 ثانية، ويُقيّم فيها الوضوح والطلاقة والمفردات والقواعد.',badge:'تقييم شفهي',examples:[{fr:'Comment vous appelez-vous ?',ar:'ما اسمك؟'},{fr:'Quelle langue parlez-vous ?',ar:'ما اللغة التي تتحدثها؟'},{fr:'Où habitez-vous ?',ar:'أين تسكن؟'}],prompt:'سجّل 60–90 ثانية عن نفسك وعملك أو دراستك وروتينك. بعد ذلك أجب دون قراءة: Comment vous appelez-vous ? Quelle langue parlez-vous ? Où habitez-vous ?',limit:120,buttonLabel:'إرسال اختبار نهاية الشهر',recordTitle:'الإجابة الشفهية الشهرية'},true);
}
async function renderTeacherSubmissions(userId,container){
 const host=container||$('#teacherStudentDetail');if(!host)return;
 let section=$('#speakingSubmissionsReview',host);
 if(!section){
  section=document.createElement('section');section.id='speakingSubmissionsReview';section.className='sa-card';
  section.innerHTML='<div class="sa-kicker">TEACHER REVIEW</div><h3 class="sa-title">التسجيلات الصوتية وتقييم النطق</h3><p class="sa-desc">استمع إلى تسجيل الطالب، ثم قيّمه وفق سلم التقييم الشفهي: خمسة معايير، درجتان لكل معيار.</p><div class="sa-result-list" data-sa-review-list><div class="sa-empty">جارٍ تحميل التسجيلات…</div></div>';
  host.appendChild(section);
 }
 const list=$('[data-sa-review-list]',section);list.replaceChildren();
 const db=client(),profile=app()?.getProfile?.();
 if(!db||profile?.role!=='teacher'){list.textContent='هذه المراجعة متاحة للمدرّس أو مالك المنصة المخوّل فقط.';return;}
 const response=await db.from('speaking_submissions')
  .select('id,user_id,assessment_key,prompt,storage_path,mime_type,duration_seconds,submitted_at,teacher_feedback,rubric_scores,score_total')
  .eq('user_id',userId).order('submitted_at',{ascending:false});
 if(response.error){list.textContent='تعذر تحميل التسجيلات: '+response.error.message;return;}
 if(!response.data||!response.data.length){list.innerHTML='<div class="sa-empty">لم يرسل هذا الطالب أي تسجيل صوتي بعد.</div>';return;}
 const rubric=[
  {key:'clarity',label:'وضوح الرسالة'},
  {key:'sentences',label:'تكوين الجمل'},
  {key:'vocabulary',label:'المفردات'},
  {key:'response',label:'الفهم والرد'},
  {key:'pronunciation',label:'النطق والإيقاع'}
 ];
 for(const item of response.data){
  const card=document.createElement('article');card.className='sa-review-item';
  const title=document.createElement('strong');title.textContent=item.assessment_key||'اختبار شفهي';card.appendChild(title);
  const meta=document.createElement('div');meta.className='sa-review-meta';
  meta.textContent=new Date(item.submitted_at).toLocaleString('ar',{dateStyle:'medium',timeStyle:'short'})+' · '+Number(item.duration_seconds||0)+' ثانية';
  card.appendChild(meta);
  if(item.score_total!==null&&item.score_total!==undefined){
   const previous=document.createElement('div');previous.className='sa-pill';previous.textContent='الدرجة السابقة: '+item.score_total+' / 10';card.appendChild(previous);
  }
  const prompt=document.createElement('p');prompt.className='sa-desc';prompt.textContent=item.prompt||'لا يوجد نص إرشادي';card.appendChild(prompt);
  const signed=await db.storage.from('student-audio').createSignedUrl(item.storage_path,3600);
  if(signed.error){
   const warning=document.createElement('div');warning.className='sa-empty';warning.textContent='تعذر فتح التسجيل الخاص: '+signed.error.message;card.appendChild(warning);
  }else{
   const player=document.createElement('audio');player.controls=true;player.className='sa-audio';player.preload='none';player.src=signed.data.signedUrl;player.setAttribute('aria-label','تسجيل الطالب '+item.assessment_key);card.appendChild(player);
  }
  const rubricTitle=document.createElement('h4');rubricTitle.textContent='سلم التقييم الشفهي — 10 نقاط';rubricTitle.style.margin='14px 0 8px';card.appendChild(rubricTitle);
  const rubricBox=document.createElement('div');rubricBox.className='sa-rubric';
  const selects={};const existing=item.rubric_scores||{};
  rubric.forEach(entry=>{
   const row=document.createElement('label');row.className='sa-rubric-row';
   const caption=document.createElement('span');caption.textContent=entry.label+' (0–2)';row.appendChild(caption);
   const select=document.createElement('select');select.className='sa-rubric-select';select.setAttribute('aria-label',entry.label);
   [['','اختر الدرجة'],['0','0 — يحتاج إلى تدريب'],['1','1 — متحقق جزئياً'],['2','2 — متحقق بوضوح']].forEach(([value,labelText])=>{
    const option=document.createElement('option');option.value=value;option.textContent=labelText;select.appendChild(option);
   });
   if(existing[entry.key]!==null&&existing[entry.key]!==undefined)select.value=String(existing[entry.key]);
   selects[entry.key]=select;row.appendChild(select);rubricBox.appendChild(row);
  });
  card.appendChild(rubricBox);
  const total=document.createElement('div');total.className='sa-total';card.appendChild(total);
  function calculate(){
   const values=rubric.map(entry=>selects[entry.key].value);
   const complete=values.every(v=>v!==''&&Number(v)>=0&&Number(v)<=2);
   const sum=values.reduce((acc,v)=>acc+(v===''?0:Number(v)),0);
   total.textContent=complete?'المجموع الحالي: '+sum+' / 10':'اختر درجة من 0 إلى 2 لكل معيار لإكمال المجموع.';
   return {complete,sum};
  }
  Object.values(selects).forEach(select=>select.addEventListener('change',calculate));calculate();
  const feedbackLabel=document.createElement('label');feedbackLabel.textContent='ملاحظات المدرّس';feedbackLabel.style.fontWeight='800';feedbackLabel.style.display='block';feedbackLabel.style.marginTop='12px';card.appendChild(feedbackLabel);
  const feedback=document.createElement('textarea');feedback.className='sa-review-feedback';feedback.maxLength=4000;feedback.value=item.teacher_feedback||'';
  feedback.placeholder='مثال: النطق واضح، وينبغي التمييز بين u و ou، مع تحسين ربط الكلمات…';card.appendChild(feedback);
  const save=document.createElement('button');save.type='button';save.className='sa-btn primary';save.textContent='حفظ الدرجة وملاحظات المدرّس';card.appendChild(save);
  const status=document.createElement('span');status.className='sa-status';status.setAttribute('aria-live','polite');card.appendChild(status);
  save.addEventListener('click',async()=>{
   const score=calculate();const rubricScores={};rubric.forEach(entry=>rubricScores[entry.key]=selects[entry.key].value===''?null:Number(selects[entry.key].value));
   if(!score.complete){status.textContent='أكمل المعايير الخمسة قبل حفظ الدرجة.';return;}
   save.disabled=true;status.textContent='جارٍ حفظ الدرجة والملاحظات…';
   const currentSession=session();
   const updated=await db.from('speaking_submissions').update({
    teacher_feedback:feedback.value.trim(),rubric_scores:rubricScores,score_total:score.sum,
    reviewed_at:new Date().toISOString(),reviewed_by:currentSession?.user?.id||null
   }).eq('id',item.id);
   save.disabled=false;
   if(updated.error){status.textContent='تعذر الحفظ: '+updated.error.message;}
   else{status.textContent='تم حفظ الدرجة '+score.sum+'/10 وملاحظات المدرّس.';item.score_total=score.sum;}
  });
  list.appendChild(card);
 }
}
function init(){
 styles();document.addEventListener('click',e=>{const b=e.target.closest('[data-sa-speak]');if(b){e.preventDefault();speak(b.dataset.saSpeak)}});
 renderUnits();renderBookPlanUnits();renderCitizenshipModules();renderPlacement();renderMonthly();
 window.OUR_SPEAKING_ASSESSMENT={renderTeacherSubmissions,speak};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();