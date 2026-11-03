# Smart Garden School

The public school website at `smartgardenschool.org` is a buildless HTML/CSS/JavaScript landing page hosted separately from the learning platform.

The language dropdown switches all landing-page text, navigation, form labels/placeholders, validation, request feedback and browser metadata between Ukrainian, English, German and Russian. Ukrainian is the default and remains readable without JavaScript. Preference is saved locally in the browser; changing language preserves entered form values and stable course/package identifiers. Base prices are 8,000 / 15,500 / 30,000 UAH for 12 / 24 / 48 lessons. The active language selects UAH (UK), USD (EN), EUR (DE), or RUB (RU). For non-UAH displays, the page fetches indicative rates from [Frankfurter v2](https://frankfurter.dev/) and formats package totals, per-lesson prices and savings with up to two fractional digits. Savings compare against the same number of lessons bought in 12-lesson packages. Cached rates refresh after six hours when needed and are usable for up to seven days. The selected language and last usable exchange rates are kept in browser storage. If a rate is unavailable, the site displays the base UAH price and a localized note. Form package IDs remain stable.

The compact language menu shows each language's native name and the current selection. It supports arrow keys, Home/End, Enter/Space, Escape, outside click and normal Tab navigation. The responsive navigation menu also supports keyboard navigation and Escape.

The picture-book orchard uses a leafy green canvas (`#e7efcf`), forest controls (`#28633f` / `#1e5032`), dark green text (`#1f412e`), amber courses, a warm soil pricing bed and pond-colored reviews. A native SVG apple tree shares the forest outlines and flat fills of the garden icon kit. It sits with a book, watering can, bee and sun in a contained hero scene beside the copy; on small screens the compact scene follows the main CTA. A larger tree medallion anchors the pricing roots, which connect all three packages on desktop and join a vertical root system on mobile. Pricing content stays opaque above the roots. Twelve small hand-drawn garden and learning icons recur in headings, course cards, features and sparse decorative details. Artwork stays static and explicit image dimensions reserve space. The school logo uses the same garden palette while retaining its shield, lightbulb/sunflower, leaves and SGS ribbon identity. All three package cards have the same initial size in each layout; the middle package is distinguished by its color and recommendation ribbon. Each card grows equally to 1.05 scale on desktop hover or keyboard focus, with no growth on touch screens or under reduced motion.

Application requests use the existing Formspree endpoint. Errors preserve form values and offer an explicit email link; they never report unconfirmed delivery as success.

- `index.html`: page structure and Ukrainian fallback content.
- `i18n.js`: canonical translation strings.
- `script.js`: language, menu, navigation and form behavior.
- `styles.css`: layout and visual styling.
- `images/garden-tree.svg` (500×560): native vector tree used in the hero and pricing medallion. Previous painted WebP sources remain in `images/` but are unused.
- `images/garden-icons/`: twelve lightweight decorative SVGs. The pricing root paths are inline SVG in `index.html`, with the mobile root connections in `styles.css`.
- [Local verification](tests/README.md): preview, automated checks and screenshots.
- [Application form setup](EMAIL_SETUP.md): the existing delivery integration and verification limits.
- [Logo documentation](LOGO_README.md): canonical vector artwork, palette and usage.

Run `python3 -m http.server 3320 --bind 127.0.0.1` from this directory and open `http://127.0.0.1:3320/` for local review. No compilation is required.
