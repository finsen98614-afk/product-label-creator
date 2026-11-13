# Product Label Creator

Generate XO-W12-style product labels — for smart watches, dash cams and more.

- Brand name + product name, label size (default 6.5 x 10 cm). Bold, high-contrast look: company yellow (#fdd904), large condensed feature text (a short feature such as IP68 or NFC is printed up to 1.5x larger, filling its cell), ring icons, thick rounded border
- Product categories (General, Smart watch, Dash cam, Speaker, Drone, Karaoke): the category decides which icons the dropdown suggests first, how Auto picks an icon from the words you type, and which quick-add features are offered. Changing it never edits features you already typed
- Iconic features with auto-matched icons (Bluetooth, IP68, AMOLED, NFC, health monitoring, watch case, wireless charging, dash cam features and more — with online icon search fallback)
- Slogan in 3 styles (Racer / Minimal / Retro), optional. It is the first thing to give way: when the label has no room for it (or the Racer band would be squashed) it hides itself and comes back when there is room again. The switch keeps your choice, and saved records keep it too
- Warranty period (default 1 Year, or 6 Months) and App name, each with its own on/off switch; price (large, red, centred on the label with the barcode centred under it)
- English interface; explanations live behind "?" buttons
- "Keep space for price and barcode" switch (on by default): a strip at the bottom stays free so a price and barcode can be printed or stuck on afterwards. Turn it off to give the space back to the features. The 5 x 5 cm "compact" preset turns it off
- Real, scannable barcode: Code 128 (any text), EAN-13, UPC-A — Auto picks by length, retail types verify or auto-add the check digit, bars are checked against a minimum printable width, and their height is a physical size (about 3 mm and up, never shrunk with the text or squeezed to make room: if the label is too tight, the size warning offers to turn the barcode off)
- Live preview, PNG download (fixed 300 DPI, independent of screen size). A label that would be cut off (barcode, price or content that does not fit) is not exported; the reason is shown next to the Download button
- Saved records (Add / Load / Change / Delete) keyed by the barcode value and stored locally in the browser, with Export / Import backup. Records from the earlier product-name-keyed version are converted automatically

## Use it

Open `index.html` in a browser — no build step, no server needed.

Live version: https://finsen98614-afk.github.io/product-label-creator/

It is published with GitHub Pages from the `main` branch (root folder), so merging to `main` redeploys it automatically (takes a minute or two).

Saved records live in your browser for that address only. If you used the old Muse version, press **Export backup** there and **Import backup** on the new address; old backups are converted automatically.

## Adding a product category

A category groups icons, Auto matching and quick-add features for one kind of product. Everything lives in the
catalog block of `index.html` (between the `BEGIN CATALOG` and `END CATALOG` comments):

1. **Icons.** Draw the icons the product needs (24x24 viewBox, black silhouette, same `F()` / `S()` helpers as the
   others) and add them to `ICONS`, above `star`. Reuse existing icons where one already fits (battery, bluetooth, ...).
2. **Category.** Add an object to `CATEGORIES` after the existing ones:

   ```js
   { id:'tablet', name:'Tablet',
     icons:['screen','battery', ...],        // shown first in the icon dropdown, in this order
     rules:[ ['screen', ['display','retina']] ],   // run BEFORE the shared rules: [iconKey, [keywords]]
     quick:['10.1" Display', '8000mAh Battery', ...] }   // 8 or more quick-add features
   ```

   Keyword rules: ASCII keywords in lowercase; up to 4 letters they must match a whole word (plural allowed), longer
   ones match from the start of a word; keywords with non-ASCII characters (Chinese) match as plain text.
3. **Check it.** `node tools/check-categories.js` (plain Node, nothing to install) must print `OK`. It fails when a
   category lists an icon that does not exist, a rule points at a missing icon or one outside the category list, a
   quick-add feature gets no icon, a keyword has capitals, an SVG contains script or event handlers, or the block
   touches the DOM. Warnings (for example an icon no category lists) do not fail the run.
4. **Look at it.** Open the page, pick the category and add its quick-add features; check each icon reads well.
5. **Open a pull request.** The *Check icon catalog* workflow runs the same script on every pull request and on `main`.

Category lists are starting points, not complete catalogs: features and icons that are only discovered while making a
real product are added one product at a time. When a feature has no icon, press **Request an icon for this** on its row;
it goes on the **Icon requests** list under the feature list (kept in your browser), and **Copy list** turns it into text
to send along. Each request is then answered with an icon and/or a keyword rule plus a quick-add entry, and the check
above guards the change.

Records saved without a category load as **General** (all icons, shared rules), so adding categories never changes
existing labels.

## Files

- `index.html` — the whole app in a single self-contained file (edit it directly; there is no build step)
- `tools/check-categories.js` — validates the icon / category catalog (see above)
- `.github/workflows/check-catalog.yml` — runs that check on pull requests and on `main`
