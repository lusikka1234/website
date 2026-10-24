const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const source = readFileSync(`${__dirname}/../language.js`, 'utf8');
function detect({ languages = ['en-US'], query = '', saved, blocked = false } = {}) {
  const document = { documentElement: { lang: 'en' } };
  const localStorage = {
    getItem() { if (blocked) throw new Error('Storage blocked'); return saved; },
    setItem(key, value) { if (blocked) throw new Error('Storage blocked'); saved = value; },
  };
  vm.runInNewContext(source, {
    document, localStorage, navigator: { languages }, URL,
    window: { location: { href: `https://lusikka.art/gallery/paintings/${query}` } },
  });
  return { language: document.documentElement.lang, saved };
}

test('uses the first supported browser language, including regional variants', () => {
  assert.equal(detect({ languages: ['fi-FI', 'en-US'] }).language, 'fi');
  assert.equal(detect({ languages: ['en-GB', 'fi'] }).language, 'en');
  assert.equal(detect({ languages: ['sv-SE', 'fi-FI', 'en'] }).language, 'fi');
});
test('falls back to English when no browser language is supported', () => {
  assert.equal(detect({ languages: ['sv', 'de'] }).language, 'en');
  assert.equal(detect({ languages: [] }).language, 'en');
});
test('a saved selection overrides browser preference', () => {
  assert.equal(detect({ languages: ['fi'], saved: 'en' }).language, 'en');
  assert.equal(detect({ languages: ['en'], saved: 'fi' }).language, 'fi');
});
test('explicit links override saved preferences and persist the selection', () => {
  assert.deepEqual(detect({ query: '?lang=fi', saved: 'en' }), { language: 'fi', saved: 'fi' });
  assert.deepEqual(detect({ query: '?lang=en', saved: 'fi' }), { language: 'en', saved: 'en' });
});
test('invalid preferences are ignored', () => {
  assert.equal(detect({ query: '?lang=sv', saved: 'de', languages: ['fi'] }).language, 'fi');
});
test('language detection and explicit links work when storage is blocked', () => {
  assert.equal(detect({ languages: ['fi'], blocked: true }).language, 'fi');
  assert.equal(detect({ query: '?lang=fi', blocked: true }).language, 'fi');
});
