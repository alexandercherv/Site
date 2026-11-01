# Smart Garden School

The public school website at `smartgardenschool.org` is a buildless HTML/CSS/JavaScript landing page hosted separately from the learning platform.

The language dropdown switches all landing-page text, navigation, form labels/placeholders, validation, request feedback and browser metadata between Ukrainian, English, German and Russian. Ukrainian is the default and remains readable without JavaScript. Preference is saved locally in the browser; changing language preserves entered form values and stable course/package identifiers. Prices are fixed in USD for every language: 160 USD for 12 lessons, 310 USD for 24, and 600 USD for 48. Per-lesson prices are rounded to two decimals; savings of 10 USD and 40 USD compare with buying the same number of lessons in 12-lesson packages. There is no exchange-rate lookup or automatic currency conversion.

The compact language menu shows each language's native name and the current selection. It supports arrow keys, Home/End, Enter/Space, Escape, outside click and normal Tab navigation. The responsive navigation menu also supports keyboard navigation and Escape.

The picture-book garden uses a warm paper canvas, sage and forest controls, cream cards, rounded headings and small ochre/coral accents. A painted tree and outdoor learning nook welcome families in the hero, with matching garden details in two reserved section edges. The transparent WebP artwork stays static and clear of text and form controls; explicit image dimensions reserve its space, and below-fold details load lazily. The official `logo.svg` stays unchanged. Only desktop package cards grow modestly on hover or keyboard focus, with touch and reduced-motion safeguards.

Application requests use the existing Formspree endpoint. Errors preserve form values and offer an explicit email link; they never report unconfirmed delivery as success.

- `index.html`: page structure and Ukrainian fallback content.
- `i18n.js`: canonical translation strings.
- `script.js`: language, menu, navigation and form behavior.
- `styles.css`: layout and visual styling.
- `images/storybook-garden.webp` (1200×960) and `images/storybook-garden-small.webp` (600×480): responsive hero painting; `images/storybook-border.webp` (1536×512): matching garden edges. All three preserve transparency.
- [Local verification](tests/README.md): preview, automated checks and screenshots.
- [Application form setup](EMAIL_SETUP.md): the existing delivery integration and verification limits.
- [Logo documentation](LOGO_README.md): retained school artwork.

Run `python3 -m http.server 3320 --bind 127.0.0.1` from this directory and open `http://127.0.0.1:3320/` for local review. No compilation is required.
