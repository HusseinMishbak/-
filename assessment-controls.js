/* UR Assessment Controls: per-item correction plus whole-activity correction. */
(function () {
  'use strict';
  if (window.URAssessmentControlsLoaded) return;
  window.URAssessmentControlsLoaded = true;

  const ITEM_SELECTOR = [
    '.quiz-question[data-correct]',
    '.m2-question',
    '.book-practice-q[data-book-q]',
    '.book-fill-item[data-book-fill]',
    '.book-match-row[data-book-match]',
    '.book-order-item[data-book-order]',
    '.roadmap-quiz-question[data-correct]',
    '.civ-quiz-question[data-civic-correct]',
    '.placement-question[data-correct]',
    '.unit-vocab-question[data-correct-id]'
  ].join(',');

  const FEEDBACK_SELECTOR = [
    '.quiz-feedback', '.m2-feedback', '.book-practice-feedback',
    '.roadmap-quiz-feedback', '.civ-feedback', '.placement-feedback',
    '.unit-vocab-feedback', '.ur-item-feedback'
  ].join(',');

  const GUIDE_SELECTOR = [
    '#quizForm', '#month2QuizForm', '.book-practice-quiz', '.book-fill-grid',
    '.book-match-grid', '.book-order-grid', '.roadmap-week-quiz',
    '.civ-quiz-grid', '.placement-questions', '[data-unit-vocab-test]'
  ].join(',');

  const escapeHTML = (value) => String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const CORRECTION_MODE_KEY = 'urAssessmentCorrectionMode:v1';
  const DEFAULT_CORRECTION_MODE_KEY = CORRECTION_MODE_KEY + ':default';
  const TEXT = {
    ar: {
      correct: 'إجابة صحيحة ✓', answer: 'الإجابة الصحيحة: ', choose: 'اختر إجابة أولاً، ثم صحّح هذا السؤال.',
      write: 'اكتب إجابتك أولاً، ثم صحّح هذا السؤال.', meaning: 'اختر المعنى أولاً، ثم صحّح هذا السؤال.',
      order: 'رتّب الكلمات أولاً، ثم تحقّق من الإجابة.', modeLabel: 'طريقة التصحيح',
      singleMode: 'تصحيح كل فقرة بمفردها', allMode: 'تصحيح جميع الفقرات بعد الانتهاء',
      singleHint: 'سيظهر زر تصحيح بجانب كل سؤال. صحّح السؤال بعد إجابتك عنه.',
      allHint: 'أجب عن الأسئلة أولاً، ثم استخدم زر التصحيح الجماعي لحساب النتيجة وإظهار التغذية الراجعة.',
      itemButton: 'صحّح هذا السؤال', batchResult: 'النتيجة: {score} من {total} جمل صحيحة.'
    },
    en: {
      correct: 'Correct ✓', answer: 'Correct answer: ', choose: 'Choose an answer first, then check this question.',
      write: 'Enter your answer first, then check this question.', meaning: 'Choose a meaning first, then check this question.',
      order: 'Arrange the words first, then check your answer.', modeLabel: 'Correction mode',
      singleMode: 'Correct each question individually', allMode: 'Correct all answers at the end',
      singleHint: 'A correction button appears beside each question. Check your answer when you finish it.',
      allHint: 'Answer all questions first, then use the whole-activity button to see your score and feedback.',
      itemButton: 'Check this question', batchResult: 'Result: {score} of {total} sentences correct.'
    },
    fr: {
      correct: 'Bonne réponse ✓', answer: 'Réponse correcte : ', choose: 'Choisissez une réponse avant de corriger cette question.',
      write: 'Saisissez votre réponse avant de corriger cette question.', meaning: 'Choisissez un sens avant de corriger cette question.',
      order: 'Mettez les mots dans l’ordre avant de vérifier la réponse.', modeLabel: 'Mode de correction',
      singleMode: 'Corriger chaque question séparément', allMode: 'Corriger toutes les réponses à la fin',
      singleHint: 'Un bouton de correction apparaît à côté de chaque question. Vérifiez votre réponse dès que vous avez terminé.',
      allHint: 'Répondez à toutes les questions, puis utilisez le bouton de correction globale pour afficher le résultat et les explications.',
      itemButton: 'Corriger cette question', batchResult: 'Résultat : {score} sur {total} phrases correctes.'
    }
  };
  function text(key) {
    const language = document.documentElement.dataset.uiLang || 'ar';
    return (TEXT[language] || TEXT.ar)[key] || TEXT.ar[key];
  }

  function normalize(value) {
    return String(value == null ? '' : value)
      .normalize('NFC').trim().toLocaleLowerCase()
      .replace(/[’‘]/g, "'").replace(/[“”]/g, '"')
      .replace(/\s+/g, ' ').replace(/[.!?؛،]+$/g, '');
  }

  function getCheckedRadio(card) {
    return card.querySelector('input[type="radio"]:checked');
  }

  function labelForRadio(card, value) {
    const input = Array.from(card.querySelectorAll('input[type="radio"]'))
      .find((item) => item.value === String(value));
    if (!input) return '';
    const label = input.closest('label');
    return (label || input.parentElement || {}).innerText || '';
  }

  function getFeedback(card) {
    let feedback = card.querySelector(FEEDBACK_SELECTOR);
    if (!feedback) {
      feedback = document.createElement('p');
      feedback.className = 'ur-item-feedback';
      feedback.setAttribute('aria-live', 'polite');
      card.appendChild(feedback);
    }
    feedback.hidden = true;
    return feedback;
  }

  function addItemButton(card) {
    if (card.dataset.urSingleBound === '1') return;
    card.dataset.urSingleBound = '1';

    // The sentence-order exercise already has its own item-level check button.
    if (card.matches('.book-order-item') && card.querySelector('[data-check-order]')) return;

    const feedback = getFeedback(card);
    const actions = document.createElement('div');
    actions.className = 'ur-item-actions';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-soft ur-grade-single';
    button.dataset.urGradeSingle = '1';
    button.textContent = text('itemButton');
    button.setAttribute('aria-label', text('itemButton'));

    actions.appendChild(button);
    feedback.parentNode.insertBefore(actions, feedback);
  }

  function getContainerKey(container) {
    if (container.dataset.urCorrectionKey) return container.dataset.urCorrectionKey;
    if (container.matches('[data-unit-vocab-test]')) return 'unit-vocab-' + container.dataset.unitVocabTest;
    if (container.matches('.roadmap-week-quiz')) return 'roadmap-week-' + (container.dataset.weekQuiz || 'unknown');
    const bookUnit = container.closest('[data-book-practice-unit]');
    if (bookUnit) {
      const unit = bookUnit.dataset.bookPracticeUnit || 'unknown';
      const type = container.matches('.book-practice-quiz') ? 'choice' :
        container.matches('.book-fill-grid') ? 'fill' :
        container.matches('.book-match-grid') ? 'match' :
        container.matches('.book-order-grid') ? 'order' : 'exercise';
      return 'book-unit-' + unit + '-' + type;
    }
    if (container.id) return container.id;
    const signature = Array.from(container.classList).sort().join('-') || 'quiz';
    const peers = Array.from(document.querySelectorAll(GUIDE_SELECTOR))
      .filter(node => node !== container && (Array.from(node.classList).sort().join('-') || 'quiz') === signature);
    return 'group-' + signature + '-' + (peers.filter(node => document.documentElement.contains(node) && node.compareDocumentPosition(container) & Node.DOCUMENT_POSITION_FOLLOWING).length + 1);
  }

  function readCorrectionMode(container) {
    const key = CORRECTION_MODE_KEY + ':' + getContainerKey(container);
    try {
      const saved = localStorage.getItem(key);
      if (saved === 'all' || saved === 'single') return saved;
      return localStorage.getItem(DEFAULT_CORRECTION_MODE_KEY) === 'all' ? 'all' : 'single';
    } catch (_) { return 'single'; }
  }

  function getControlScope(container) {
    if (container.matches('[data-unit-vocab-test]')) return container;
    return container.parentElement || container;
  }

  const BATCH_BUTTON_SELECTOR = [
    '#gradeQuiz', '#gradeMonth2Quiz', '#gradePlacement',
    '[data-grade-book-quiz]', '[data-grade-book-fill]', '[data-grade-book-match]',
    '[data-grade-book-order]', '[data-grade-week]', '[data-grade-unit-vocab]',
    '[data-grade-civic]', '[data-grade-placement]'
  ].join(',');

  function setButtonVisibility(button, visible) {
    button.hidden = !visible;
    button.classList.toggle('ur-mode-hidden', !visible);
  }

  function applyMode(container, mode) {
    if (!container || !container.isConnected) return;
    const scope = getControlScope(container);
    const single = mode !== 'all';
    scope.querySelectorAll('.ur-grade-single').forEach(button => setButtonVisibility(button, single));
    scope.querySelectorAll('[data-check-order]').forEach(button => setButtonVisibility(button, single));
    scope.querySelectorAll(BATCH_BUTTON_SELECTOR).forEach(button => setButtonVisibility(button, !single));
    const guide = Array.from(document.querySelectorAll('.ur-assessment-controls'))
      .find(node => node.dataset.forContainer === getContainerKey(container));
    if (guide) {
      const hint = guide.querySelector('.ur-assessment-guide');
      if (hint) hint.textContent = text(single ? 'singleHint' : 'allHint');
    }
  }

  let guideCounter = 0;
  function getContainerKey(container) {
    if (!container.dataset.urCorrectionKey) container.dataset.urCorrectionKey = 'ur-correction-' + (++guideCounter);
    return container.dataset.urCorrectionKey;
  }

  function syncCorrectionMode(container, mode) {
    const chosen = mode === 'all' ? 'all' : 'single';
    const key = CORRECTION_MODE_KEY + ':' + getContainerKey(container);
    try {
      localStorage.setItem(key, chosen);
      localStorage.setItem(DEFAULT_CORRECTION_MODE_KEY, chosen);
    } catch (_) {}
    const guide = Array.from(document.querySelectorAll('.ur-assessment-controls'))
      .find(node => node.dataset.forContainer === getContainerKey(container));
    const select = guide && guide.querySelector('.ur-correction-mode');
    if (select) select.value = chosen;
    applyMode(container, chosen);
  }

  function addGuide(container) {
    if (container.dataset.urGuideBound === '1') {
      applyMode(container, readCorrectionMode(container));
      return;
    }
    container.dataset.urGuideBound = '1';
    const key = getContainerKey(container);
    const guide = document.createElement('div');
    guide.className = 'ur-assessment-controls';
    guide.dataset.forContainer = key;

    const label = document.createElement('label');
    label.textContent = text('modeLabel');
    const select = document.createElement('select');
    select.className = 'ur-correction-mode';
    select.setAttribute('aria-label', text('modeLabel'));
    select.innerHTML = '<option value="single">' + text('singleMode') + '</option><option value="all">' + text('allMode') + '</option>';
    select.value = readCorrectionMode(container);
    label.appendChild(select);

    const hint = document.createElement('p');
    hint.className = 'ur-assessment-guide';
    hint.setAttribute('aria-live', 'polite');
    hint.textContent = text(select.value === 'all' ? 'allHint' : 'singleHint');
    guide.appendChild(label);
    guide.appendChild(hint);
    container.parentNode.insertBefore(guide, container);
    select.addEventListener('change', () => syncCorrectionMode(container, select.value));
    applyMode(container, readCorrectionMode(container));
  }

  function scan(root) {
    if (!root) return;
    if (root.nodeType === 1 && root.matches && root.matches(ITEM_SELECTOR)) addItemButton(root);
    if (root.querySelectorAll) root.querySelectorAll(ITEM_SELECTOR).forEach(addItemButton);
    if (root.nodeType === 1 && root.matches && root.matches(GUIDE_SELECTOR)) addGuide(root);
    if (root.querySelectorAll) root.querySelectorAll(GUIDE_SELECTOR).forEach(addGuide);
  }

  function showFeedback(card, ok, message) {
    const feedback = getFeedback(card);
    feedback.hidden = false;
    feedback.classList.remove('ur-item-correct', 'ur-item-wrong');
    feedback.classList.add(ok ? 'ur-item-correct' : 'ur-item-wrong');
    feedback.textContent = message;
    card.classList.toggle('ur-checked-correct', ok);
    card.classList.toggle('ur-checked-wrong', !ok);
  }

  function correctSingle(card) {
    let ok = false;
    let chosen = '';
    let expected = '';
    let explanation = '';

    if (card.matches('.book-fill-item')) {
      const input = card.querySelector('.book-fill-input');
      if (!input || !input.value.trim()) {
        showFeedback(card, false, text('write'));
        return;
      }
      let accepted = [];
      try { accepted = JSON.parse(input.dataset.accepted || '[]'); } catch (_) {}
      if (!accepted.length && input.dataset.answer) accepted = [input.dataset.answer];
      chosen = input.value;
      expected = input.dataset.answer || accepted[0] || '';
      ok = accepted.some((answer) => normalize(answer) === normalize(chosen));
      explanation = input.dataset.why || '';
    } else if (card.matches('.book-match-row')) {
      const select = card.querySelector('select');
      if (!select || !select.value) {
        showFeedback(card, false, text('meaning'));
        return;
      }
      chosen = select.value;
      expected = card.dataset.correct || '';
      ok = normalize(chosen) === normalize(expected);
    } else if (card.matches('.book-order-item')) {
      const built = card.querySelector('.book-order-built');
      if (!built || !built.textContent.trim()) {
        showFeedback(card, false, text('order'));
        return;
      }
      chosen = built.textContent;
      expected = card.dataset.answer || '';
      ok = normalize(chosen) === normalize(expected);
      explanation = card.dataset.translation || '';
    } else if (card.matches('.unit-vocab-question')) {
      const selected = getCheckedRadio(card);
      if (!selected) {
        showFeedback(card, false, text('choose'));
        return;
      }
      chosen = selected.value;
      expected = card.dataset.correctId || '';
      ok = chosen === expected;
      const term = card.dataset.wordFr || '';
      const ar = card.dataset.wordAr || '';
      const en = card.dataset.wordEn || '';
      showFeedback(card, ok, ok
        ? text('correct') + ' ' + term + ' — ' + ar
        : text('answer') + term + ' — ' + ar + (en ? ' (' + en + ')' : ''));
      card.classList.toggle('is-correct', ok);
      card.classList.toggle('is-incorrect', !ok);
      return;
    } else {
      const selected = getCheckedRadio(card);
      if (!selected) {
        showFeedback(card, false, text('choose'));
        return;
      }
      chosen = selected.value;
      explanation = card.dataset.why || card.dataset.civicWhy || '';
      if (card.matches('.m2-question')) {
        expected = card.dataset.answer || '';
        ok = chosen === expected;
      } else {
        expected = card.dataset.correct != null ? card.dataset.correct : card.dataset.civicCorrect;
        ok = Number(chosen) === Number(expected);
      }
      if (expected != null) {
        const label = labelForRadio(card, expected);
        if (label) card.dataset.urExpectedLabel = label.trim();
      }
    }

    const label = card.dataset.correctLabel || card.dataset.urExpectedLabel || expected;
    const message = ok
      ? text('correct') + (explanation ? ' ' + explanation : '')
      : text('answer') + (label || 'راجع الخيار الصحيح') + (explanation ? ' — ' + explanation : '');
    showFeedback(card, ok, message);
    card.classList.toggle('is-correct', ok);
    card.classList.toggle('is-incorrect', !ok);
  }

  document.addEventListener('click', function (event) {
    const gradeOrder = event.target.closest('[data-grade-book-order]');
    if (gradeOrder) {
      const unit = gradeOrder.dataset.gradeBookOrder;
      const wrap = document.querySelector('[data-book-practice-unit="' + unit + '"]');
      const items = wrap ? Array.from(wrap.querySelectorAll('.book-order-grid .book-order-item')) : [];
      if (!items.length) return;
      items.forEach(correctSingle);
      const score = items.filter(item => item.classList.contains('ur-checked-correct')).length;
      const result = wrap.querySelector('#book-order-result-' + unit);
      if (result) {
        result.hidden = false;
        result.textContent = text('batchResult').replace('{score}', String(score)).replace('{total}', String(items.length));
      }
      return;
    }

    const resetOrder = event.target.closest('[data-reset-book-order]');
    if (resetOrder) {
      const unit = resetOrder.dataset.resetBookOrder;
      const wrap = document.querySelector('[data-book-practice-unit="' + unit + '"]');
      if (!wrap) return;
      wrap.querySelectorAll('.book-order-grid [data-reset-order]').forEach(button => button.click());
      const result = wrap.querySelector('#book-order-result-' + unit);
      if (result) { result.hidden = true; result.textContent = ''; }
      return;
    }

    const button = event.target.closest('[data-ur-grade-single]');
    if (!button) return;
    const card = button.closest(ITEM_SELECTOR);
    if (card) correctSingle(card);
  });

  function clearPreviousFeedback(target) {
    const card = target && target.closest ? target.closest(ITEM_SELECTOR) : null;
    if (!card) return;
    card.classList.remove('ur-checked-correct', 'ur-checked-wrong', 'is-correct', 'is-incorrect', 'correct', 'incorrect');
    const feedback = card.querySelector(FEEDBACK_SELECTOR);
    if (feedback) {
      feedback.hidden = true;
      feedback.classList.remove('ur-item-correct', 'ur-item-wrong');
      feedback.textContent = '';
    }
  }
  document.addEventListener('change', function (event) {
    if (event.target.matches('.ur-correction-mode')) return;
    if (event.target.matches('input[type="radio"], select')) clearPreviousFeedback(event.target);
  });
  document.addEventListener('input', function (event) {
    if (event.target.matches('.book-fill-input')) clearPreviousFeedback(event.target);
  });

  function start() {
    scan(document);
    const observer = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node.nodeType === 1) scan(node);
      }));
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();