const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { languages, messages, normalizeLanguage, translate } = require('../i18n.js');
const html = readFileSync(path.join(__dirname, '../index.html'), 'utf8');

test('all landing text and attribute keys exist in all four languages', () => {
    assert.deepEqual(languages, ['uk', 'en', 'de', 'ru']);
    const keys = Array.from(html.matchAll(/data-i18n(?:-[\w-]+)?="([^"]+)"/g), match => match[1]);
    assert.ok(keys.length > 100);
    for (const language of languages) {
        assert.deepEqual(Object.keys(messages[language]).sort(), Object.keys(messages.uk).sort());
        for (const [key, value] of Object.entries(messages[language])) assert.ok(typeof value === 'string' && value.trim(), `Missing ${language}: ${key}`);
        for (const key of keys) assert.ok(messages[language][key], `Missing ${language}: ${key}`);
    }
});

test('Ukrainian is the default; each supported language has its own complete copy', () => {
    assert.equal(normalizeLanguage(null), 'uk');
    assert.equal(normalizeLanguage('fr'), 'uk');
    for (const language of languages) assert.equal(normalizeLanguage(language), language);
    assert.equal(translate('en', 'nav.home'), 'Home');
    assert.equal(translate('uk', 'nav.home'), 'Головна');
    assert.equal(translate('de', 'nav.home'), 'Startseite');
    assert.equal(translate('ru', 'nav.home'), 'Главная');
    for (const language of ['en', 'de']) {
        for (const [key, value] of Object.entries(messages[language])) assert.doesNotMatch(value, /[А-Яа-яІіЇїЄєҐґ]/, `${language}: ${key}`);
    }
    for (const [key, value] of Object.entries(messages.ru)) assert.doesNotMatch(value, /[ІіЇїЄєҐґ]/, key);
});

test('Ukrainian fallback markup stays readable and business values remain unchanged', () => {
    for (const match of html.matchAll(/<(h[1-6]|p|span|a|label|option|button|div|title)([^>]*)>([^<>]+)<\/\1>/g)) {
        if (/[А-Яа-яІіЇїЄєҐґ]/.test(match[3]) && !match[2].includes('class="language-name"')) assert.match(match[2], /data-i18n/, match[3].trim());
    }
    assert.match(html, /<html lang="uk">/);
    for (const value of ['7 200', '14 200', '28 800', 'schoolsmartgarden@gmail.com', 'https://formspree.io/f/mwpgvwdk']) assert.ok(html.includes(value));
    assert.equal(messages.en['packages.currency'], 'UAH');
    assert.equal(messages.en['packages.rate592'], '592 UAH/lesson');
    assert.equal(messages.de['packages.currency'], 'UAH');
    assert.equal(messages.ru['packages.rate592'], '592 грн/занятие');
});

test('the custom language menu exposes native names and selection semantics', () => {
    assert.match(html, /aria-haspopup="menu" aria-expanded="false" aria-controls="language-menu"/);
    assert.match(html, /id="language-menu" role="menu"/);
    for (const language of languages) assert.match(html, new RegExp(`role="menuitemradio" data-language="${language}" lang="${language}"`));
    assert.doesNotMatch(html, /<select[^>]*(?:language|lang-select)/);
});
