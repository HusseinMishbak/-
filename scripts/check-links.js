#!/usr/bin/env node
/**
 * Check external HTTP(S) links referenced by the platform files.
 * Usage: node scripts/check-links.js
 * This script reports failures only; it never changes source files or URLs.
 * Requires Node.js 18+ (built-in fetch).
 */
const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sourceFiles = ['index.html', 'curriculum.js', 'speaking-assessment.js'];
const timeoutMs = 12000;

function extractUrls(text) {
  const found = new Set();
  const pattern = /https?:\/\/[^\s"'<>`\\]+/gi;
  for (const match of text.matchAll(pattern)) {
    const url = match[0].replace(/[),.;!?}\]]+$/, '');
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') found.add(parsed.href);
    } catch {
      // Ignore malformed strings; valid external links are checked below.
    }
  }
  return found;
}

async function checkUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'OurFrenchPlatform-LinkChecker/1.0' }
    });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'user-agent': 'OurFrenchPlatform-LinkChecker/1.0', range: 'bytes=0-0' }
      });
    }
    if (!response.ok) {
      return { url, ok: false, status: response.status, reason: response.statusText || 'HTTP error' };
    }
    return { url, ok: true, status: response.status };
  } catch (error) {
    return { url, ok: false, status: null, reason: error.name === 'AbortError' ? 'timeout' : error.message };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const urls = new Set();
  for (const file of sourceFiles) {
    try {
      const text = await fs.readFile(path.join(root, file), 'utf8');
      for (const url of extractUrls(text)) urls.add(url);
    } catch (error) {
      console.error('Could not read ' + file + ': ' + error.message);
      process.exitCode = 2;
      return;
    }
  }

  console.log('Checking ' + urls.size + ' unique external links...');
  const results = await Promise.all([...urls].map(checkUrl));
  const broken = results.filter(result => !result.ok);

  if (broken.length === 0) {
    console.log('No broken external links detected.');
    return;
  }

  console.log('\nBroken or unreachable external links (' + broken.length + '):');
  for (const result of broken) {
    const status = result.status === null ? 'NETWORK' : 'HTTP ' + result.status;
    console.log('- [' + status + '] ' + result.url + ' — ' + result.reason);
  }
  console.log('\nNo source URLs were changed.');
  process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 2;
});
