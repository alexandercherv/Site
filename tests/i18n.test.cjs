const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { messages, normalizeLanguage, translate } = require('../i18n.js');
const html = readFileSync(path.join(__dirname, '../index.html'), 'utf8');

test('all landing text and attribute keys exist in both languages', () => {
    assert.deepEqual(Object.keys(messages.en).sort(), Object.keys(messages.uk).sort());
    const keys = Array.from(html.matchAll(/data-i18n(?:-[\w-]+)?="([^"]+)"/g), match => match[1]);
    assert.ok(keys.length > 100);
    for (const key of keys) {
        assert.ok(messages.uk[key], `Missing Ukrainian: ${key}`);
        assert.ok(messages.en[key], `Missing English: ${key}`);
    }
});

test('default language is Ukrainian and English copy contains no untranslated Ukrainian', () => {
    assert.equal(normalizeLanguage(null), 'uk');
    assert.equal(normalizeLanguage('fr'), 'uk');
    assert.equal(normalizeLanguage('en'), 'en');
    assert.equal(translate('en', 'nav.home'), 'Home');
    assert.equal(translate('uk', 'nav.home'), 'Головна');
    for (const [key, value] of Object.entries(messages.en)) assert.doesNotMatch(value, /[А-Яа-яІіЇїЄєҐґ]/, key);
});

test('Ukrainian fallback markup stays readable and business values remain unchanged', () => {
    for (const match of html.matchAll(/<(h[1-6]|p|span|a|label|option|button|div|title)([^>]*)>([^<>]+)<\/\1>/g)) {
        if (/[А-Яа-яІіЇїЄєҐґ]/.test(match[3])) assert.match(match[2], /data-i18n/, match[3].trim());
    }
    assert.match(html, /<html lang="uk">/);
    for (const value of ['7 200', '14 200', '28 800', 'schoolsmartgarden@gmail.com', 'https://formspree.io/f/mwpgvwdk']) assert.ok(html.includes(value));
    assert.equal(messages.en['packages.currency'], 'UAH');
    assert.equal(messages.en['packages.rate592'], '592 UAH/lesson');
});
