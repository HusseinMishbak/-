/* URFRE — civic-exam practice module. Original practice questions; not official exam content. */
(() => {
  'use strict';
  const BANK_URL = './citizenship-mock-bank.json?v=20261019-civic1';
  const EXAM_MINUTES = 45;
  const PASS_SCORE = 32;
  const PASS_PERCENT = 80;
  const LABELS = {
    ar: {title:'محاكاة الامتحان المدني الفرنسي',subtitle:'40 سؤالاً · 45 دقيقة · النجاح التدريبي من 32/40 (80%)',disclaimer:'هذه أسئلة تدريبية أصلية وليست أسئلة رسمية أو شهادة نجاح. الامتحان الرسمي يُجرى باللغة الفرنسية؛ استخدم الترجمة العربية للتعلّم فقط.',start:'ابدأ المحاكاة',next:'السؤال التالي',prev:'السؤال السابق',submit:'إنهاء وتصحيح المحاكاة',restart:'إعادة المحاكاة',time:'الوقت المتبقي',question:'السؤال',of:'من',choose:'اختر إجابة واحدة',unanswered:'لم تجب عن',unanswered2:'سؤال. هل تريد التسليم الآن؟',score:'النتيجة',passed:'بلغت حد النجاح التدريبي',failed:'لم تبلغ حد النجاح التدريبي بعد',review:'مراجعة الإجابات',correct:'الإجابة الصحيحة',your:'إجابتك',none:'لم تتم الإجابة',explain:'التفسير',saved:'إذا كنت مسجّل الدخول، فسيُحفظ سجل النتيجة في حسابك. وإلا فستظهر النتيجة محلياً فقط.',official:'راجع المصادر الرسمية قبل التقديم؛ هذه المحاكاة لا تحل محل الامتحان الرسمي.',topics:['مبادئ الجمهورية وقيمها','المؤسسات والنظام السياسي','الحقوق والواجبات','التاريخ والجغرافيا والثقافة','الحياة اليومية والاندماج'],loading:'جارٍ تحميل بنك الأسئلة…',loadError:'تعذر تحميل الأسئلة. حدّث الصفحة وحاول مرة أخرى.',timeUp:'انتهى الوقت؛ تم تصحيح إجاباتك تلقائياً.',confirmRestart:'إعادة البدء ستمحو إجاباتك الحالية. هل تريد المتابعة؟'},
    en: {title:'French civic-exam practice simulation',subtitle:'40 questions · 45 minutes · practice pass mark 32/40 (80%)',disclaimer:'These are original practice questions, not official exam items or a certificate. The official exam is in French; use the Arabic translation for learning only.',start:'Start simulation',next:'Next question',prev:'Previous question',submit:'Submit and grade',restart:'Restart simulation',time:'Time remaining',question:'Question',of:'of',choose:'Choose one answer',unanswered:'You have not answered',unanswered2:'questions. Submit now?',score:'Score',passed:'Practice pass mark reached',failed:'Practice pass mark not reached yet',review:'Review answers',correct:'Correct answer',your:'Your answer',none:'Unanswered',explain:'Explanation',saved:'If signed in, your score attempt will be saved to your account. Otherwise, it remains local.',official:'Review official sources before applying; this simulation does not replace the official exam.',topics:['Republican principles and values','Institutions and political system','Rights and duties','History, geography and culture','Daily life and integration'],loading:'Loading questions…',loadError:'Could not load the question bank. Refresh and try again.',timeUp:'Time is up; your answers were graded automatically.',confirmRestart:'Restarting will clear your current answers. Continue?'},
    fr: {title:'Simulation d’entraînement à l’examen civique',subtitle:'40 questions · 45 minutes · seuil d’entraînement 32/40 (80 %)',disclaimer:'Ces questions originales sont destinées à l’entraînement ; elles ne sont pas officielles et ne délivrent aucune attestation. L’examen officiel est en français ; la traduction arabe sert uniquement à apprendre.',start:'Commencer la simulation',next:'Question suivante',prev:'Question précédente',submit:'Terminer et corriger',restart:'Recommencer',time:'Temps restant',question:'Question',of:'sur',choose:'Choisissez une réponse',unanswered:'Vous n’avez pas répondu à',unanswered2:'questions. Remettre la copie maintenant ?',score:'Résultat',passed:'Seuil d’entraînement atteint',failed:'Seuil d’entraînement non atteint',review:'Correction des réponses',correct:'Bonne réponse',your:'Votre réponse',none:'Sans réponse',explain:'Explication',saved:'Si vous êtes connecté, le résultat sera enregistré dans votre compte. Sinon, il reste local.',official:'Consultez les sources officielles avant de déposer une demande ; cette simulation ne remplace pas l’examen officiel.',topics:['Principes et valeurs de la République','Institutions et système politique','Droits et devoirs','Histoire, géographie et culture','Vie quotidienne et intégration'],loading:'Chargement des questions…',loadError:'Impossible de charger les questions. Actualisez la page et réessayez.',timeUp:'Le temps est écoulé ; vos réponses ont été corrigées automatiquement.',confirmRestart:'Recommencer effacera vos réponses. Continuer?'}
  };
  const $ = (id) => document.getElementById(id);
  const language = () => ['ar','en','fr'].includes(document.documentElement.dataset.uiLang) ? document.documentElement.dataset.uiLang : 'ar';
  const text = (tag, value, cls) => { const e=document.createElement(tag); e.textContent=value; if(cls)e.className=cls; return e; };
  const button = (label, cls, onClick) => { const e=text('button',label,'btn '+(cls||'btn-soft')); e.type='button'; e.addEventListener('click',onClick); return e; };
  const shuffle = (items) => { const a=items.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
  const state={root:null,bank:[],order:[],answers:{},optionOrders:{},position:0,started:false,submitted:false,deadline:0,timer:null,lang:'ar'};
  function install(){
    const panel=$('panel-citizenship'); if(!panel || panel.querySelector('#urCivicPractice')) return !!(panel&&panel.querySelector('#urCivicPractice'));
    state.root=document.createElement('section'); state.root.id='urCivicPractice'; state.root.className='card'; state.root.style.margin='18px 0'; state.root.style.padding='16px'; state.root.style.border='1px solid var(--border,#d9dce6)';
    const heading=text('h2','محاكاة الامتحان المدني الفرنسي'); heading.id='urCivicTitle'; state.root.appendChild(heading);
    panel.appendChild(state.root); state.lang=language(); loadBank(); return true;
  }
  async function loadBank(){
    state.root.replaceChildren(text('p',LABELS[state.lang].loading));
    try{const response=await fetch(BANK_URL,{cache:'no-store'}); if(!response.ok)throw new Error('HTTP '+response.status); const data=await response.json();
      if(!Array.isArray(data.questions)||data.questions.length!==40)throw new Error('Question bank must contain 40 questions');
      state.bank=data.questions; renderIntro();
    }catch(err){console.error('Civic mock exam:',err);state.root.replaceChildren(text('p',LABELS[state.lang].loadError));}
  }
  function addHeading(parent,tag,copy){parent.appendChild(text(tag,copy));}
  function renderIntro(){
    const l=LABELS[state.lang]; state.root.replaceChildren(); state.root.dir=state.lang==='ar'?'rtl':'ltr';
    addHeading(state.root,'h2',l.title); state.root.appendChild(text('p',l.subtitle)); state.root.appendChild(text('p',l.disclaimer,'small'));
    const topics=document.createElement('ol'); topics.style.paddingInlineStart='24px'; l.topics.forEach(item=>topics.appendChild(text('li',item))); state.root.appendChild(topics);
    state.root.appendChild(button(l.start,'btn-primary',start));
  }
  function start(){
    if(state.timer)clearInterval(state.timer); state.answers={}; state.optionOrders={}; state.position=0; state.started=true; state.submitted=false;
    state.order=[];
    for(let theme=0;theme<5;theme++){const group=state.bank.map((q,i)=>({q,i})).filter(x=>x.q.t===theme); if(group.length!==8){state.started=false;renderIntro();state.root.appendChild(text('p','Question bank validation failed.'));return;} shuffle(group).forEach(x=>state.order.push(x.i));}
    state.order=shuffle(state.order); state.deadline=Date.now()+EXAM_MINUTES*60*1000; renderQuestion(); state.timer=setInterval(tick,1000); tick();
  }
  function tick(){if(!state.started||state.submitted)return;const left=Math.max(0,Math.ceil((state.deadline-Date.now())/1000));const clock=$('urCivicClock');if(clock)clock.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');if(left===0){clearInterval(state.timer);state.timer=null;alert(LABELS[state.lang].timeUp);finish(true);}}
  function renderQuestion(){
    const l=LABELS[state.lang],idx=state.order[state.position],q=state.bank[idx]; state.root.replaceChildren(); state.root.dir=state.lang==='ar'?'rtl':'ltr';
    const top=document.createElement('div'); top.className='row'; top.style.display='flex';top.style.justifyContent='space-between';top.style.alignItems='center';top.style.gap='12px';
    top.appendChild(text('h2',l.title));const clock=text('strong','45:00');clock.id='urCivicClock';clock.dir='ltr';const clockBox=text('div',l.time);clockBox.appendChild(clock);clockBox.className='chip';top.appendChild(clockBox);state.root.appendChild(top);
    state.root.appendChild(text('p',l.disclaimer,'small'));
    const meter=document.createElement('progress');meter.max=40;meter.value=state.position+1;meter.style.width='100%';state.root.appendChild(meter);
    const counter=text('p',l.question+' '+(state.position+1)+' '+l.of+' 40');counter.className='small';state.root.appendChild(counter);
    state.root.appendChild(text('h3',l.topics[q.t]));const fr=text('p',q.fr);fr.lang='fr';fr.dir='ltr';fr.style.fontWeight='700';state.root.appendChild(fr);
    const ar=text('p',q.ar);ar.lang='ar';ar.dir='rtl';ar.style.textAlign='right';ar.className='small';state.root.appendChild(ar);state.root.appendChild(text('p',l.choose,'small'));
    const opts=document.createElement('div');opts.style.display='grid';opts.style.gridTemplateColumns='repeat(auto-fit,minmax(230px,1fr))';opts.style.gap='8px';
    if(!state.optionOrders[idx])state.optionOrders[idx]=shuffle([0,1,2,3]);
    state.optionOrders[idx].forEach(original=>{const label=document.createElement('label');label.className='card soft';label.style.display='flex';label.style.alignItems='flex-start';label.style.gap='9px';label.style.padding='12px';label.style.cursor='pointer';const input=document.createElement('input');input.type='radio';input.name='urCivicAnswer';input.value=String(original);input.checked=state.answers[idx]===original;input.style.marginTop='4px';input.addEventListener('change',()=>{state.answers[idx]=original;});const content=document.createElement('span');const frOpt=text('span',q.o[original]);frOpt.lang='fr';frOpt.dir='ltr';content.appendChild(frOpt);const arOpt=text('small',q.oa[original]);arOpt.lang='ar';arOpt.dir='rtl';arOpt.style.display='block';arOpt.style.textAlign='right';arOpt.style.opacity='.8';content.appendChild(arOpt);label.appendChild(input);label.appendChild(content);opts.appendChild(label);});
    state.root.appendChild(opts);
    const navigation=document.createElement('div');navigation.style.display='flex';navigation.style.flexWrap='wrap';navigation.style.gap='8px';navigation.style.marginTop='18px';
    if(state.position>0)navigation.appendChild(button(l.prev,'btn-soft',()=>{state.position--;renderQuestion();}));
    if(state.position<39)navigation.appendChild(button(l.next,'btn-primary',()=>{state.position++;renderQuestion();}));
    else navigation.appendChild(button(l.submit,'btn-primary',()=>finish(false)));
    navigation.appendChild(button(l.restart,'btn-soft',()=>{if(confirm(l.confirmRestart))start();}));state.root.appendChild(navigation);
    const answered=Object.keys(state.answers).length;state.root.appendChild(text('p',answered+' / 40','small'));
    state.root.scrollIntoView({block:'start',behavior:'smooth'});
  }
  function finish(auto){
    if(!state.started||state.submitted)return;const l=LABELS[state.lang];
    if(!auto){const missing=state.order.filter(idx=>state.answers[idx]===undefined).length;if(missing&&!confirm(l.unanswered+' '+missing+' '+l.unanswered2))return;}
    state.submitted=true;state.started=false;if(state.timer)clearInterval(state.timer);state.timer=null;
    const score=state.order.filter(idx=>state.answers[idx]===state.bank[idx].a).length;const percent=Math.round(score/40*100);showResults(score,percent);
    const answers={};state.order.forEach((idx,pos)=>{answers['q'+idx]={selected:state.answers[idx]===undefined?null:state.answers[idx],correct:state.bank[idx].a,topic:state.bank[idx].t};});
    try{localStorage.setItem('urfre.civic.mock.last',JSON.stringify({score,percentage:percent,passed:score>=PASS_SCORE,when:new Date().toISOString()}));}catch(_){ }
    const app=window.OUR_FRENCH_APP;if(app&&typeof app.saveQuizAttempt==='function'){try{Promise.resolve(app.saveQuizAttempt({quiz_key:'citizenship-mock-2026',score,max_score:40,percentage:percent,answers})).catch(err=>console.warn('Could not save civic mock attempt',err));}catch(err){console.warn('Could not save civic mock attempt',err);}}
  }
  function showResults(score,percent){
    const l=LABELS[state.lang];state.root.replaceChildren();addHeading(state.root,'h2',l.score+': '+score+'/40 ('+percent+'%)');state.root.appendChild(text('p',score>=PASS_SCORE?l.passed:l.failed));
    state.root.appendChild(text('p',l.saved,'small'));state.root.appendChild(button(l.restart,'btn-primary',()=>{if(confirm(l.confirmRestart))start();}));addHeading(state.root,'h3',l.review);
    state.order.forEach((idx,pos)=>{const q=state.bank[idx],ok=state.answers[idx]===q.a;const card=document.createElement('article');card.className='card';card.style.padding='12px';card.style.margin='10px 0';
      card.appendChild(text('h4',l.question+' '+(pos+1)+' · '+l.topics[q.t]+' '+(ok?'✓':'✕')));card.appendChild(text('p',q.fr));card.appendChild(text('p',q.ar,'small'));
      const chosen=state.answers[idx];card.appendChild(text('p',l.your+': '+(chosen===undefined?l.none:q.o[chosen]+' — '+q.oa[chosen])));card.appendChild(text('p',l.correct+': '+q.o[q.a]+' — '+q.oa[q.a]));card.appendChild(text('p',l.explain+': '+(state.lang==='fr'?q.ef:q.ea)));state.root.appendChild(card);
    });
    const link=document.createElement('a');link.href='https://www.immigration.interieur.gouv.fr/devenir-francais/procedures-dacces-a-nationalite-francaise';link.target='_blank';link.rel='noopener';link.textContent=l.official;state.root.appendChild(link);
    state.root.scrollIntoView({block:'start',behavior:'smooth'});
  }
  function onLanguageChange(){state.lang=language();if(!state.root)return;if(state.started)renderQuestion();else if(state.submitted){const score=state.order.filter(idx=>state.answers[idx]===state.bank[idx].a).length;showResults(score,Math.round(score/40*100));}else if(state.bank.length)renderIntro();}
  function boot(){if(install())return;const observer=new MutationObserver(()=>{if(install())observer.disconnect();});observer.observe(document.body,{childList:true,subtree:true});}
  window.addEventListener('orr:uilanguagechange',onLanguageChange);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
