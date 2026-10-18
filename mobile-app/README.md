# تطبيق أور لتعلّم الفرنسية — iOS وAndroid

مشروع جوّال يعتمد على Capacitor ويضم ملفات المنصة التعليمية الحالية داخل التطبيق. يحافظ على منطق المنصة ومحتواها بدلاً من الاكتفاء بفتح صفحة ويب بعيدة.

## بناء Android محلياً

تحتاج إلى Node.js 22 أو أحدث، npm، Java 21، وAndroid Studio مع Android SDK.

من مجلد المشروع:

```bash
npm install
npm run build:web
npx cap add android
npx cap sync android
npx cap open android
```

في Android Studio شغّل التطبيق على جهاز أو محاكي. لإنتاج APK تجريبي من الطرفية بعد إنشاء مجلد android:

```bash
cd android
./gradlew assembleDebug
```

## بناء iPhone

يتطلب بناء iOS جهاز macOS مع إصدار حديث من Xcode:

```bash
npm install
npm run build:web
npx cap add ios
npx cap sync ios
npx cap open ios
```

افتح المشروع في Xcode، اختر فريق التوقيع الصحيح، ثم اختبره على جهاز حقيقي. النشر في App Store يتطلب حساب Apple Developer وتوقيعاً صالحاً وسياسة خصوصية ومراجعة Apple.

## بناء Android آلياً

يوجد سير عمل في `.github/workflows/build-android.yml` ينشئ APK تجريبياً عند تشغيله يدوياً أو عند تغيير ملفات المنصة. بعد اكتماله، افتح تبويب **Actions** في GitHub، واختر التشغيل الناجح، ثم نزّل artifact باسم `orr-french-android-debug`. هذه حزمة اختبار وليست حزمة متجر موقعة.

## اختبار بناء iOS آلياً

من تبويب **Actions** في GitHub شغّل سير العمل **Build iOS simulator app**. ينتج هذا ملف تطبيق للمحاكي فقط، لا يثبت على iPhone فعلي ولا يحل محل التوقيع والشهادات المطلوبة للنشر في App Store.

## حدود النسخة الحالية

- بيانات الحساب والتقدم والاختبارات التي تستخدم Supabase تحتاج إلى الإنترنت.
- تمت إضافة ذاكرة تخزين مؤقت لملفات الواجهة والمواد المحلية، لكنها لا تجعل خدمات تسجيل الدخول أو مزامنة النتائج تعمل دون اتصال.
- ملفات Tailwind وSupabase والخطوط الخارجية تُحمّل من الإنترنت في الوقت الحالي.
- يجب اختبار التسجيل وتأكيد البريد واستعادة كلمة المرور والميكروفون والصوت والروابط الخارجية على iOS وAndroid قبل النشر.
- لا تضع مفتاح Supabase السري أو `service_role` في أي ملف يصل إلى التطبيق. استخدم المفتاح العام فقط مع سياسات RLS صحيحة.
- معرّف التطبيق الحالي `com.husseinmishbak.orrfrench`؛ تغييره لاحقاً يتطلب تحديث إعدادات المنصتين قبل الإصدار النهائي.
