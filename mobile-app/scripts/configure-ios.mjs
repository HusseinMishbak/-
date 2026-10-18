import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const path = resolve(process.cwd(), 'ios/App/App/Info.plist');
let plist = await readFile(path, 'utf8');
const settings = {
  CFBundleDisplayName: 'أور الفرنسية',
  NSMicrophoneUsageDescription: 'يستخدم تطبيق أور الميكروفون لتسجيل إجاباتك الصوتية والتدرّب على نطق اللغة الفرنسية.',
  UIUserInterfaceStyle: 'Light'
};
for (const [key, value] of Object.entries(settings)) {
  const pattern = new RegExp('<key>' + key + '</key>\\s*<string>[\\s\\S]*?</string>');
  const entry = '<key>' + key + '</key>\n\t<string>' + value + '</string>';
  if (pattern.test(plist)) plist = plist.replace(pattern, entry);
  else {
    const closing = plist.lastIndexOf('</dict>');
    if (closing < 0) throw new Error('Info.plist does not contain a root dict closing tag');
    plist = plist.slice(0, closing) + '\t' + entry + '\n' + plist.slice(closing);
  }
}
await writeFile(path, plist);
console.log('Configured iOS display name, microphone permission text, and light appearance.');
