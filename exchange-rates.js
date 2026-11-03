(function (root) {
    const quotes = ['USD', 'EUR', 'RUB'];
    const endpoint = 'https://api.frankfurter.dev/v2/rates?base=UAH&quotes=USD,EUR,RUB';
    const cacheKey = 'sgs-exchange-rates-v1';
    const freshForMs = 6 * 60 * 60 * 1000;
    const keepForMs = 7 * 24 * 60 * 60 * 1000;
    const timeoutMs = 4000;

    function isRecent(timestamp, now, duration) {
        return Number.isFinite(timestamp) && timestamp <= now && now - timestamp < duration;
    }

    function isValid(entry, now) {
        return entry && Number.isFinite(entry.rate) && entry.rate > 0
            && isRecent(entry.observedAt, now, keepForMs)
            && isRecent(entry.fetchedAt, now, keepForMs);
    }

    function readCache() {
        try {
            const stored = JSON.parse(root.localStorage.getItem(cacheKey));
            const now = Date.now();
            return Object.fromEntries(quotes.filter(quote => isValid(stored?.[quote], now))
                .map(quote => [quote, stored[quote]]));
        } catch {
            return {};
        }
    }

    const cache = readCache();
    let pending;

    function cachedRates() {
        const now = Date.now();
        const rates = {};
        for (const quote of quotes) {
            if (isValid(cache[quote], now)) rates[quote] = cache[quote].rate;
        }
        return rates;
    }

    async function refresh() {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await root.fetch(endpoint, { signal: controller.signal });
            if (!response.ok) return;
            const rows = await response.json();
            if (!Array.isArray(rows)) return;

            const now = Date.now();
            let updated = false;
            for (const row of rows) {
                if (row?.base !== 'UAH' || !quotes.includes(row.quote)) continue;
                if (typeof row.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) continue;
                const entry = { rate: row.rate, observedAt: Date.parse(row.date), fetchedAt: now };
                if (!isValid(entry, now) || new Date(entry.observedAt).toISOString().slice(0, 10) !== row.date) continue;
                if (isValid(cache[row.quote], now) && entry.observedAt < cache[row.quote].observedAt) continue;
                cache[row.quote] = entry;
                updated = true;
            }

            if (updated) root.localStorage.setItem(cacheKey, JSON.stringify(cache));
        } catch {
            // The latest usable rates remain available in memory.
        } finally {
            clearTimeout(timeout);
        }
    }

    async function getRates() {
        const now = Date.now();
        const fresh = quotes.every(quote => isValid(cache[quote], now)
            && isRecent(cache[quote].fetchedAt, now, freshForMs));
        if (!fresh) {
            pending ??= refresh().finally(() => { pending = undefined; });
            await pending;
        }
        return cachedRates();
    }

    const api = { getRates, cachedRates };
    root.SGSExchangeRates = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
