# Project map

- `index.html`: public landing page. Keep Ukrainian fallback text and attributes synchronized with `i18n.js`; browser tests also check the no-JavaScript page.
- `i18n.js`: canonical Ukrainian, English, German and Russian strings, including metadata and form feedback.
- `script.js`: persisted language preference, keyboard-accessible language dropdown, navigation and form behavior.
- `styles.css`: saturated picture-book orchard: leafy canvas, forest controls, amber courses, soil pricing and pond reviews. `images/garden-tree.svg` is the native vector hero/pricing tree, composed with the twelve decorative SVGs in `images/garden-icons/`. Keep the hero scene compact below the mobile CTA. `index.html` has the desktop pricing root paths; CSS connects mobile cards to a vertical root. Keep copy readable, pricing cards opaque above roots, equal initial package sizes, identical desktop hover/focus growth, and touch/reduced-motion safeguards. See `README.md` for the visual contract.
- `logo.svg`: native vector school mark, shared with the platform's `public/logo.svg` and `src/app/icon.svg`. Preserve the shield, lightbulb/sunflower, leaves and outlined SGS ribbon lettering. `LOGO_README.md` is the canonical design and asset reference.
- `tests`: Node checks and Playwright browser regressions. Mock the external application endpoint; never send test applications or email.
- `CNAME`: existing GitHub Pages domain. Do not change hosting, DNS or Cloudflare settings as part of frontend work.

# Review workflow

Show changes through local previews first. Do not push or deploy unless the user explicitly requests publication of the current changes.

# Verification

- `node --test tests/i18n.test.cjs`: translation and markup consistency.
- `node --check script.js` and `node --check i18n.js`: JavaScript syntax.
- Browser checks require Playwright; see `tests/README.md` for the local preview command and runner.
