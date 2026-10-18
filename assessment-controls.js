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
    button.textContent = 'صحّح هذا السؤال';
    button.setAttribute('aria-label', 'تصحيح هذا السؤال فقط');

    actions.appendChild(button);
    feedback.parentNode.insertBefore(actions, feedback);
  }

  function addGuide(container) {
    if (container.dataset.urGuideBound === '1') return;
    container.dataset.urGuideBound = '1';
    const guide = document.createElement('p');
    guide.className = 'ur-assessment-guide';
    guide.textContent = 'اختر طريقة التصحيح: صحّح كل سؤال فور الانتهاء منه، أو أجب عن جميع الأسئلة ثم استخدم زر تصحيح الاختبار لحساب النتيجة الإجمالية.';
    container.parentNode.insertBefore(guide, container);
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
        showFeedback(card, false, 'اكتب إجابتك أولاً، ثم صحّح هذا السؤال.');
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
        showFeedback(card, false, 'اختر المعنى أولاً، ثم صحّح هذا السؤال.');
        return;
      }
      chosen = select.value;
      expected = card.dataset.correct || '';
      ok = normalize(chosen) === normalize(expected);
    } else if (card.matches('.book-order-item')) {
      const built = card.querySelector('.book-order-built');
      if (!built || !built.textContent.trim()) {
        showFeedback(card, false, 'رتّب الكلمات أولاً، ثم تحقّق من الإجابة.');
        return;
      }
      chosen = built.textContent;
      expected = card.dataset.answer || '';
      ok = normalize(chosen) === normalize(expected);
      explanation = card.dataset.translation || '';
    } else if (card.matches('.unit-vocab-question')) {
      const selected = getCheckedRadio(card);
      if (!selected) {
        showFeedback(card, false, 'اختر إجابة أولاً، ثم صحّح هذا السؤال.');
        return;
      }
      chosen = selected.value;
      expected = card.dataset.correctId || '';
      ok = chosen === expected;
      const term = card.dataset.wordFr || '';
      const ar = card.dataset.wordAr || '';
      const en = card.dataset.wordEn || '';
      showFeedback(card, ok, ok
        ? 'صحيح ✓ ' + term + ' — ' + ar
        : 'الإجابة الصحيحة: ' + term + ' — ' + ar + (en ? ' (' + en + ')' : ''));
      card.classList.toggle('is-correct', ok);
      card.classList.toggle('is-incorrect', !ok);
      return;
    } else {
      const selected = getCheckedRadio(card);
      if (!selected) {
        showFeedback(card, false, 'اختر إجابة أولاً، ثم صحّح هذا السؤال.');
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
      ? 'إجابة صحيحة ✓' + (explanation ? ' ' + explanation : '')
      : 'الإجابة الصحيحة: ' + (label || 'راجع الخيار الصحيح') + (explanation ? ' — ' + explanation : '');
    showFeedback(card, ok, message);
    card.classList.toggle('is-correct', ok);
    card.classList.toggle('is-incorrect', !ok);
  }

  document.addEventListener('click', function (event) {
    const button = event.target.closest('[data-ur-grade-single]');
    if (!button) return;
    const card = button.closest(ITEM_SELECTOR);
    if (card) correctSingle(card);
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