# Local verification

This is a buildless GitHub Pages site. No production build or publishing step is needed for local review.

```sh
node --test tests/i18n.test.cjs
node --check script.js
node --check i18n.js
python3 -m http.server 3320 --bind 127.0.0.1
```

With Playwright and its Chromium browser available, run the browser regressions in another terminal:

```sh
node --test tests/browser.test.cjs
```

If Playwright lives in another local checkout, pass its module explicitly:

```sh
SGS_PLAYWRIGHT_MODULE=/absolute/path/to/node_modules/playwright/index.js node --test tests/browser.test.cjs
```

All application requests are intercepted and mocked. The tests never submit applications or send email. They cover all four languages, persisted preference, unavailable storage, the language dropdown's keyboard and focus behavior, 320–1440px navigation, validation, failure/retry behavior, the saturated garden palette and distinct section/card colors, loaded artwork with correct intrinsic dimensions, hero copy/art separation and compact mobile scenes, all twelve decorative garden icons, the pricing tree medallion and responsive root connections, equal package dimensions and uniform hover/focus growth, touch/reduced-motion behavior and ribbon geometry, and static idle rendering. Screenshots and rendering metrics are written to ignored `qa/`.

Language preference uses `localStorage` key `sgs-language`. It is scoped to the website's origin; the separate platform has its own browser storage. Ukrainian remains the HTML/default language. Metadata updates with the selected language in the browser; this change does not add separate language URLs for search engines.
