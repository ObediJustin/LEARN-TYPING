import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { WORDS, TEXT } from '../dist/js/data.js';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('dist/index.html', root), 'utf8');
const hosting = JSON.parse(await readFile(new URL('.openai/hosting.json', root), 'utf8'));

assert.match(html, /<title>LEARN_TYPING/);
assert.match(html, /id="gameCanvas"/);
assert.equal(hosting.static.directory, 'dist');
assert.ok(hosting.project_id.startsWith('appgprj_'));

for (const asset of ['dist/styles.css','dist/favicon.svg','dist/js/main.js','dist/js/game.js','dist/js/data.js','dist/js/services.js']) {
  await access(new URL(asset, root));
}

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'HTML ids must be unique');

const translationKeys = new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map(match => match[1]));
for (const language of ['fr','en']) {
  for (const key of translationKeys) assert.ok(TEXT[language][key], `${language}.${key} is missing`);
  for (const category of ['short','medium','long','advanced']) {
    const words = WORDS[language][category];
    assert.ok(words.length >= 12, `${language}.${category} needs at least 12 words`);
    assert.ok(words.every(word => typeof word === 'string' && word.trim() === word && word.length >= 3));
  }
}

assert.deepEqual(Object.keys(TEXT.fr).sort(), Object.keys(TEXT.en).sort(), 'Translation catalogs must stay aligned');
assert.ok(WORDS.fr.short.some(word => /[^\x00-\x7F]/.test(word)), 'French words should exercise accented input');

console.log(`Validated ${ids.length} UI ids, ${translationKeys.size} translated labels and ${Object.values(WORDS.fr).flat().length + Object.values(WORDS.en).flat().length} curated words.`);
