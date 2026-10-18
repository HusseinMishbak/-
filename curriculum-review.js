/* UR curriculum review: weekly study-hour planner and sequence guidance. */
(function () {
  'use strict';
  if (window.URCurriculumReviewLoaded) return;
  window.URCurriculumReviewLoaded = true;

  const copy = {
    ar: {
      title: 'مراجعة المنهج وخطة الساعات الأسبوعية',
      intro: 'خطة مرنة تربط الدروس بالقواعد والمفردات والاستماع والتحدث والقراءة والكتابة، وتُظهر حجم التدريب المتوقع وفق عدد أسابيع المسار الموجود في المنصة.',
      hours: 'ساعات الدراسة أسبوعياً',
      total: 'المدة المقدّرة للمسار',
      weeks: 'أسابيع المنهج',
      weekly: 'توزيع الساعات المقترح',
      grammar: 'قواعد وبناء الجملة',
      vocab: 'مفردات ومراجعة متباعدة',
      listening: 'استماع وفهم',
      speaking: 'نطق ومحادثة',
      reading: 'قراءة وكتابة',
      review: 'اختبار ومراجعة',
      sequence: 'منطق التسلسل التعليمي',
      sequenceText: 'ابدأ بفهم الأصوات والعبارات الأساسية، ثم ابنِ الجملة القصيرة وأدوات التعريف وتصريف الأفعال في الحاضر. انتقل بعد ذلك إلى مواقف الحياة اليومية، ثم السرد في الماضي والتعبير عن الخطط والرأي، وأخيراً مهام الفهم والإنتاج المنظّمة على نمط DELF. لا تُقدّم قاعدة جديدة قبل أن يستخدم الطالب القاعدة السابقة في جملة مسموعة ومكتوبة.',
      bridge: 'حلقة الربط بين الدروس',
      bridgeText: 'في نهاية كل أسبوع: استرجاع مفردات الأسبوع السابق، تمرين يجمع القاعدة الجديدة بالقديمة، مهمة استماع قصيرة، إنتاج شفهي أو كتابي، ثم اختبار ختامي مع تفسير الأخطاء.',
      note: 'التقدير مبني على الساعات التي تختارها، وليس وعداً ببلوغ مستوى CEFR خلال مدة ثابتة. الوصول إلى B2 يتطلب إتقاناً تراكمياً وتقييماً فعلياً للمهارات الأربع.',
      weekLabel: 'الأسبوع',
      weekHours: 'ساعة تدريب',
      noWeeks: 'لم يتم العثور على أسابيع قابلة للقراءة في مسار المنهج. افتح قسم خارطة الطريق أولاً.'
    },
    en: {
      title: 'Curriculum review & weekly study-hour plan',
      intro: 'A flexible plan connecting grammar, vocabulary, listening, speaking, reading and writing, with study time estimated from the roadmap weeks already present in the platform.',
      hours: 'Study hours per week',
      total: 'Estimated roadmap time',
      weeks: 'Curriculum weeks',
      weekly: 'Suggested weekly allocation',
      grammar: 'Grammar and sentence building',
      vocab: 'Vocabulary and spaced review',
      listening: 'Listening comprehension',
      speaking: 'Pronunciation and speaking',
      reading: 'Reading and writing',
      review: 'Quiz and review',
      sequence: 'Recommended learning sequence',
      sequenceText: 'Start with sounds and essential phrases, then build short sentences, articles and present-tense verbs. Move into everyday situations, then past narration and plans/opinions, and finally structured comprehension and production tasks in the DELF style. Before introducing a new rule, have learners use the previous one in both spoken and written sentences.',
      bridge: 'Connect each lesson to the next',
      bridgeText: 'At the end of each week: retrieve previous vocabulary, combine old and new grammar, complete a short listening task, produce a spoken or written response, then take a final quiz with explanations for errors.',
      note: 'This is a workload estimate, not a guarantee of reaching a CEFR level in a fixed time. B2 requires cumulative mastery and real assessment of all four skills.',
      weekLabel: 'Week',
      weekHours: 'study hours',
      noWeeks: 'No readable roadmap weeks were found. Open the curriculum roadmap first.'
    },
    fr: {
      title: 'Révision du programme et volume horaire hebdomadaire',
      intro: 'Un plan flexible reliant grammaire, vocabulaire, compréhension orale, expression orale, lecture et écriture, selon le nombre de semaines de la feuille de route.',
      hours: 'Heures d’étude par semaine',
      total: 'Durée estimée du parcours',
      weeks: 'Semaines du programme',
      weekly: 'Répartition hebdomadaire proposée',
      grammar: 'Grammaire et construction des phrases',
      vocab: 'Vocabulaire et révision espacée',
      listening: 'Compréhension orale',
      speaking: 'Prononciation et expression orale',
      reading: 'Lecture et écriture',
      review: 'Test et révision',
      sequence: 'Progression pédagogique conseillée',
      sequenceText: 'Commencer par les sons et les expressions essentielles, puis construire des phrases courtes, étudier les articles et les verbes au présent. Passer ensuite aux situations quotidiennes, au récit au passé et à l’expression des projets et des opinions, puis aux tâches structurées de type DELF. Avant une nouvelle règle, réutiliser la précédente à l’oral et à l’écrit.',
      bridge: 'Relier les leçons',
      bridgeText: 'À la fin de chaque semaine : réviser le vocabulaire précédent, combiner les anciennes et nouvelles règles, écouter un court document, produire une réponse orale ou écrite, puis faire un test final avec explication des erreurs.',
      note: 'Il s’agit d’une estimation du temps de travail, et non d’une garantie d’atteindre un niveau CECRL dans un délai fixe. Le niveau B2 exige une maîtrise progressive et une évaluation réelle des quatre compétences.',
      weekLabel: 'Semaine',
      weekHours: 'heures d’étude',
      noWeeks: 'Aucune semaine lisible trouvée. Ouvrez d’abord la feuille de route.'
    }
  };

  function lang() {
    return document.documentElement.dataset.uiLang || 'ar';
  }
  function t(key) {
    const l = copy[lang()] || copy.ar;
    return l[key] || copy.ar[key] || key;
  }
  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  }
  function getWeeks(panel) {
    const nodes = Array.from(panel.querySelectorAll('.roadmap-week-activities'));
    return nodes.map((node, i) => {
      const summary = node.querySelector('summary');
      const title = summary ? summary.innerText.replace(/\s+/g, ' ').trim() : '';
      return { node, title: title || (t('weekLabel') + ' ' + (i + 1)) };
    });
  }
  function render() {
    const panel = document.getElementById('panel-roadmap');
    if (!panel || panel.querySelector('#ur-curriculum-hours')) return;
    const weeks = getWeeks(panel);
    const card = document.createElement('section');
    card.id = 'ur-curriculum-hours';
    card.className = 'card';
    card.style.cssText = 'border:1px solid #cddfe7;background:#fff;margin:0 0 18px;padding:20px;border-radius:18px;box-shadow:0 5px 18px rgba(16,45,66,.035)';
    card.innerHTML = `
      <div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div style="flex:1;min-width:240px">
          <div style="font-size:11px;font-weight:800;color:#139a95;letter-spacing:.08em">UR · CURRICULUM QA</div>
          <h2 style="margin:4px 0 8px">${escapeHtml(t('title'))}</h2>
          <p style="margin:0;color:#526176">${escapeHtml(t('intro'))}</p>
        </div>
        <label style="display:flex;gap:8px;align-items:center;font-weight:800;white-space:nowrap">
          <span>${escapeHtml(t('hours'))}</span>
          <select id="ur-weekly-hours" aria-label="${escapeHtml(t('hours'))}" style="border:1px solid #ccd7e4;border-radius:10px;padding:7px 10px;background:#fff;color:#252b45">
            <option value="4">4</option><option value="6">6</option><option value="8" selected>8</option><option value="10">10</option><option value="12">12</option>
          </select>
        </label>
      </div>
      <div id="ur-hours-stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px;margin:16px 0"></div>
      <h3 style="margin:16px 0 8px;color:#139a95">${escapeHtml(t('weekly'))}</h3>
      <div id="ur-hours-allocation" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px"></div>
      <h3 style="margin:18px 0 8px;color:#139a95">${escapeHtml(t('sequence'))}</h3>
      <p>${escapeHtml(t('sequenceText'))}</p>
      <h3 style="margin:16px 0 8px;color:#139a95">${escapeHtml(t('bridge'))}</h3>
      <p>${escapeHtml(t('bridgeText'))}</p>
      <p style="font-size:12px;color:#64748b;border-top:1px solid #e0e5f0;padding-top:10px;margin-bottom:0">${escapeHtml(t('note'))}</p>
      <details style="margin-top:14px"><summary style="font-weight:800;cursor:pointer">${escapeHtml(t('weeks'))}: ${weeks.length ? weeks.length : '—'} — ${escapeHtml(t('weekHours'))}</summary><ol id="ur-week-list" style="margin:10px 0;padding-inline-start:24px"></ol></details>
    `;
    const first = panel.querySelector('.banner');
    if (first) first.insertAdjacentElement('afterend', card);
    else panel.insertBefore(card, panel.firstChild);

    const select = card.querySelector('#ur-weekly-hours');
    const stats = card.querySelector('#ur-hours-stats');
    const allocation = card.querySelector('#ur-hours-allocation');
    const list = card.querySelector('#ur-week-list');
    const parts = [
      ['grammar', .25], ['vocab', .20], ['listening', .15],
      ['speaking', .15], ['reading', .15], ['review', .10]
    ];
    function update() {
      const hours = Number(select.value) || 8;
      const total = hours * weeks.length;
      stats.innerHTML = [
        [t('weeks'), String(weeks.length)],
        [t('hours'), hours.toFixed(1).replace(/\.0$/,'')],
        [t('total'), total + ' h']
      ].map(([label,value]) => `<div style="background:#f3f8fb;border:1px solid #dce7ee;border-radius:12px;padding:12px"><div style="font-size:12px;color:#64748b">${escapeHtml(label)}</div><strong style="display:block;font-size:23px;color:#25295b">${escapeHtml(value)}</strong></div>`).join('');
      allocation.innerHTML = parts.map(([key,ratio]) => {
        const value = Math.round(hours * ratio * 10) / 10;
        return `<div style="display:flex;justify-content:space-between;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:9px 11px"><span>${escapeHtml(t(key))}</span><strong style="white-space:nowrap">${value} h</strong></div>`;
      }).join('');
      list.innerHTML = weeks.length ? weeks.map((week,i) => `<li style="margin:7px 0">${escapeHtml(week.title)} — <strong>${hours} h</strong></li>`).join('') : '<li>' + escapeHtml(t('noWeeks')) + '</li>';
      weeks.forEach((week,i) => {
        let badge = week.node.querySelector('.ur-week-hours-badge');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'ur-week-hours-badge';
          badge.style.cssText = 'display:inline-flex;align-items:center;border-radius:999px;background:#e3f6f2;color:#0b665d;padding:3px 9px;font-size:11px;font-weight:800;margin-inline-start:8px';
          const summary = week.node.querySelector('summary');
          if (summary) summary.appendChild(badge);
        }
        badge.textContent = hours + ' h';
      });
    }
    select.addEventListener('change', update);
    update();
    const observer = new MutationObserver(() => {
      if (!document.getElementById('ur-curriculum-hours')) return;
      const latest = getWeeks(panel);
      if (latest.length !== weeks.length) {
        card.remove();
        render();
      }
    });
    observer.observe(panel, { childList: true, subtree: true });
  }
  function start() {
    render();
    const langObserver = new MutationObserver(() => {
      const card = document.getElementById('ur-curriculum-hours');
      if (card) { card.remove(); render(); }
    });
    langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-ui-lang'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();