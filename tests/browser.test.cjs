const assert = require('node:assert/strict');
const { mkdirSync, writeFileSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { test, before, after } = require('node:test');
const { chromium } = require(process.env.SGS_PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.SGS_WEBSITE_URL || 'http://127.0.0.1:3320';
const root = path.join(__dirname, '..');
const artifacts = path.join(root, 'qa');
let browser;
before(async () => { mkdirSync(artifacts, { recursive: true }); browser = await chromium.launch({ headless: true }); });
after(async () => { await browser?.close(); });

async function newPage(options = {}) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, ...options });
    // Test requests never reach the application delivery service.
    await page.route('https://formspree.io/**', route => route.abort());
    return page;
}

test('English translates the complete landing, metadata and form, persists, and preserves entered values', async () => {
    const page = await newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(baseURL);
    assert.equal(await page.locator('html').getAttribute('lang'), 'uk');
    await page.getByRole('button', { name: 'English', exact: true }).click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.match(await page.title(), /Cosmic Learning/);
    assert.match(await page.locator('meta[name="description"]').getAttribute('content'), /Online mental arithmetic/);
    assert.equal(await page.locator('meta[property="og:locale"]').getAttribute('content'), 'en_US');
    assert.doesNotMatch(await page.locator('body').innerText(), /[А-Яа-яІіЇїЄєҐґ]/);
    assert.equal(await page.getByPlaceholder('First and last name', { exact: true }).count(), 1);
    assert.equal(await page.locator('.price-amount').allTextContents().then(values => values.map(value => value.trim())).then(JSON.stringify), JSON.stringify(['7 200', '14 200', '28 800']));
    await page.locator('#name').fill('Test Student');
    await page.locator('#course').selectOption('speed-reading');
    await page.getByRole('button', { name: 'Українська', exact: true }).click();
    assert.equal(await page.locator('#name').inputValue(), 'Test Student');
    assert.equal(await page.locator('#course').inputValue(), 'speed-reading');
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.equal(await page.getByRole('button', { name: 'English', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(artifacts, 'english-desktop.png'), fullPage: true });
    await page.screenshot({ path: path.join(artifacts, 'english-desktop-hero.png'), fullPage: false });
    await page.close();
});

test('mobile and tablet menu opens once, works with keyboard, and closes after navigation', async () => {
    const page = await newPage({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
    await page.goto(baseURL);
    await page.getByRole('button', { name: 'English', exact: true }).click();
    for (const width of [320, 375, 768, 1024]) {
        await page.setViewportSize({ width, height: 812 });
        const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
        assert.ok(dimensions.scrollWidth <= dimensions.width, `Horizontal overflow at ${width}: ${JSON.stringify(dimensions)}`);
        const toggle = page.getByRole('button', { name: 'Open menu', exact: true });
        await toggle.focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'), 'true');
        assert.equal(await page.locator('#navigation-menu').isVisible(), true);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'), 'false');
        assert.equal(await toggle.evaluate(element => element === document.activeElement), true);
    }
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    await page.screenshot({ path: path.join(artifacts, 'english-mobile-menu.png'), fullPage: false });
    await page.locator('#navigation-menu').getByRole('link', { name: 'Contact', exact: true }).click();
    assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'), 'false');
    assert.match(page.url(), /#contact$/);
    const contactTop = await page.locator('#contact').evaluate(element => element.getBoundingClientRect().top);
    const headerBottom = await page.locator('.header').evaluate(element => element.getBoundingClientRect().bottom);
    assert.ok(contactTop >= headerBottom - 1, 'Contact heading is hidden by the fixed header');
    await page.screenshot({ path: path.join(artifacts, 'english-mobile-form.png'), fullPage: false });
    await page.close();
});

test('validation and delivery feedback translate; failures retain form values and never claim success', async () => {
    const page = await newPage({ reducedMotion: 'reduce' });
    let submissions = 0;
    await page.route('https://formspree.io/**', async route => {
        submissions++;
        await route.fulfill({ status: submissions === 1 ? 503 : 200, headers: { 'access-control-allow-origin': '*' }, json: submissions === 1 ? { error: 'Mock failure' } : { ok: true } });
    });
    await page.goto(baseURL);
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await page.getByRole('button', { name: 'Send application', exact: true }).click();
    assert.equal(await page.locator('#form-feedback li').count(), 4);
    assert.match(await page.getByRole('alert').innerText(), /Please enter a valid email address/);
    assert.equal(submissions, 0);
    await page.getByRole('button', { name: 'Українська', exact: true }).click();
    assert.match(await page.getByRole('alert').innerText(), /Оберіть курс/);
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await page.locator('#name').fill('Test Student');
    await page.locator('#email').fill('test@example.invalid');
    await page.locator('#course').selectOption('mental-arithmetic');
    await page.locator('#subscription').selectOption('trial-lesson');
    await page.getByRole('button', { name: 'Send application', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Your application could not be sent' }).waitFor();
    assert.equal(await page.locator('#name').inputValue(), 'Test Student');
    assert.equal(await page.locator('.success-message').count(), 0);
    assert.match(await page.getByRole('link', { name: 'Email us', exact: true }).getAttribute('href'), /^mailto:schoolsmartgarden@gmail.com/);
    assert.ok(page.url().startsWith(baseURL));
    await page.getByRole('button', { name: 'Send application', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Your application was sent successfully' }).waitFor();
    assert.equal(await page.locator('#name').inputValue(), '');
    assert.equal(submissions, 2);
    await page.close();
});

test('localization still works when browser storage is unavailable', async () => {
    const page = await newPage();
    await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage blocked', 'SecurityError'); } }));
    await page.goto(baseURL);
    await page.getByRole('button', { name: 'English', exact: true }).click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    await page.close();
});

test('idle decoration has no perpetual animations, blur or DOM churn; records original baseline', async () => {
    const metrics = async page => page.evaluate(() => ({
        infiniteAnimations: document.getAnimations().filter(animation => animation.effect?.getTiming().iterations === Infinity).length,
        backdropFilters: Array.from(document.querySelectorAll('*')).filter(element => getComputedStyle(element).backdropFilter !== 'none').length,
    }));
    const page = await newPage();
    await page.goto(baseURL);
    const current = await metrics(page);
    assert.deepEqual(current, { infiniteAnimations: 0, backdropFilters: 0 });
    await page.evaluate(() => {
        window.qaMutations = 0;
        new MutationObserver(records => { window.qaMutations += records.length; }).observe(document.body, { childList: true, subtree: true, attributes: true });
    });
    await page.clock.install();
    await page.clock.fastForward(6000);
    assert.equal(await page.evaluate(() => window.qaMutations), 0);
    await page.close();

    const baseline = await newPage();
    await baseline.addInitScript(() => { window.emailjs = { init() {} }; });
    for (const [file, contentType] of [['index.html', 'text/html'], ['script.js', 'text/javascript'], ['styles.css', 'text/css'], ['logo.svg', 'image/svg+xml']]) {
        const body = execFileSync('git', ['show', `HEAD:${file}`], { cwd: root });
        await baseline.route(`${baseURL}/baseline/${file}`, route => route.fulfill({ body, contentType }));
    }
    await baseline.goto(`${baseURL}/baseline/index.html`);
    const original = await metrics(baseline);
    assert.ok(original.infiniteAnimations > 0);
    assert.ok(original.backdropFilters > 0);
    writeFileSync(path.join(artifacts, 'rendering-metrics.json'), JSON.stringify({ original, current }, null, 2));
    console.log('Rendering baseline:', JSON.stringify({ original, current }));
    await baseline.close();
});
