import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), '..');
const out = resolve(process.cwd(), 'www');

const requiredFiles = [
  'index.html',
  'favicon.svg',
  'curriculum.js',
  'pronunciation-lesson.js',
  'curriculum-review.js',
  'speaking-assessment.js',
  'conversation-podcast.js',
  'podcast-six-minutes.js',
  'learning-games.js',
  'i18n.js',
  'curriculum-audit.js',
  'assessment-controls.js',
  'learning-experience.js',
  'privacy.html'
];

const requiredStyles = [
  'frello-inspired-refresh.css',
  'learning-experience.css'
];

await mkdir(out, { recursive: true });
for (const file of requiredFiles) {
  await cp(resolve(root, file), resolve(out, file));
}

await mkdir(resolve(out, 'ui'), { recursive: true });
for (const file of requiredStyles) {
  await cp(resolve(root, 'ui', file), resolve(out, 'ui', file));
}

let html = await readFile(resolve(out, 'index.html'), 'utf8');

// The web source already owns the manifest/service-worker tags. Add only
// native presentation metadata here, without duplicating service-worker
// registration or replacing the existing hosted-site URLs.
// Use the mobile shell worker in this bundled distribution. Native Capacitor
// uses capacitor://localhost and does not register service workers.
html = html.replace("register('./service-worker.js')", "register('./sw.js')");

if (!html.includes('name="orr-native-app"')) {
  html = html.replace('</head>', `  <meta name="orr-native-app" content="ios-android">
  <style id="orr-native-mobile-ui">
    @media(max-width:760px){body{padding-bottom:calc(84px + env(safe-area-inset-bottom))}.native-tabbar{position:fixed;z-index:9999;left:0;right:0;bottom:0;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:3px;padding:8px 10px calc(8px + env(safe-area-inset-bottom));background:rgba(255,255,255,.94);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-top:1px solid #dfe7f0;box-shadow:0 -8px 30px rgba(37,41,91,.08)}.native-tab{min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border:0;background:transparent;color:#66718b;border-radius:12px;padding:5px 2px;font:600 10px/1.25 -apple-system,BlinkMacSystemFont,sans-serif}.native-tab .native-tab-icon{font-size:19px;line-height:1.2}.native-tab[aria-current="page"]{background:#edf0ff;color:#25295b;font-weight:800}.native-tab:active{transform:scale(.97)}.toast{bottom:calc(94px + env(safe-area-inset-bottom))!important}.app-layout{padding-bottom:8px}}
    @media(min-width:761px){.native-tabbar{display:none!important}}
    .native-policy-links{margin:16px 0 26px;padding:12px 4px;text-align:center;color:#66718b;font-size:12px}
    .native-policy-links a{color:#405bd3;text-decoration:underline;text-underline-offset:3px;margin:0 6px}
  </style>
</head>`);
}

html = html.replace(/(<link\b[^>]*rel=["']apple-touch-icon["'][^>]*href=["'])\.\/favicon\.svg(["'][^>]*>)/i, '$1./app-icon.svg$2');

if (!html.includes('class="native-tabbar"')) {
  html = html.replace('</body>', `  <nav class="native-tabbar" aria-label="Orr quick navigation">
    <button class="native-tab" type="button" data-native-target="home" aria-current="page"><span class="native-tab-icon">⌂</span><span data-ar="الرئيسية" data-en="Home" data-fr="Accueil">الرئيسية</span></button>
    <button class="native-tab" type="button" data-native-target="bookplan"><span class="native-tab-icon">▤</span><span data-ar="الخطة" data-en="Plan" data-fr="Parcours">الخطة</span></button>
    <button class="native-tab" type="button" data-native-target="vocab"><span class="native-tab-icon">Aa</span><span data-ar="المفردات" data-en="Words" data-fr="Mots">المفردات</span></button>
    <button class="native-tab" type="button" data-native-target="listening"><span class="native-tab-icon">♫</span><span data-ar="الاستماع" data-en="Listen" data-fr="Écoute">الاستماع</span></button>
    <button class="native-tab" type="button" data-native-target="account"><span class="native-tab-icon">◉</span><span data-ar="حسابي" data-en="Account" data-fr="Compte">حسابي</span></button>
  </nav>
  <script>
    (function(){
      const bar=document.querySelector('.native-tabbar');if(!bar)return;
      const accountPanel=document.getElementById('panel-account');
      if(accountPanel&&!accountPanel.querySelector('.native-policy-links')){
        const links=document.createElement('div');links.className='native-policy-links';
        links.innerHTML='<a href="./privacy.html" data-ar="سياسة الخصوصية" data-en="Privacy policy" data-fr="Confidentialité">سياسة الخصوصية</a><span aria-hidden="true">·</span><a href="https://github.com/HusseinMishbak/-/issues" data-ar="الدعم" data-en="Support" data-fr="Assistance">الدعم</a>';
        accountPanel.appendChild(links);
      }
      function lang(){const v=(document.documentElement.dataset.uiLang||document.documentElement.lang||'ar').toLowerCase();return v.startsWith('fr')?'fr':v.startsWith('en')?'en':'ar'}
      function updateLabels(){const l=lang();bar.querySelectorAll('[data-ar]').forEach(el=>{el.textContent=el.dataset[l]||el.dataset.ar});document.querySelectorAll('.native-policy-links [data-ar]').forEach(el=>{el.textContent=el.dataset[l]||el.dataset.ar});bar.dir=l==='ar'?'rtl':'ltr';document.querySelectorAll('.native-policy-links').forEach(el=>el.dir=l==='ar'?'rtl':'ltr');}
      function syncActive(target){bar.querySelectorAll('.native-tab').forEach(b=>{if(b.dataset.nativeTarget===target)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')})}
      bar.addEventListener('click',e=>{const b=e.target.closest('[data-native-target]');if(!b)return;const target=b.dataset.nativeTarget;const nav=document.querySelector('#mobileNav .nav-item[data-target="'+target+'"]')||document.querySelector('#desktopNav .nav-item[data-target="'+target+'"]');if(nav){nav.click();syncActive(target)}});
      document.addEventListener('click',e=>{const nav=e.target.closest('.nav-item[data-target]');if(nav)syncActive(nav.dataset.target);const shortcut=e.target.closest('[data-home-target]');if(shortcut)syncActive(shortcut.dataset.homeTarget);});
      new MutationObserver(updateLabels).observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir','data-ui-lang']});updateLabels();
    })();
  </script>
</body>`);
}
await writeFile(resolve(out, 'index.html'), html);

// Fail the build early if an asset expected by index.html was omitted. This
// caught a previous gap where the mobile bundle lacked dashboard CSS/JS.
for (const file of [...requiredFiles, ...requiredStyles.map(name => 'ui/' + name)]) {
  const path = resolve(out, file);
  const { access } = await import('node:fs/promises');
  await access(path);
}
const i18n = await readFile(resolve(out, 'i18n.js'), 'utf8');
for (const file of requiredFiles.filter(name => name.endsWith('.js'))) {
  const isRuntimeLoaded = file === 'learning-experience.js' || file === 'curriculum-audit.js';
  const referenced = isRuntimeLoaded ? i18n.includes(file) : html.includes(file);
  if (!referenced) throw new Error(`Required script is not referenced by the app loader: ${file}`);
}
for (const file of requiredStyles) {
  if (!i18n.includes(file)) throw new Error(`Required UI style not referenced by the localization loader: ui/${file}`);
}
console.log(`Prepared ${requiredFiles.length} platform files and ${requiredStyles.length} UI styles in mobile-app/www`);
