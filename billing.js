/* URFRE billing UI. Prices and payment authority remain server-side in Stripe. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const panel = $('urfreBillingPanel');
  if (!panel) return;
  const setStatus = (message, kind = 'info') => {
    const node = $('urfreBillingStatus');
    if (!node) return;
    node.textContent = message;
    node.dataset.kind = kind;
    node.setAttribute('role', 'status');
  };
  const client = () => window.OUR_FRENCH_APP?.getClient?.();
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let sessionUserId = null;
  let busy = false;
  let paymentConfig = { billing_enabled: false, monthly_enabled: false, annual_enabled: false };
  let canManageSubscription = false;

  async function getUser() {
    const db = client();
    if (!db) return { db: null, user: null, profile: null };
    const { data } = await db.auth.getSession();
    const user = data?.session?.user || null;
    if (!user) return { db, user: null, profile: null };
    const { data: profile } = await db.from('profiles').select('id,role,full_name,referred_by_teacher_id').eq('id', user.id).maybeSingle();
    return { db, user, profile };
  }

  function setButtonsEnabled(enabled) {
    const monthly = $('urfreSubscribeMonthly');
    const annual = $('urfreSubscribeAnnual');
    const manage = $('urfreManageSubscription');
    if (monthly) monthly.disabled = !enabled || busy || !paymentConfig.monthly_enabled;
    if (annual) annual.disabled = !enabled || busy || !paymentConfig.annual_enabled;
    if (manage) manage.disabled = !enabled || busy || !canManageSubscription;
  }

  async function refresh() {
    const { db, user, profile } = await getUser();
    if (!db) {
      setStatus('اتصال الحسابات غير مهيأ. لا يمكن بدء دفع حقيقي حتى يكتمل إعداد الحساب السحابي.', 'warn');
      setButtonsEnabled(false);
      return;
    }
    if (!user) {
      sessionUserId = null;
      setStatus('أنشئ حساباً أو سجّل الدخول لعرض حالة الاشتراك. الدفع غير مفعّل حتى إعداد حساب Stripe والأسعار.', 'info');
      setButtonsEnabled(false);
      return;
    }
    sessionUserId = user.id;
    try {
      const { data: readiness, error: readinessError } = await db.functions.invoke('create-checkout-session', { method: 'GET' });
      paymentConfig = (!readinessError && readiness) ? readiness : { billing_enabled: false, monthly_enabled: false, annual_enabled: false };
    } catch (_) {
      paymentConfig = { billing_enabled: false, monthly_enabled: false, annual_enabled: false };
    }
    const readyBadge = $('urfreBillingBadge');
    if (readyBadge) readyBadge.textContent = (paymentConfig.monthly_enabled || paymentConfig.annual_enabled) ? 'بوابة الدفع مهيأة' : 'الدفع غير مفعّل بعد';
    const card = $('urfreBillingIdentity');
    if (card) card.textContent = 'الحساب: ' + (user.email || user.id);
    const teacher = profile?.role === 'teacher';
    if (teacher) {
      setStatus('حساب مدرّس معتمد — مجاني. رمز الدعوة لا يمنح صلاحية المدرّس ولا يستلزم اشتراكاً من المدرّس.', 'success');
      $('urfreTeacherInvite')?.classList.remove('hidden');
      $('urfreStudentBillingActions')?.classList.add('hidden');
      $('urfreTeacherBillingActions')?.classList.remove('hidden');
      const { data: code } = await db.from('teacher_referral_codes').select('code,is_active').eq('teacher_id', user.id).eq('is_active', true).maybeSingle();
      $('urfreTeacherCode').textContent = code?.code || 'لم يخصص رمز بعد — يفعّله مدير المنصة.';
      try {
        const { data: stats, error: statsError } = await db.functions.invoke('teacher-referral-stats', { method: 'GET' });
        if (!statsError && stats) {
          $('urfreTeacherReferrals').textContent = String(stats.total_referrals ?? 0);
          $('urfreTeacherPaidCount').textContent = String(stats.active_paid_subscribers ?? 0);
          $('urfreTeacherPastDueCount').textContent = String(stats.past_due_subscribers ?? 0);
        } else {
          $('urfreTeacherReferrals').textContent = '—';
          $('urfreTeacherPaidCount').textContent = '—';
          $('urfreTeacherPastDueCount').textContent = '—';
          setStatus('تعذر تحميل إحصاءات الإحالة. تأكد من نشر وظيفة إحصاءات المدرّس وتطبيق ترحيل قاعدة البيانات.', 'warn');
        }
      } catch (_) {
        $('urfreTeacherReferrals').textContent = '—';
        $('urfreTeacherPaidCount').textContent = '—';
        $('urfreTeacherPastDueCount').textContent = '—';
      }
      setButtonsEnabled(false);
      return;
    }
    $('urfreTeacherInvite')?.classList.add('hidden');
    $('urfreStudentBillingActions')?.classList.remove('hidden');
    $('urfreTeacherBillingActions')?.classList.add('hidden');

    const { data: sub, error } = await db.from('billing_subscriptions')
      .select('status,plan_key,current_period_end,cancel_at_period_end,stripe_customer_id').eq('user_id', user.id).maybeSingle();
    if (error) {
      setStatus('لم تجهز جداول الاشتراك بعد. يلزم تطبيق ترحيل قاعدة البيانات ونشر وظائف الدفع أولاً.', 'warn');
      setButtonsEnabled(false);
      return;
    }
    canManageSubscription = Boolean(sub?.stripe_customer_id);
    if (sub && ['active','trialing'].includes(sub.status)) {
      const end = sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'غير محدد';
      setStatus('الاشتراك نشط (' + (sub.plan_key === 'annual' ? 'سنوي' : 'شهري') + '). حتى: ' + end + (sub.cancel_at_period_end ? ' — مقرر الإلغاء عند نهاية الفترة.' : ''), 'success');
    } else if (sub?.status === 'past_due') {
      setStatus('هناك مشكلة في دفعة الاشتراك. افتح إدارة الاشتراك لتحديث طريقة الدفع.', 'warn');
    } else if (sub?.status === 'canceled') {
      setStatus('انتهى الاشتراك أو أُلغي. يمكنك اختيار خطة جديدة.', 'info');
    } else if (!(paymentConfig.monthly_enabled || paymentConfig.annual_enabled)) {
      setStatus('لم يفعّل مالك المنصة بوابة الدفع بعد. لا يمكن بدء تحصيل الأموال حالياً.', 'warn');
    } else {
      setStatus('لا يوجد اشتراك مدفوع نشط على هذا الحساب. أسعار الخطط وطرق الدفع تُحدد في صفحة الدفع الآمنة.', 'info');
    }
    setButtonsEnabled(true);
  }

  async function invokeCheckout(plan) {
    if (busy) return;
    const db = client();
    if (!db) { setStatus('خدمة الحسابات غير مهيأة.', 'error'); return; }
    const { data: sessionData } = await db.auth.getSession();
    if (!sessionData?.session?.access_token) { setStatus('سجّل الدخول أولاً ثم أعد المحاولة.', 'warn'); return; }
    busy = true; setButtonsEnabled(false);
    const button = $(plan === 'annual' ? 'urfreSubscribeAnnual' : 'urfreSubscribeMonthly');
    const label = button?.textContent;
    if (button) button.textContent = 'جارٍ فتح الدفع الآمن…';
    try {
      const promo = $('urfrePromoCode')?.value.trim() || '';
      const { data, error } = await db.functions.invoke('create-checkout-session', {
        body: { plan, promotion_code: promo }
      });
      let payload = data;
      if (error && !payload && error.context?.clone) {
        try { payload = await error.context.clone().json(); } catch (_) {}
      }
      if (error || !payload?.url) {
        const code = payload?.error || '';
        const detail = payload?.message || error?.message || 'الدفع غير مهيأ بعد';
        if (code === 'billing_not_configured') setStatus('لم يفعّل مالك المنصة الدفع بعد. لا تُدخل بيانات البطاقة في هذه الصفحة.', 'warn');
        else if (code === 'price_not_configured') setStatus('لم يحدد مالك المنصة سعر هذه الخطة بعد.', 'warn');
        else setStatus(String(detail), 'warn');
        return;
      }
      window.location.assign(payload.url);
    } catch (e) {
      setStatus('تعذر الاتصال بخدمة الدفع. لم تُخصم أي أموال من هذه المحاولة؛ تحقق من حالة البنك فقط إذا ظهرت لك صفحة دفع فعلية.', 'error');
    } finally {
      busy = false;
      if (button && label) button.textContent = label;
      setButtonsEnabled(true);
    }
  }

  async function openPortal() {
    if (busy) return;
    const db = client();
    if (!db) return;
    busy = true; setButtonsEnabled(false);
    try {
      const { data, error } = await db.functions.invoke('create-billing-portal-session', { body: {} });
      let payload = data;
      if (error && !payload && error.context?.clone) {
        try { payload = await error.context.clone().json(); } catch (_) {}
      }
      if (error || !payload?.url) {
        setStatus(payload?.message || error?.message || 'تعذر فتح إدارة الاشتراك. قد لا يوجد حساب دفع مرتبط بعد.', 'warn');
        return;
      }
      window.location.assign(payload.url);
    } catch {
      setStatus('تعذر فتح إدارة الاشتراك حالياً.', 'error');
    } finally {
      busy = false; setButtonsEnabled(true);
    }
  }

  $('urfreSubscribeMonthly')?.addEventListener('click', () => invokeCheckout('monthly'));
  $('urfreSubscribeAnnual')?.addEventListener('click', () => invokeCheckout('annual'));
  $('urfreManageSubscription')?.addEventListener('click', openPortal);
  $('urfreCopyTeacherCode')?.addEventListener('click', async () => {
    const code = $('urfreTeacherCode')?.textContent || '';
    if (!code || code.startsWith('لم يخصص')) { setStatus('لم يخصص رمز دعوة لهذا المدرّس بعد.', 'warn'); return; }
    try {
      await navigator.clipboard.writeText(code);
      setStatus('تم نسخ رمز المدرّس: ' + code, 'success');
    } catch { setStatus('تعذر النسخ التلقائي. انسخ الرمز يدوياً: ' + code, 'info'); }
  });

  const db = client();
  if (db?.auth?.onAuthStateChange) db.auth.onAuthStateChange((_event, session) => {
    if (!session?.user || session.user.id !== sessionUserId) sessionUserId = session?.user?.id || null;
    setTimeout(() => refresh().catch(() => setStatus('تعذر تحديث حالة الاشتراك.', 'warn')), 0);
  });
  refresh().catch(() => setStatus('تعذر تحميل حالة الاشتراك.', 'warn'));

  const params = new URLSearchParams(location.search);
  if (params.get('billing') === 'success') {
    setStatus('عاد المتصفح من صفحة الدفع. ننتظر تأكيد مزوّد الدفع الآمن قبل تفعيل الاشتراك؛ قد يستغرق ذلك لحظات.', 'info');
    setTimeout(() => refresh().catch(() => {}), 2500);
  } else if (params.get('billing') === 'cancel') {
    setStatus('أُلغيت عملية الدفع؛ لم نفعّل الاشتراك.', 'info');
  }
})();
