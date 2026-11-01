# Project map

- `index.html`: public landing page. Keep Ukrainian fallback text and attributes synchronized with `i18n.js`; browser tests also check the no-JavaScript page.
- `i18n.js`: canonical Ukrainian, English, German and Russian strings, including metadata and form feedback.
- `script.js`: persisted language preference, keyboard-accessible language dropdown, navigation and form behavior.
- `styles.css`: restrained garden theme with shared sage, cream and forest colors. Keep the book/sprout illustration static, preserve desktop package hover and reduced-motion safeguards, and keep `logo.svg` unchanged.
- `tests`: Node checks and Playwright browser regressions. Mock the external application endpoint; never send test applications or email.
- `CNAME`: existing GitHub Pages domain. Do not change hosting, DNS or Cloudflare settings as part of frontend work.

# Verification

- `node --test tests/i18n.test.cjs`: translation and markup consistency.
- `node --check script.js` and `node --check i18n.js`: JavaScript syntax.
- Browser checks require Playwright; see `tests/README.md` for the local preview command and runner.
