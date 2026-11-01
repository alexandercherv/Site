const assert = require('node:assert/strict');
const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const { test, before, after } = require('node:test');
const { languages, messages } = require('../i18n.js');
const { chromium } = require(process.env.SGS_PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.SGS_WEBSITE_URL || 'http://127.0.0.1:3320';
const artifacts = path.join(__dirname, '../qa');
let browser;
before(async () => { mkdirSync(artifacts, { recursive: true }); browser = await chromium.launch({ headless: true }); });
after(async () => { await browser?.close(); });

async function newPage(options = {}) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, ...options });
    // Test requests never reach the application delivery service.
    await page.route('https://formspree.io/**', route => route.abort());
    return page;
}

async function selectLanguage(page, language) {
    await page.locator('.language-toggle').click();
    await page.locator(`[data-language="${language}"]`).click();
}

for (const language of languages) {
    test(`${language}: complete landing, metadata, form state and persisted preference`, async () => {
        const page = await newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(baseURL);
        assert.equal(await page.locator('html').getAttribute('lang'), 'uk');
        await page.locator('#name').fill('Test Student');
        await page.locator('#email').fill('test@example.invalid');
        await page.locator('#message').fill('Keep this message');
        await page.locator('#course').selectOption('speed-reading');
        await page.locator('#subscription').selectOption('24-lessons');
        await selectLanguage(page, language);
        assert.equal(await page.locator('html').getAttribute('lang'), language);
        assert.equal(await page.title(), messages[language]['meta.title']);
        assert.equal(await page.locator('meta[name="description"]').getAttribute('content'), messages[language]['meta.description']);
        assert.equal(await page.locator('meta[property="og:title"]').getAttribute('content'), messages[language]['meta.title']);
        assert.equal(await page.locator('meta[property="og:description"]').getAttribute('content'), messages[language]['meta.description']);
        assert.equal(await page.locator('meta[property="og:locale"]').getAttribute('content'), { uk: 'uk_UA', en: 'en_US', de: 'de_DE', ru: 'ru_RU' }[language]);
        const mismatches = await page.evaluate(expected => {
            const errors = [];
            document.querySelectorAll('[data-i18n]').forEach(element => {
                if (element.textContent !== expected[element.dataset.i18n]) errors.push(element.dataset.i18n);
            });
            for (const attribute of ['placeholder', 'aria-label', 'alt', 'content', 'value']) {
                document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(element => {
                    const key = element.getAttribute(`data-i18n-${attribute}`);
                    if (element.getAttribute(attribute) !== expected[key]) errors.push(key);
                });
            }
            return errors;
        }, messages[language]);
        assert.deepEqual(mismatches, []);
        assert.equal(await page.locator('#name').inputValue(), 'Test Student');
        assert.equal(await page.locator('#email').inputValue(), 'test@example.invalid');
        assert.equal(await page.locator('#message').inputValue(), 'Keep this message');
        assert.equal(await page.locator('#course').inputValue(), 'speed-reading');
        assert.equal(await page.locator('#subscription').inputValue(), '24-lessons');
        assert.deepEqual((await page.locator('.price-amount').allTextContents()).map(value => value.trim()), ['160', '310', '600']);
        assert.deepEqual((await page.locator('.price-currency').allTextContents()).map(value => value.trim()), ['USD', 'USD', 'USD']);
        assert.deepEqual(await page.locator('.price-per-lesson').allTextContents(), [12, 24, 48].map(lessons => messages[language][`packages.rate${lessons}`]));
        assert.deepEqual(await page.locator('.subscription-save').allTextContents(), [24, 48].map(lessons => messages[language][`packages.saving${lessons}`]));
        assert.equal(await page.locator('.language-toggle').evaluate(element => element === document.activeElement), true);
        await page.reload();
        assert.equal(await page.locator('html').getAttribute('lang'), language);
        assert.equal(await page.locator(`[data-language="${language}"]`).getAttribute('aria-checked'), 'true');
        assert.equal(await page.locator('.language-current').innerText(), language.toUpperCase());
        assert.deepEqual(errors, []);
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.screenshot({ path: path.join(artifacts, `${language}-desktop.png`), fullPage: true });
        await page.screenshot({ path: path.join(artifacts, `${language}-desktop-hero.png`) });
        await page.close();
    });
}

