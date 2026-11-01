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

test('Ukrainian fallback markup stays readable and fixed USD pricing is consistent', () => {
    for (const match of html.matchAll(/<(h[1-6]|p|span|a|label|option|button|div|title)([^>]*)>([^<>]+)<\/\1>/g)) {
        if (/[А-Яа-яІіЇїЄєҐґ]/.test(match[3]) && !match[2].includes('class="language-name"')) assert.match(match[2], /data-i18n/, match[3].trim());
    }
    assert.match(html, /<html lang="uk">/);
    for (const value of ['schoolsmartgarden@gmail.com', 'https://formspree.io/f/mwpgvwdk']) assert.ok(html.includes(value));
    const prices = Array.from(html.matchAll(/data-price="(\d+)" data-currency="USD" data-lessons="(\d+)"/g), match => [Number(match[1]), Number(match[2])]);
    assert.deepEqual(prices, [[160, 12], [310, 24], [600, 48]]);
    assert.deepEqual(Array.from(html.matchAll(/class="price-amount">(\d+)<\/span>/g), match => Number(match[1])), prices.map(([total]) => total));
    for (const language of languages) {
        assert.equal(messages[language]['packages.currency'], 'USD');
        for (const [total, lessons] of prices) {
            const rate = Number(messages[language][`packages.rate${lessons}`].match(/\d+[.,]\d{2}/)[0].replace(',', '.'));
            assert.equal(rate, Math.round(total / lessons * 100) / 100);
        }
        assert.ok(messages[language]['packages.saving24'].includes(String(160 * 2 - 310)));
        assert.ok(messages[language]['packages.saving48'].includes(String(160 * 4 - 600)));
        assert.doesNotMatch(Object.values(messages[language]).join(' '), /UAH|грн/);
    }
    assert.doesNotMatch(html, /data-price="(?:7200|14200|28800)"|selectSubscription\(\d+,/);
});

test('the custom language menu exposes native names and selection semantics', () => {
    assert.match(html, /aria-haspopup="menu" aria-expanded="false" aria-controls="language-menu"/);
    assert.match(html, /id="language-menu" role="menu"/);
    for (const language of languages) assert.match(html, new RegExp(`role="menuitemradio" data-language="${language}" lang="${language}"`));
    assert.doesNotMatch(html, /<select[^>]*(?:language|lang-select)/);
});


test('garden copy and decoration replace space references in every language', () => {
    const spaceCopy = /cosmi|cosmo|космі|косм|Weltraum|Kosmi|space-themed|space mission|out-of-this-world|🚀/i;
    for (const language of languages) assert.doesNotMatch(Object.values(messages[language]).join(' '), spaceCopy, language);
    assert.doesNotMatch(html, spaceCopy);
    assert.doesNotMatch(html, /class="[^"]*(?:planet|rocket|stars|character|brainy|smart-puma)/);
    assert.match(html, /<img class="garden-illustration garden-tree" src="images\/garden-tree\.svg" alt="" width="500" height="560" decoding="async" fetchpriority="high">/);
    assert.doesNotMatch(html, /images\/orchard-apple-tree[^" ]*\.webp/);
    assert.doesNotMatch(html, /garden-divider|images\/storybook-border\.webp/);
    assert.doesNotMatch(html, /<svg class="garden-illustration"/);
    assert.equal(Array.from(html.matchAll(/src="logo\.svg\?v=garden-2"/g)).length, 3);
    assert.doesNotMatch(html, /src="logo\.svg"/);
});
