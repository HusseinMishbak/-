import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const assets = resolve(root, 'assets');
await mkdir(assets, { recursive: true });
const iconSvg = await readFile(resolve(root, 'www/app-icon.svg'));
const splashSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#25295b"/><stop offset="1" stop-color="#139a95"/></linearGradient></defs><rect width="2732" height="2732" fill="url(#g)"/><circle cx="1366" cy="1160" r="300" fill="none" stroke="#f3b54a" stroke-width="30"/><text x="1366" y="1260" text-anchor="middle" font-family="Arial,sans-serif" font-size="350" font-weight="700" fill="#fff">أ</text><text x="1366" y="1680" text-anchor="middle" font-family="Arial,sans-serif" font-size="118" font-weight="700" fill="#fff">ORR FRENCH</text><text x="1366" y="1795" text-anchor="middle" font-family="Arial,sans-serif" font-size="58" fill="#d8f0ec">منصة أور لتعلّم الفرنسية</text></svg>`);
await sharp(iconSvg).resize(1024, 1024).png().toFile(resolve(assets, 'icon.png'));
await sharp(splashSvg).png().toFile(resolve(assets, 'splash.png'));
console.log('Generated 1024px app icon and 2732px splash asset.');