test('language dropdown supports keyboard selection, focus return, outside click and Tab', async () => {
    const page = await newPage();
    await page.goto(baseURL);
    const toggle = page.locator('.language-toggle');
    const focusedLanguage = () => page.evaluate(() => document.activeElement.dataset.language);
    await toggle.focus();
    await page.keyboard.press('ArrowDown');
    assert.equal(await focusedLanguage(), 'uk');
    await page.keyboard.press('ArrowDown');
    assert.equal(await focusedLanguage(), 'en');
    await page.keyboard.press('End');
    assert.equal(await focusedLanguage(), 'ru');
    await page.keyboard.press('Home');
    assert.equal(await focusedLanguage(), 'uk');
    await page.keyboard.press('ArrowUp');
    assert.equal(await focusedLanguage(), 'ru');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('html').getAttribute('lang'), 'ru');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(await toggle.evaluate(element => element === document.activeElement), true);
    await page.keyboard.press('Space');
    assert.equal(await focusedLanguage(), 'ru');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Space');
    assert.equal(await page.locator('html').getAttribute('lang'), 'de');
    await page.keyboard.press('ArrowUp');
    assert.equal(await focusedLanguage(), 'ru');
    await page.keyboard.press('Escape');
    assert.equal(await toggle.evaluate(element => element === document.activeElement), true);
    assert.equal(await page.locator('#language-menu').isVisible(), false);
    await toggle.click();
    await page.locator('h1').click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    await toggle.click();
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#language-menu').isVisible(), false);
    assert.equal(await toggle.evaluate(element => element === document.activeElement), false);
    await toggle.click();
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.locator('#language-menu').isVisible(), false);
    await page.close();
});

