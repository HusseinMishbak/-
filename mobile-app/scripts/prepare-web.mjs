import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), '..');
const out = resolve(process.cwd(), 'www');
const assets = [
  'index.html', 'favicon.svg', 'curriculum.js', 'pronunciation-lesson.js',
  'curriculum-review.js', 'speaking-assessment.js', 'conversation-podcast.js',
  'podcast-six-minutes.js', 'learning-games.js', 'i18n.js', 'assessment-controls.js'
];
await mkdir(out, { recursive: true });
for (const file of assets) await cp(resolve(root, file), resolve(out, file));
let html = await readFile(resolve(out, 'index.html'), 'utf8');
html = html.replace('</head>', '  <link rel="manifest" href="./manifest.webmanifest">\n  <meta name="apple-mobile-web-app-capable" content="yes">\n  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n  <meta name="apple-mobile-web-app-title" content="Orr French">\n  <link rel="apple-touch-icon" href="./app-icon.svg">\n</head>');
html = html.replace('</body>', '  <script>if("serviceWorker" in navigator && location.protocol.startsWith("http")){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}</script>\n</body>');
await writeFile(resolve(out, 'index.html'), html);
console.log(`Prepared ${assets.length} platform files in mobile-app/www`);
