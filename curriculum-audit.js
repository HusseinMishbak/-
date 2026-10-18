/* UR curriculum quality audit: inspect rendered roadmap structure and report actionable gaps. */
(function () {
  'use strict';
  if (window.URCurriculumAuditLoaded) return;
  window.URCurriculumAuditLoaded = true;

  const strings = {
    ar: {
      title:'تدقيق بنية المنهج وترابطه',
      intro:'يفحص هذا التقرير بنية المسار المعروضة في المنصة: الوحدات والأسابيع والجلسات والاختبارات، ويكشف مؤشرات تحتاج إلى مراجعة بشرية قبل اعتماد المحتوى.',
      run:'إعادة الفحص',
      units:'الأقسام / الوحدات',
      weeks:'مجموعات الأسابيع',
      sessions:'جلسات ظاهرة',
      questions:'أسئلة الاختبارات',
      findings:'نتائج الفحص',
      good:'مؤشر جيد',
      warning:'يحتاج إلى مراجعة',
      duplicate:'عناوين مكررة قد تشير إلى تكرار المحتوى',
      noQuestions:'مجموعات أسابيع بلا أسئلة اختبار ظاهرة',
      noSessions:'مجموعات أسابيع بلا جلسات ظاهرة',
      noAnswer:'أسئلة لا يظهر لها مفتاح إجابة يمكن فحصه آلياً',
      empty:'عناوين وحدات أو جلسات فارغة',
      sequence:'فحص التسلسل',
      sequenceText:'تأكد يدوياً من أن كل وحدة تبني على السابقة، وأن القاعدة تُقدَّم قبل التمرين، وأن المفردات تُعاد في الاستماع والقراءة والتحدث والكتابة. الفحص الآلي يكتشف مؤشرات بنيوية فقط ولا يستطيع الحكم على صحة الفرنسية أو ملاءمة مستوى CEFR وحده.',
      noFindings:'لم تُكتشف مشكلات بنيوية وفق المؤشرات الحالية؛ وهذا لا يعني أن المحتوى اللغوي خالٍ من الأخطاء.',
      scope:'نطاق الفحص',
      scopeText:'يعتمد التقرير على العناصر الموجودة في الصفحة عند فتح قسم خارطة الطريق. افتح مجموعات الأسابيع قبل إعادة الفحص لقراءة تفاصيلها. لا يغيّر هذا التدقيق درجات الطلاب أو محتوى إجاباتهم.',
      count:'عدد الحالات',
      unitLabel:'وحدة',
      weekLabel:'أسبوع',
      sessionLabel:'جلسة',
      questionLabel:'سؤال',
      emptyDom:'لم يُعثر على خارطة الطريق. افتح قسمها ثم أعد الفحص.',
      fix:'الإجراء المقترح'
    },
    en: {
      title:'Curriculum structure and coherence audit',
      intro:'This report checks the roadmap structure shown in the platform—units, week groups, sessions and quizzes—and flags indicators that need human review before the curriculum is approved.',
      run:'Run audit again',
      units:'Sections / units',
      weeks:'Week groups',
      sessions:'Visible sessions',
      questions:'Quiz questions',
      findings:'Audit findings',
      good:'Positive indicator',
      warning:'Review needed',
      duplicate:'Repeated titles that may indicate duplicated content',
      noQuestions:'Week groups with no visible quiz questions',
      noSessions:'Week groups with no visible sessions',
      noAnswer:'Questions without a machine-detectable answer key',
      empty:'Empty unit or session headings',
      sequence:'Sequence review',
      sequenceText:'Manually verify that each unit builds on the previous one, the grammar is introduced before practice, and vocabulary recurs in listening, reading, speaking and writing. Automated checks detect structural indicators only; they cannot independently validate French accuracy or CEFR suitability.',
      noFindings:'No structural issues were detected by the current indicators; this does not prove that the language content is error-free.',
      scope:'Audit scope',
      scopeText:'The report uses elements present when the roadmap is opened. Expand week groups before rerunning to expose their details. This audit does not alter student grades or answers.',
      count:'Cases',
      unitLabel:'units',
      weekLabel:'weeks',
      sessionLabel:'sessions',
      questionLabel:'questions',
      emptyDom:'The roadmap was not found. Open it and run the audit again.',
      fix:'Suggested action'
    },
    fr: {
      title:'Audit de la structure et de la cohérence du programme',
      intro:'Ce rapport examine la feuille de route affichée — unités, semaines, séances et tests — et signale les points à vérifier manuellement avant validation.',
      run:'Relancer l’audit',
      units:'Sections / unités',
      weeks:'Groupes de semaines',
      sessions:'Séances visibles',
      questions:'Questions de test',
      findings:'Résultats de l’audit',
      good:'Indicateur favorable',
      warning:'À vérifier',
      duplicate:'Titres répétés pouvant signaler un contenu dupliqué',
      noQuestions:'Groupes de semaines sans questions de test visibles',
      noSessions:'Groupes de semaines sans séances visibles',
      noAnswer:'Questions sans clé de réponse détectable automatiquement',
      empty:'Titres d’unité ou de séance vides',
      sequence:'Vérification de la progression',
      sequenceText:'Vérifiez manuellement que chaque unité s’appuie sur la précédente, que la règle précède la pratique et que le vocabulaire est réutilisé en compréhension orale, lecture, expression orale et écriture. L’audit automatique repère seulement des indices structurels ; il ne valide pas à lui seul l’exactitude du français ni le niveau CECRL.',
      noFindings:'Aucun problème structurel détecté selon les indicateurs actuels ; cela ne garantit pas l’absence d’erreurs linguistiques.',
      scope:'Périmètre de l’audit',
      scopeText:'Le rapport utilise les éléments présents lorsque la feuille de route est ouverte. Dépliez les semaines avant de relancer l’audit. Cet audit ne modifie ni les notes ni les réponses des étudiants.',
      count:'Cas',
      unitLabel:'unités',
      weekLabel:'semaines',
      sessionLabel:'séances',
      questionLabel:'questions',
      emptyDom:'Feuille de route introuvable. Ouvrez-la puis relancez l’audit.',
      fix:'Action proposée'
    }
  };
  const lang = () => document.documentElement.dataset.uiLang || 'ar';
  const t = key => (strings[lang()] || strings.ar)[key] || strings.ar[key] || key;
  const esc = value => String(value || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const norm = value => String(value || '').replace(/\s+/g,' ').trim().toLocaleLowerCase();

  function scan() {
    const panel = document.getElementById('panel-roadmap');
    if (!panel) return null;
    const monthGroups = Array.from(panel.querySelectorAll('.roadmap-month'));
    const weekGroups = Array.from(panel.querySelectorAll('.roadmap-week-activities'));
    const sessionCards = Array.from(panel.querySelectorAll('.roadmap-session'));
    const questions = Array.from(panel.querySelectorAll('.roadmap-quiz-question'));
    const headings = [
      ...Array.from(panel.querySelectorAll('.roadmap-month-title')).map(n=>({text:n.innerText,kind:'unit'})),
      ...Array.from(panel.querySelectorAll('.roadmap-session h4')).map(n=>({text:n.innerText,kind:'session'}))
    ];
    const empty = headings.filter(h=>!norm(h.text)).length;
    const counts = new Map();
    headings.filter(h=>norm(h.text)).forEach(h=>{
      const key=norm(h.text);
      counts.set(key,(counts.get(key)||0)+1);
    });
    const duplicates = Array.from(counts.entries()).filter(([,n])=>n>1).map(([title,n])=>({title,n}));
    const noQuestions = weekGroups.filter(w=>!w.querySelector('.roadmap-quiz-question')).length;
    const noSessions = weekGroups.filter(w=>!w.querySelector('.roadmap-session')).length;
    const noAnswer = questions.filter(q=>{
      return !q.hasAttribute('data-correct') && !q.hasAttribute('data-answer') &&
        !q.hasAttribute('data-civic-correct') && !q.hasAttribute('data-book-q') &&
        !q.querySelector('[data-correct], [data-answer], input[data-correct]');
    }).length;
    return {panel,monthGroups,weekGroups,sessionCards,questions,empty,duplicates,noQuestions,noSessions,noAnswer};
  }

  function render() {
    const panel = document.getElementById('panel-roadmap');
    if (!panel) return;
    let card = panel.querySelector('#ur-curriculum-audit');
    if (!card) {
      card = document.createElement('section');
      card.id='ur-curriculum-audit';
      card.className='card';
      card.style.cssText='border:1px solid #cddfe7;background:#fff;margin:0 0 18px;padding:20px;border-radius:18px;box-shadow:0 5px 18px rgba(16,45,66,.035)';
      const hoursCard=panel.querySelector('#ur-curriculum-hours');
      if(hoursCard) hoursCard.insertAdjacentElement('afterend',card);
      else {
        const banner=panel.querySelector('.banner');
        if(banner) banner.insertAdjacentElement('afterend',card);
        else panel.insertBefore(card,panel.firstChild);
      }
    }
    const data=scan();
    if(!data){
      card.innerHTML='<h2>'+esc(t('title'))+'</h2><p>'+esc(t('emptyDom'))+'</p>';
      return;
    }
    const findings=[];
    if(data.duplicates.length) findings.push({label:t('duplicate'),n:data.duplicates.length,detail:data.duplicates.slice(0,8).map(d=>esc(d.title)+' ('+d.n+')').join('، '),fix:'راجع العناوين المتكررة: قد تكون مراجعة مقصودة أو تكراراً غير ضروري.'});
    if(data.noQuestions) findings.push({label:t('noQuestions'),n:data.noQuestions,detail:'',fix:'أضف اختباراً قصيراً أو وثّق سبب عدم الحاجة إليه.'});
    if(data.noSessions) findings.push({label:t('noSessions'),n:data.noSessions,detail:'',fix:'أضف جلسات قابلة للتتبع أو صحح بنية مجموعة الأسبوع.'});
    if(data.noAnswer) findings.push({label:t('noAnswer'),n:data.noAnswer,detail:'',fix:'تحقق من أن السؤال يحمل مفتاح إجابة موثوقاً وأن التصحيح يعرض تفسيراً.'});
    if(data.empty) findings.push({label:t('empty'),n:data.empty,detail:'',fix:'أضف عنواناً واضحاً أو احذف العنصر الفارغ.'});
    const stats=[
      [t('units'),data.monthGroups.length],
      [t('weeks'),data.weekGroups.length],
      [t('sessions'),data.sessionCards.length],
      [t('questions'),data.questions.length]
    ];
    card.innerHTML=`
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div style="flex:1;min-width:220px"><div style="font-size:11px;font-weight:800;color:#139a95;letter-spacing:.08em">UR · QA</div><h2 style="margin:4px 0 8px">${esc(t('title'))}</h2><p style="margin:0;color:#526176">${esc(t('intro'))}</p></div>
        <button type="button" id="ur-audit-refresh" class="btn btn-soft" style="border:1px solid #ccd7e4;border-radius:10px;padding:8px 12px;background:#f3f8fb;font-weight:800">${esc(t('run'))}</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:9px;margin:16px 0">
        ${stats.map(([label,n])=>`<div style="background:#f3f8fb;border:1px solid #dce7ee;border-radius:12px;padding:12px"><div style="font-size:12px;color:#64748b">${esc(label)}</div><strong style="display:block;font-size:23px;color:#25295b">${n}</strong></div>`).join('')}
      </div>
      <h3 style="margin:14px 0 8px;color:#139a95">${esc(t('findings'))}</h3>
      ${findings.length ? findings.map(f=>`<div style="border:1px solid #ead9b7;background:#fffaf0;border-radius:11px;padding:11px;margin:8px 0"><strong>${esc(f.label)}</strong><span style="display:inline-block;margin-inline-start:8px;border-radius:999px;background:#f3e3bf;padding:2px 8px;font-size:12px">${esc(t('count'))}: ${f.n}</span>${f.detail?'<p style="margin:6px 0">'+f.detail+'</p>':''}<p style="font-size:12px;color:#6b5a3c;margin:6px 0 0"><strong>${esc(t('fix'))}:</strong> ${esc(f.fix)}</p></div>`).join(''):`<p style="border:1px solid #c7e9e1;background:#e3f6f2;border-radius:11px;padding:12px">${esc(t('noFindings'))}</p>`}
      <h3 style="margin:16px 0 8px;color:#139a95">${esc(t('sequence'))}</h3><p>${esc(t('sequenceText'))}</p>
      <details style="margin-top:10px"><summary style="font-weight:800;cursor:pointer">${esc(t('scope'))}</summary><p style="margin-top:8px;font-size:13px;color:#64748b">${esc(t('scopeText'))}</p></details>
    `;
    card.querySelector('#ur-audit-refresh').addEventListener('click',render);
  }

  function start(){
    render();
    const observer=new MutationObserver(records=>{
      const relevant=records.some(record=>{
        const target=record.target.nodeType===1?record.target:record.target.parentElement;
        return target && !target.closest('#ur-curriculum-audit');
      });
      if(!relevant) return;
      const panel=document.getElementById('panel-roadmap');
      if(panel && panel.classList.contains('active')) render();
    });
    const root=document.getElementById('panel-roadmap');
    if(root) observer.observe(root,{childList:true,subtree:true});
    const langObserver=new MutationObserver(()=>render());
    langObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-ui-lang']});
    document.addEventListener('click',event=>{
      const nav=event.target.closest('.nav-item[data-target="roadmap"], [data-home-target="roadmap"]');
      if(nav) setTimeout(render,80);
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();