test('all languages fit mobile, tablet and desktop; navigation and language menus work together', async () => {
    const page = await newPage({ reducedMotion: 'reduce' });
    await page.goto(baseURL);
    for (const language of languages) {
        await selectLanguage(page, language);
        for (const width of [320, 375, 768, 1024, 1180, 1440]) {
            await page.setViewportSize({ width, height: 812 });
            const toggle = page.locator('.language-toggle');
            await toggle.click();
            const rects = await page.evaluate(() => {
                const width = document.documentElement.clientWidth;
                const menu = document.getElementById('language-menu').getBoundingClientRect();
                const nav = document.querySelector('.nav-actions').getBoundingClientRect();
                const links = document.querySelector('.nav-menu').getBoundingClientRect();
                const logo = document.querySelector('.header .logo').getBoundingClientRect();
                return { width, scrollWidth: document.documentElement.scrollWidth, left: menu.left, right: menu.right, navLeft: nav.left, logoRight: logo.right, linksLeft: links.left, linksRight: links.right };
            });
            assert.ok(rects.scrollWidth <= rects.width, `${language} horizontal overflow at ${width}: ${JSON.stringify(rects)}`);
            assert.ok(rects.left >= 0 && rects.right <= rects.width, `${language} dropdown clipped at ${width}`);
            assert.ok(rects.logoRight <= rects.navLeft, `${language} header controls overlap at ${width}`);
            await page.keyboard.press('Escape');
            if (width > 1100) {
                assert.ok(rects.logoRight <= rects.linksLeft && rects.linksRight <= rects.navLeft, `${language} navigation overlaps at ${width}: ${JSON.stringify(rects)}`);
                continue;
            }
            const navToggle = page.locator('.nav-toggle');
            await navToggle.focus();
            await page.keyboard.press('Enter');
            assert.equal(await navToggle.getAttribute('aria-expanded'), 'true');
            assert.equal(await page.locator('#navigation-menu').isVisible(), true);
            await page.keyboard.press('Escape');
            assert.equal(await navToggle.getAttribute('aria-expanded'), 'false');
            assert.equal(await navToggle.evaluate(element => element === document.activeElement), true);
            await navToggle.click();
            await toggle.click();
            assert.equal(await navToggle.getAttribute('aria-expanded'), 'false');
            assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
            if (width === 375) await page.screenshot({ path: path.join(artifacts, `${language}-mobile-language-menu.png`) });
            await navToggle.click();
            assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
            await page.locator('#navigation-menu a[href="#contact"]').click();
            assert.equal(await navToggle.getAttribute('aria-expanded'), 'false');
            assert.match(page.url(), /#contact$/);
            const contactTop = await page.locator('#contact').evaluate(element => element.getBoundingClientRect().top);
            const headerBottom = await page.locator('.header').evaluate(element => element.getBoundingClientRect().bottom);
            assert.ok(contactTop >= headerBottom - 1, 'Contact heading is hidden by the fixed header');
        }
    }
    await page.close();
});

for (const language of languages) {
    test(`${language}: validation, sending, failure/retry and success feedback`, async () => {
        const page = await newPage({ reducedMotion: 'reduce' });
        let submissions = 0;
        let notifyRequest;
        const nextRequest = () => new Promise(resolve => { notifyRequest = resolve; });
        await page.route('https://formspree.io/**', async route => {
            submissions++;
            await new Promise(resolve => { notifyRequest(resolve); });
            await route.fulfill({ status: submissions === 1 ? 503 : 200, headers: { 'access-control-allow-origin': '*' }, json: submissions === 1 ? { error: 'Mock failure' } : { ok: true } });
        });
        await page.goto(baseURL);
        await selectLanguage(page, language);
        await page.locator('.submit-button').click();
        assert.equal(await page.locator('#form-feedback li').count(), 4);
        assert.ok((await page.getByRole('alert').innerText()).includes(messages[language]['form.errorEmail']));
        assert.equal(submissions, 0);
        const nextLanguage = languages[(languages.indexOf(language) + 1) % languages.length];
        await selectLanguage(page, nextLanguage);
        assert.ok((await page.getByRole('alert').innerText()).includes(messages[nextLanguage]['form.errorCourse']));
        await selectLanguage(page, language);
        await page.locator('#name').fill('Test Student');
        await page.locator('#email').fill('test@example.invalid');
        await page.locator('#course').selectOption('mental-arithmetic');
        await page.locator('#subscription').selectOption('trial-lesson');
        let request = nextRequest();
        await page.locator('.submit-button').click();
        let releaseRequest = await request;
        await page.waitForFunction(() => document.querySelector('.submit-button').disabled);
        assert.equal(await page.locator('.submit-button span').innerText(), messages[language]['form.sending']);
        // Switching during an in-flight request retains values and updates the busy label.
        await selectLanguage(page, nextLanguage);
        assert.equal(await page.locator('.submit-button span').innerText(), messages[nextLanguage]['form.sending']);
        await selectLanguage(page, language);
        releaseRequest();
        await page.getByRole('alert').filter({ hasText: messages[language]['form.failure'] }).waitFor();
        assert.equal(await page.locator('#name').inputValue(), 'Test Student');
        assert.equal(await page.locator('.success-message').count(), 0);
        assert.match(await page.getByRole('link', { name: messages[language]['form.emailUs'], exact: true }).getAttribute('href'), /^mailto:schoolsmartgarden@gmail.com/);
        await selectLanguage(page, nextLanguage);
        const emailHref = await page.getByRole('link', { name: messages[nextLanguage]['form.emailUs'], exact: true }).getAttribute('href');
        assert.ok(decodeURIComponent(emailHref).includes(messages[nextLanguage]['form.subject']));
        assert.ok(decodeURIComponent(emailHref).includes(messages[nextLanguage]['courses.mental']));
        await selectLanguage(page, language);
        assert.ok(page.url().startsWith(baseURL));
        request = nextRequest();
        await page.locator('.submit-button').click();
        releaseRequest = await request;
        await page.waitForFunction(() => document.querySelector('.submit-button').disabled);
        releaseRequest();
        await page.getByRole('status').filter({ hasText: messages[language]['form.success'] }).waitFor();
        assert.equal(await page.locator('#name').inputValue(), '');
        assert.equal(submissions, 2);
        await page.close();
    });
}

test('localization still works when browser storage is unavailable', async () => {
    const page = await newPage();
    await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage blocked', 'SecurityError'); } }));
    await page.goto(baseURL);
    for (const language of languages) {
        await selectLanguage(page, language);
        assert.equal(await page.locator('html').getAttribute('lang'), language);
    }
    await page.close();
});

test('garden palette, paper cards and storybook illustration render across the landing page', async () => {
    const page = await newPage();
    await page.goto(baseURL);
    const theme = await page.evaluate(() => {
        const style = element => getComputedStyle(element);
        return {
            canvas: style(document.body).backgroundColor,
            text: style(document.body).color,
            header: style(document.querySelector('.header')).backgroundColor,
            button: style(document.querySelector('.cta-button')).backgroundColor,
            paper: style(document.querySelector('.course-card')).backgroundColor,
            roundedHeading: style(document.querySelector('h1')).fontFamily,
            cardCorners: parseFloat(style(document.querySelector('.course-card')).borderTopLeftRadius),
            illustration: document.querySelector('.garden-illustration').getBoundingClientRect().width,
            legacyDecoration: document.querySelectorAll('.planet, .rocket, .stars, .floating-characters').length,
            gradientBackgrounds: Array.from(document.querySelectorAll('*')).filter(element => style(element).backgroundImage.includes('gradient')).length,
        };
    });
    assert.equal(theme.canvas, 'rgb(248, 244, 233)');
    assert.equal(theme.text, 'rgb(36, 59, 50)');
    assert.equal(theme.header, 'rgb(245, 246, 241)');
    assert.equal(theme.button, 'rgb(66, 101, 84)');
    assert.equal(theme.paper, 'rgb(251, 245, 232)');
    assert.match(theme.roundedHeading, /ui-rounded|Trebuchet/);
    assert.ok(theme.cardCorners >= 24);
    assert.ok(theme.illustration > 250);
    assert.equal(theme.legacyDecoration, 0);
    assert.equal(theme.gradientBackgrounds, 0);
    await page.close();
});

test('storybook artwork loads with reserved dimensions and stays clear of text at every viewport', async () => {
    const page = await newPage({ reducedMotion: 'reduce' });
    await page.goto(baseURL);
    for (const language of languages) {
        await selectLanguage(page, language);
        for (const width of [320, 375, 768, 1024, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            const pictures = page.locator('.garden-illustration, .garden-divider img');
            for (const picture of await pictures.all()) {
                await picture.scrollIntoViewIfNeeded();
                await picture.evaluate(image => image.decode());
            }
            const layout = await page.evaluate(() => {
                const overlaps = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
                const copy = Array.from(document.querySelectorAll('h1, h2, h3, p, .hero-stats, button, input, select, textarea'))
                    .filter(element => element.getBoundingClientRect().height > 0)
                    .map(element => element.getBoundingClientRect());
                return {
                    overflow: document.documentElement.scrollWidth > window.innerWidth,
                    pictures: Array.from(document.querySelectorAll('.garden-illustration, .garden-divider img')).map(image => ({
                        loaded: image.complete && image.naturalWidth > 0,
                        dimensions: Math.abs(Number(image.getAttribute('width')) / Number(image.getAttribute('height')) - image.naturalWidth / image.naturalHeight) < .001,
                        emptyAlt: image.alt === '' && Boolean(image.closest('[aria-hidden="true"]')),
                        overlapsCopy: copy.some(rect => overlaps(image.getBoundingClientRect(), rect)),
                    })),
                };
            });
            assert.equal(layout.overflow, false, `${language} ${width}px: no horizontal overflow`);
            assert.equal(layout.pictures.length, 3);
            assert.ok(layout.pictures.every(image => image.loaded && image.dimensions && image.emptyAlt), `${language} ${width}px: images load with correct dimensions and decorative semantics`);
            assert.ok(layout.pictures.every(image => !image.overlapsCopy), `${language} ${width}px: artwork has its own space`);
            if (language === 'uk' && [375, 1440].includes(width)) {
                await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
                await page.screenshot({ path: path.join(artifacts, `storybook-${width}.png`), fullPage: true });
            }
        }
    }
    await page.close();
});

test('idle decoration and language menu have no perpetual animations, blur or DOM churn', async () => {
    const page = await newPage();
    await page.goto(baseURL);
    const metrics = () => page.evaluate(() => ({
        infiniteAnimations: document.getAnimations().filter(animation => animation.effect?.getTiming().iterations === Infinity).length,
        backdropFilters: Array.from(document.querySelectorAll('*')).filter(element => getComputedStyle(element).backdropFilter !== 'none').length,
    }));
    assert.deepEqual(await metrics(), { infiniteAnimations: 0, backdropFilters: 0 });
    await page.locator('.language-toggle').click();
    const current = await metrics();
    assert.deepEqual(current, { infiniteAnimations: 0, backdropFilters: 0 });
    await page.evaluate(() => {
        window.qaMutations = 0;
        new MutationObserver(records => { window.qaMutations += records.length; }).observe(document.body, { childList: true, subtree: true, attributes: true });
    });
    await page.clock.install();
    await page.clock.fastForward(6000);
    assert.equal(await page.evaluate(() => window.qaMutations), 0);
    writeFileSync(path.join(artifacts, 'rendering-metrics.json'), JSON.stringify(current, null, 2));
    await page.close();
});

async function settleCards(cards) {
    await cards.evaluateAll(elements => Promise.all(elements.flatMap(element => element.getAnimations().map(animation => animation.finished))));
}

async function cardScales(cards) {
    return cards.evaluateAll(elements => elements.map(element => {
        const transform = getComputedStyle(element).transform;
        return transform === 'none' ? 1 : new DOMMatrixReadOnly(transform).a;
    }));
}

test('subscription cards enlarge on hover and keyboard focus without moving their layout', async () => {
    const page = await newPage();
    await page.goto(baseURL);
    const cards = page.locator('.subscription-card');
    await cards.first().scrollIntoViewIfNeeded();
    const layout = () => cards.evaluateAll(elements => elements.map(element => ({ x: element.offsetLeft, y: element.offsetTop, width: element.offsetWidth, height: element.offsetHeight })));
    const original = await layout();
    const baseline = [1, 1.05, 1];
    assert.deepEqual(await cardScales(cards), baseline);
    for (let index = 0; index < 3; index++) {
        await cards.nth(index).hover();
        await settleCards(cards);
        assert.deepEqual(await cardScales(cards), baseline.map((scale, item) => item === index ? index === 1 ? 1.08 : 1.05 : scale));
        assert.deepEqual(await layout(), original);
    }
    await page.mouse.move(0, 0);
    await settleCards(cards);
    const bounds = await cards.first().boundingBox();
    await page.mouse.move(bounds.x + 1, bounds.y + bounds.height / 2);
    await settleCards(cards);
    assert.equal(await cards.first().evaluate(element => element.matches(':hover')), true);
    assert.equal((await cardScales(cards))[0], 1.05);
    await page.screenshot({ path: path.join(artifacts, 'subscriptions-usd-hover.png') });
    await page.mouse.move(0, 0);
    for (let index = 0; index < 3; index++) {
        await cards.nth(index).locator('.subscription-button').focus();
        await settleCards(cards);
        assert.equal((await cardScales(cards))[index], index === 1 ? 1.08 : 1.05);
        assert.deepEqual(await layout(), original);
        await cards.nth(index).locator('.subscription-button').press('Enter');
        assert.equal(await page.locator('#subscription').inputValue(), `${[12, 24, 48][index]}-lessons`);
        assert.equal(await page.locator('#subscription').evaluate(element => element === document.activeElement), true);
    }
    await page.close();
});

test('subscription growth respects touch viewports and reduced motion', async () => {
    const mobile = await newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
    await mobile.goto(baseURL);
    const cards = mobile.locator('.subscription-card');
    await cards.first().tap({ position: { x: 24, y: 24 } });
    await settleCards(cards);
    assert.deepEqual(await cardScales(cards), [1, 1, 1]);
    assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await mobile.close();
    const reduced = await newPage({ reducedMotion: 'reduce' });
    await reduced.goto(baseURL);
    const reducedCards = reduced.locator('.subscription-card');
    await reducedCards.first().hover();
    await reducedCards.last().locator('.subscription-button').focus();
    assert.deepEqual(await cardScales(reducedCards), [1, 1.05, 1]);
    assert.ok((await reducedCards.evaluateAll(elements => elements.map(element => getComputedStyle(element).transitionDuration))).every(duration => duration === '0s'));
    await reduced.close();
});

test('corner ribbons fit every language and stay clear of package headings', async () => {
    const page = await newPage();
    await page.goto(baseURL);
    for (const language of languages) {
        await selectLanguage(page, language);
        for (const width of [320, 375, 768, 1024, 1440]) {
            await page.setViewportSize({ width, height: 1000 });
            const cards = await page.locator('.subscription-card').evaluateAll(elements => elements.map(card => {
                const badge = card.querySelector('.subscription-badge');
                const label = badge.querySelector('.subscription-badge-label');
                const range = document.createRange();
                range.selectNodeContents(label);
                const text = range.getBoundingClientRect();
                const clip = badge.getBoundingClientRect();
                const heading = card.querySelector('h3').getBoundingClientRect();
                return {
                    textFits: text.left >= clip.left - .5 && text.right <= clip.right + .5 && text.top >= clip.top - .5 && text.bottom <= clip.bottom + .5,
                    clearsHeading: text.bottom + 4 <= heading.top,
                    ribbonWidth: getComputedStyle(label).width,
                    transform: getComputedStyle(label).transform,
                    priceTop: card.querySelector('.subscription-price').offsetTop,
                    buttonTop: card.querySelector('.subscription-button').offsetTop,
                };
            }));
            assert.ok(cards.every(card => card.textFits), `${language} ${width}px: ribbon text must not be clipped`);
            assert.ok(cards.every(card => card.clearsHeading), `${language} ${width}px: ribbon must not cover a heading`);
            assert.equal(new Set(cards.map(card => card.ribbonWidth)).size, 1);
            assert.equal(new Set(cards.map(card => card.transform)).size, 1);
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
            if (width === 1440) {
                assert.equal(new Set(cards.map(card => card.priceTop)).size, 1, `${language}: prices align`);
                assert.equal(new Set(cards.map(card => card.buttonTop)).size, 1, `${language}: buttons align`);
            }
            if ((language === 'uk' && width === 1440) || (language === 'de' && width === 375)) {
                await page.evaluate(() => document.getElementById('subscriptions').scrollIntoView({ block: 'start', behavior: 'instant' }));
                await page.screenshot({ path: path.join(artifacts, `ribbons-${language}-${width}.png`) });
            }
        }
    }
    await page.close();
});

test('Ukrainian text and attributes match the canonical copy without JavaScript', async () => {
    const page = await newPage({ javaScriptEnabled: false });
    await page.goto(baseURL);
    const mismatches = await page.evaluate(expected => {
        const mismatches = [];
        document.querySelectorAll('[data-i18n]').forEach(element => {
            if (element.textContent !== expected[element.dataset.i18n]) mismatches.push(element.dataset.i18n);
        });
        for (const attribute of ['placeholder', 'aria-label', 'alt', 'content', 'value']) {
            document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(element => {
                const key = element.getAttribute(`data-i18n-${attribute}`);
                if (element.getAttribute(attribute) !== expected[key]) mismatches.push(key);
            });
        }
        return mismatches;
    }, messages.uk);
    assert.deepEqual(mismatches, []);
    await page.close();
});
