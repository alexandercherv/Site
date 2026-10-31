# Project map

- `index.html`: public landing page. Keep Ukrainian content as the no-JavaScript default.
- `i18n.js`: canonical Ukrainian/English strings, including metadata and form feedback.
- `script.js`: language preference, accessible navigation and form behavior.
- `styles.css`: responsive cosmic design. Keep decorative effects static at idle and respect reduced motion.
- `tests`: Node checks and Playwright browser regressions. Mock the external application endpoint; never send test applications or email.
- `CNAME`: existing GitHub Pages domain. Do not change hosting, DNS or Cloudflare settings as part of frontend work.

# Verification

- `node --test tests/i18n.test.cjs`: translation and markup consistency.
- `node --check script.js` and `node --check i18n.js`: JavaScript syntax.
- Browser checks require Playwright; see `tests/README.md` for the local preview command and runner.
