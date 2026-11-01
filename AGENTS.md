# Project map

- `index.html`: public landing page. Keep Ukrainian fallback text and attributes synchronized with `i18n.js`; browser tests also check the no-JavaScript page.
- `i18n.js`: canonical Ukrainian, English, German and Russian strings, including metadata and form feedback.
- `script.js`: persisted language preference, keyboard-accessible language dropdown, navigation and form behavior.
- `styles.css`: picture-book garden theme with the shared warm paper canvas, sage/forest controls and ochre/coral accents. `images/storybook-garden.webp` and `images/storybook-border.webp` are static decorative paintings; keep them in their own layout spaces, preserve desktop package hover and reduced-motion safeguards, and keep `logo.svg` unchanged.
- `tests`: Node checks and Playwright browser regressions. Mock the external application endpoint; never send test applications or email.
- `CNAME`: existing GitHub Pages domain. Do not change hosting, DNS or Cloudflare settings as part of frontend work.

# Verification

- `node --test tests/i18n.test.cjs`: translation and markup consistency.
- `node --check script.js` and `node --check i18n.js`: JavaScript syntax.
- Browser checks require Playwright; see `tests/README.md` for the local preview command and runner.
