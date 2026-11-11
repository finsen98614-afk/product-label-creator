# Product Label Creator

Generate XO-W12-style product labels — for smart watches, dash cams and more.

- Brand name + product name, label size (default 6.5 x 10 cm)
- Iconic features with auto-matched icons (Bluetooth, IP68, AMOLED, NFC, health monitoring, watch case, wireless charging, dash cam features and more — with online icon search fallback)
- Slogan in 3 styles (Racer / Minimal / Retro), optional
- Warranty period (default 1 Year, or 6 Months), App name, price (red, centred, $)
- English interface; explanations live behind "?" buttons
- Real, scannable barcode: Code 128 (any text), EAN-13, UPC-A — Auto picks by length, retail types verify or auto-add the check digit, bars are checked against a minimum printable width
- Live preview, PNG download (fixed 300 DPI, independent of screen size). A label that would be cut off (barcode, price or content that does not fit) is not exported; the reason is shown next to the Download button
- Saved records (Add / Load / Change / Delete) keyed by the barcode value and stored locally in the browser, with Export / Import backup. Records from the earlier product-name-keyed version are converted automatically

## Use it

Open `index.html` in a browser — no build step, no server needed.

Live version: https://muse.ai/s/product-label-creator-gi6sxm8jxntzg/oN9eof7D-Lvli_ASVinWA7dj4jtLBElUxu8_xcXN8Gc

## Files

- `index.html` — the whole app in a single self-contained file (exported from Muse)
