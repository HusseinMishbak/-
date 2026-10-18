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


## واجهة الهاتف

- شريط تنقّل سفلي من خمس وجهات سريعة: الرئيسية، الخطة، المفردات، الاستماع، والحساب.
- تتبدل تسميات الشريط بين العربية والإنجليزية والفرنسية تبعاً للغة الواجهة.
- مراعاة المساحات الآمنة في أجهزة iPhone، مع ترك مساحة فوق مؤشر الشاشة ومنع تغطية التنبيهات بشريط التنقل.
- إعدادات شريط الحالة وشاشة البداية ولوحة المفاتيح الأصلية عبر إضافات Capacitor.
- هوية موحدة بلون كحلي/فيروزي ولمسات ذهبية، مع توليد الأيقونات الأصلية وشاشة البداية أثناء البناء.

## ملاحظات بناء Android

سير العمل يثبت أدوات المنصة عبر إجراء الإعداد ثم يثبّت منصة Android وأدوات البناء بأمر منفصل، ثم ينشئ أيقونة التطبيق وشاشة البداية من ملفات الهوية البصرية.

## متابعة البناء الآلي

- Android: [سير عمل البناء](https://github.com/HusseinMishbak/-/actions/workflows/build-android.yml). عند نجاحه، نزّل artifact باسم `orr-french-android-debug` من صفحة تشغيله.
- iOS Simulator: [سير عمل البناء](https://github.com/HusseinMishbak/-/actions/workflows/build-ios-simulator.yml). ينتج ملفاً للمحاكي للاختبار، وليس ملفاً موقعاً لجهاز iPhone فعلي أو للنشر في App Store.
- حالة التشغيل والسبب التفصيلي لأي فشل متاحان في تبويب Actions.

## اختبار بناء iOS آلياً

من تبويب **Actions** في GitHub شغّل سير العمل **Build iOS simulator app**. ينتج هذا ملف تطبيق للمحاكي فقط، لا يثبت على iPhone فعلي ولا يحل محل التوقيع والشهادات المطلوبة للنشر في App Store.

## حدود النسخة الحالية

- بيانات الحساب والتقدم والاختبارات التي تستخدم Supabase تحتاج إلى الإنترنت.
- تمت إضافة ذاكرة تخزين مؤقت لملفات الواجهة والمواد المحلية، لكنها لا تجعل خدمات تسجيل الدخول أو مزامنة النتائج تعمل دون اتصال.
- ملفات Tailwind وSupabase والخطوط الخارجية تُحمّل من الإنترنت في الوقت الحالي.
- يجب اختبار التسجيل وتأكيد البريد واستعادة كلمة المرور والميكروفون والصوت والروابط الخارجية على iOS وAndroid قبل النشر.
- لا تضع مفتاح Supabase السري أو `service_role` في أي ملف يصل إلى التطبيق. استخدم المفتاح العام فقط مع سياسات RLS صحيحة.
- معرّف التطبيق الحالي `com.husseinmishbak.orrfrench`؛ تغييره لاحقاً يتطلب تحديث إعدادات المنصتين قبل الإصدار النهائي.


## iPhone App Store / TestFlight release

- Public privacy policy: https://husseinmishbak.github.io/-/privacy.html
- Release runbook: see IOS_RELEASE.md.
- GitHub Actions workflow: **Build and upload iOS to TestFlight**. It signs an iOS release IPA and uploads it to TestFlight once the publisher configures the required Apple distribution certificate, provisioning profile and App Store Connect API key as repository secrets.
- The iOS Simulator workflow is for simulator QA only. It does not produce an IPA that can be installed on a physical iPhone.
- Uploading to TestFlight does not publish publicly to the App Store. App Store Connect listing, privacy declarations, screenshots and Apple review are still required.
