/* UR Gamification v1: daily A1 challenge with explained feedback and fair local rewards. */
(function () {
  'use strict';
  if (window.URGamificationV1) return;
  const KEY = 'ur.gamification.daily.v1';
  const BANK = [
    {fr:'Je ___ étudiant.', options:['suis','es','est'], answer:0, why:{ar:'مع je نستخدم suis.',en:'Use suis with je.',fr:'On utilise suis avec je.'}},
    {fr:'Elle ___ une sœur.', options:['a','as','avons'], answer:0, why:{ar:'مع elle نستخدم a من الفعل avoir.',en:'Use a with elle from avoir.',fr:'Avec elle, on utilise a du verbe avoir.'}},
    {fr:'Bonjour !', options:['Good night','Hello','Thank you'], answer:1, why:{ar:'Bonjour تعني مرحباً أو صباح الخير.',en:'Bonjour means hello or good morning.',fr:'Bonjour est une salutation.'}},
    {fr:'Nous ___ à Paris.', options:['habitez','habitent','habitons'], answer:2, why:{ar:'مع nous نقول habitons.',en:'With nous, use habitons.',fr:'Avec nous, on utilise habitons.'}},
    {fr:'Je voudrais ___ eau, s’il vous plaît.', options:['un','de l’','une'], answer:1, why:{ar:'نستخدم de l’ قبل eau لأنها تبدأ بحرف صوتي.',en:'Use de l’ before eau, which begins with a vowel sound.',fr:'On utilise de l’ devant eau.'}},
    {fr:'Comment ça va ?', options:['How are you?','Where do you live?','What time is it?'], answer:0, why:{ar:'السؤال عن الحال.',en:'This asks how someone is.',fr:'Cette question demande comment va la personne.'}},
    {fr:'Hier, j’___ étudié.', options:['ai','suis','est'], answer:0, why:{ar:'الماضي المركب مع étudier يُبنى هنا باستخدام avoir: j’ai étudié.',en:'The passé composé of étudier uses avoir: j’ai étudié.',fr:'Le passé composé d’étudier se forme avec avoir : j’ai étudié.'}},
    {fr:'Deux livres', options:['One book','Two books','Two pens'], answer:1, why:{ar:'Deux تعني اثنين، وlivres تعني كتب.',en:'Deux means two; livres means books.',fr:'Deux signifie 2 et livres signifie books.'}},
    {fr:'Je ___ français.', options:['parles','parle','parlons'], answer:1, why:{ar:'مع je نقول parle.',en:'With je, use parle.',fr:'Avec je, on utilise parle.'}},
    {fr:'Merci beaucoup.', options:['See you soon','Excuse me','Thank you very much'], answer:2, why:{ar:'Merci beaucoup تعني شكراً جزيلاً.',en:'Merci beaucoup means thank you very much.',fr:'Merci beaucoup exprime un remerciement appuyé.'}}
  ];
  const TEXT = {
    ar:{eyebrow:'تحدّي اليوم · المستوى A1',title:'اختبر نفسك واربح نقاط التعلّم',sub:'خمسة أسئلة قصيرة مع تفسير الإجابة. المكافأة تُمنح مرة واحدة يومياً.',start:'ابدأ التحدّي',question:'السؤال',of:'من',check:'تحقّق من الإجابة',next:'السؤال التالي',finish:'إنهاء التحدّي',correct:'إجابة صحيحة',incorrect:'ليست صحيحة',answer:'الإجابة الصحيحة',score:'نتيجتك',xp:'نقطة خبرة',todayDone:'أنجزت تحدّي اليوم بالفعل. أحسنت!',badge:'شارة: متدرّب يومي',retry:'راجع الأسئلة',local:'يُحفظ إنجاز هذا التحدّي على هذا الجهاز فقط حالياً؛ لم تُفعّل مزامنته السحابية بعد.'},
    en:{eyebrow:'DAILY CHALLENGE · A1',title:'Test yourself and earn learning points',sub:'Five short questions with explanations. Rewards are earned once per day.',start:'Start challenge',question:'Question',of:'of',check:'Check answer',next:'Next question',finish:'Finish challenge',correct:'Correct answer',incorrect:'Not quite',answer:'Correct answer',score:'Your result',xp:'XP',todayDone:'You have completed today’s challenge. Well done!',badge:'Badge: Daily learner',retry:'Review questions',local:'This challenge is currently saved on this device only; cloud sync is not yet enabled.'},
    fr:{eyebrow:'DÉFI DU JOUR · A1',title:'Testez-vous et gagnez des points',sub:'Cinq questions courtes avec explications. Une récompense par jour.',start:'Commencer le défi',question:'Question',of:'sur',check:'Vérifier',next:'Question suivante',finish:'Terminer le défi',correct:'Bonne réponse',incorrect:'Pas tout à fait',answer:'Bonne réponse',score:'Votre résultat',xp:'XP',todayDone:'Vous avez déjà terminé le défi du jour. Bravo !',badge:'Badge : apprenant régulier',retry:'Revoir les questions',local:'Ce défi est actuellement enregistré sur cet appareil uniquement ; la synchronisation cloud n’est pas encore activée.'}
  };
  const lang = () => { const x=(document.documentElement.dataset.uiLang||document.documentElement.lang||'ar').toLowerCase(); return x.startsWith('fr')?'fr':x.startsWith('en')?'en':'ar'; };
  const t = k => (TEXT[lang()]||TEXT.ar)[k]||TEXT.ar[k]||k;
  const today = () => {const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
  const read = () => {try {const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{};}catch(_){return {};}}
  const write = x => {try{localStorage.setItem(KEY,JSON.stringify(x));}catch(_){}};
  const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const shuffle = xs => {const a=xs.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  let items=[],idx=0,answers=[],selected=null,checked=false,mode='intro';
  function mount(){
    const home=document.getElementById('panel-home');if(!home)return;
    let card=document.getElementById('ur-daily-challenge');if(card)return;
    card=document.createElement('section');card.id='ur-daily-challenge';card.className='ur-challenge';card.setAttribute('aria-labelledby','ur-challenge-title');
    const hub=home.querySelector('#ur-learning-hub')||home.querySelector('.cover');
    if(hub)hub.insertAdjacentElement('afterend',card);else home.prepend(card);
    render();
  }
  function render(){
    const card=document.getElementById('ur-daily-challenge');if(!card)return;
    const record=read(),done=record.date===today()&&record.completed;
    card.dir=lang()==='ar'?'rtl':'ltr';
    if(done&&mode==='intro'){
      card.innerHTML='<div class="ur-challenge-head"><span class="ur-challenge-icon">🏆</span><div><span class="ur-challenge-eyebrow">'+t('eyebrow')+'</span><h2 id="ur-challenge-title">'+t('title')+'</h2><p>'+t('todayDone')+'</p></div></div><div class="ur-challenge-result"><strong>'+record.score+'/5</strong><span>+'+record.earned+' '+t('xp')+'</span><span class="ur-challenge-badge">🏅 '+t('badge')+'</span></div><p class="ur-challenge-local">'+t('local')+'</p>';
      return;
    }
    if(mode==='intro'){
      card.innerHTML='<div class="ur-challenge-head"><span class="ur-challenge-icon">⚡</span><div><span class="ur-challenge-eyebrow">'+t('eyebrow')+'</span><h2 id="ur-challenge-title">'+t('title')+'</h2><p>'+t('sub')+'</p></div></div><div class="ur-challenge-meta"><span>🎯 A1</span><span>❓ 5</span><span>⭐ '+t('xp')+': 50</span></div><button type="button" class="ur-challenge-primary" data-ur-challenge="start">'+t('start')+'</button><p class="ur-challenge-local">'+t('local')+'</p>';
      return;
    }
    if(mode==='question'){
      const q=items[idx],opts=shuffle(q.options.map((label,i)=>({label,original:i})));
      selected=null;checked=false;
      card.innerHTML='<div class="ur-challenge-head"><span class="ur-challenge-icon">⚡</span><div><span class="ur-challenge-eyebrow">'+t('eyebrow')+'</span><h2 id="ur-challenge-title">'+t('question')+' '+(idx+1)+' '+t('of')+' 5</h2></div></div><div class="ur-challenge-progress"><span style="width:'+((idx)/5*100)+'%"></span></div><div class="ur-challenge-question" lang="fr" dir="ltr">'+esc(q.fr)+'</div><div class="ur-challenge-options">'+opts.map(o=>'<button type="button" data-ur-option="'+o.original+'">'+esc(o.label)+'</button>').join('')+'</div><div class="ur-challenge-feedback" id="ur-challenge-feedback" aria-live="polite" hidden></div><div class="ur-challenge-actions"><button type="button" class="ur-challenge-primary" data-ur-challenge="check" disabled>'+t('check')+'</button></div>';
      return;
    }
    if(mode==='result'){
      const score=answers.filter(Boolean).length,earned=score*10;
      const old=read(),same=old.date===today()&&old.completed;
      if(!same)write({date:today(),completed:true,score,earned,answers:answers.slice(),finishedAt:new Date().toISOString()});
      card.innerHTML='<div class="ur-challenge-head"><span class="ur-challenge-icon">🏆</span><div><span class="ur-challenge-eyebrow">'+t('eyebrow')+'</span><h2 id="ur-challenge-title">'+t('score')+'</h2><p>'+t('badge')+'</p></div></div><div class="ur-challenge-result"><strong>'+score+'/5</strong><span>+'+(same?old.earned:earned)+' '+t('xp')+'</span><span class="ur-challenge-badge">🏅 '+t('badge')+'</span></div><div class="ur-challenge-progress"><span style="width:'+(score/5*100)+'%"></span></div><button type="button" class="ur-challenge-primary" data-ur-challenge="review">'+t('retry')+'</button><p class="ur-challenge-local">'+t('local')+'</p>';
    }
  }
  function start(){const record=read();if(record.date===today()&&record.completed){mode='intro';render();return;}items=shuffle(BANK).slice(0,5);idx=0;answers=[];mode='question';render();}
  function handle(e){
    const btn=e.target.closest('[data-ur-challenge]');if(btn){const a=btn.dataset.urChallenge;
      if(a==='start'){start();return;}
      if(a==='check'){if(selected===null||checked)return;checked=true;const q=items[idx],ok=selected===q.answer;answers[idx]=ok;const fb=document.getElementById('ur-challenge-feedback');fb.hidden=false;fb.className='ur-challenge-feedback '+(ok?'is-correct':'is-incorrect');fb.innerHTML='<strong>'+(ok?t('correct'):t('incorrect'))+'</strong><p>'+t('answer')+': <span lang="fr">'+esc(q.options[q.answer])+'</span></p><p>'+esc(q.why[lang()]||q.why.ar)+'</p>';btn.textContent=idx===4?t('finish'):t('next');btn.dataset.urChallenge='next';document.querySelectorAll('#ur-daily-challenge [data-ur-option]').forEach(b=>{b.disabled=true;if(Number(b.dataset.urOption)===q.answer)b.classList.add('is-answer');});return;}
      if(a==='next'){if(idx>=4){mode='result';render();}else{idx++;mode='question';render();}return;}
      if(a==='review'){mode='intro';render();return;}
    }
    const opt=e.target.closest('[data-ur-option]');if(opt&&mode==='question'&&!checked){selected=Number(opt.dataset.urOption);document.querySelectorAll('#ur-daily-challenge [data-ur-option]').forEach(b=>{b.classList.toggle('is-selected',b===opt);});const check=document.querySelector('#ur-daily-challenge [data-ur-challenge="check"]');if(check)check.disabled=false;}
  }
  document.addEventListener('click',handle);
  window.addEventListener('orr:uilanguagechange',()=>{if(mode==='intro')render();});
  window.URGamificationV1={mount};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  const observer=new MutationObserver(()=>{if(!document.getElementById('ur-daily-challenge'))mount();});
  observer.observe(document.body,{childList:true,subtree:true});
})();