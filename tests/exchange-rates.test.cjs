const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { runInNewContext } = require('node:vm');

const source = readFileSync(path.join(__dirname, '../exchange-rates.js'), 'utf8');
const initialTime = Date.parse('2026-11-04T00:00:00Z');
const hour = 60 * 60 * 1000;
const rates = { USD: 0.025, EUR: 0.02, RUB: 2 };

function response(values = rates, date = '2026-11-04') {
    return {
        ok: true,
        json: async () => Object.entries(values).map(([quote, rate]) => ({ base: 'UAH', quote, rate, date })),
    };
}

function setup(fetch, storage = new Map(), overrides = {}) {
    let now = initialTime;
    const context = {
        AbortController, fetch, setTimeout, clearTimeout,
        Date: class extends Date { static now() { return now; } },
        localStorage: {
            getItem: key => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, value),
        },
        ...overrides,
    };
    runInNewContext(source, context);
    return { api: context.SGSExchangeRates, storage, advance: hours => { now += hours * hour; } };
}

test('fetches all target currencies once, then reuses and persists fresh rates', async () => {
    let calls = 0;
    const { api, storage } = setup(async url => {
        calls++;
        assert.equal(url, 'https://api.frankfurter.dev/v2/rates?base=UAH&quotes=USD,EUR,RUB');
        return response();
    });

    const results = await Promise.all([api.getRates(), api.getRates()]);
    results.forEach(result => assert.deepEqual({ ...result }, rates));
    assert.deepEqual({ ...await api.getRates() }, rates);
    assert.equal(calls, 1);

    const reloaded = setup(async () => { calls++; }, storage).api;
    assert.deepEqual({ ...reloaded.cachedRates() }, rates);
    assert.deepEqual({ ...await reloaded.getRates() }, rates);
    assert.equal(calls, 1);
});

test('merges valid partial responses and expires old observations during outages', async () => {
    let next = response();
    let calls = 0;
    const { api, advance } = setup(async () => { calls++; return next; });
    await api.getRates();

    advance(6);
    next = response({ USD: 0.026, EUR: '0.019', RUB: 0, GBP: 0.018 });
    assert.deepEqual({ ...await api.getRates() }, { ...rates, USD: 0.026 });
    assert.equal(calls, 2);

    advance(24);
    next = response({ EUR: 0.021 }, '2026-11-05');
    assert.deepEqual({ ...await api.getRates() }, { ...rates, USD: 0.026, EUR: 0.021 });

    advance(6 * 24);
    next = { ok: false };
    assert.deepEqual({ ...api.cachedRates() }, { EUR: 0.021 });
    assert.deepEqual({ ...await api.getRates() }, { EUR: 0.021 });

    advance(24);
    assert.deepEqual({ ...await api.getRates() }, {});
});

test('rejects malformed rows and continues with unavailable storage', async () => {
    const localStorage = {
        getItem() { throw new Error('storage blocked'); },
        setItem() { throw new Error('storage blocked'); },
    };
    const valid = (await response({ USD: 0.025 }).json())[0];
    const { api } = setup(async () => ({
        ok: true,
        json: async () => [
            valid,
            { ...valid, quote: 'EUR', base: 'GBP' },
            { ...valid, quote: 'RUB', date: '2026-10-01' },
            { ...valid, quote: 'USD', rate: Infinity },
            null,
        ],
    }), undefined, { localStorage });
    assert.deepEqual({ ...await api.getRates() }, { USD: 0.025 });
    assert.deepEqual({ ...api.cachedRates() }, { USD: 0.025 });
});

test('aborts timed-out requests and can retry after a timeout', async () => {
    let stalled = true;
    const { api } = setup(async (url, { signal }) => {
        if (!stalled) return response();
        return new Promise((resolve, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason), { once: true });
        });
    }, undefined, {
        setTimeout(callback, delay) {
            assert.equal(delay, 4000);
            return setTimeout(callback, 0);
        },
    });
    assert.deepEqual({ ...await api.getRates() }, {});
    stalled = false;
    assert.deepEqual({ ...await api.getRates() }, rates);
});
