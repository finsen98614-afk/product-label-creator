#!/usr/bin/env node
/*
 * Validates the icon / category catalog inside index.html without a browser.
 *
 *   node tools/check-categories.js            # checks ./index.html
 *   node tools/check-categories.js other.html # checks another copy
 *
 * It extracts the block between "BEGIN CATALOG" and "END CATALOG", runs it in a
 * sandbox (no DOM, no network) and checks the rules a new category must satisfy.
 * Exit code 1 when there is at least one error; warnings never fail the run.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const MAX_FEATURES = 40;          // keep in sync with MAX_FEATURES in index.html
const MAX_TEXT = 80;              // feature text limit (normalizeState / maxlength)
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

let html;
try { html = fs.readFileSync(file, 'utf8'); } catch (e) { console.error('Cannot read ' + file + ': ' + e.message); process.exit(2); }
const start = html.indexOf('BEGIN CATALOG');
const end = html.indexOf('END CATALOG');
if (start === -1 || end === -1 || end < start) {
  console.error('FAIL: the BEGIN CATALOG / END CATALOG markers are missing or out of order in ' + file);
  process.exit(1);
}
// from the end of the BEGIN comment to the start of the END comment
const bodyStart = html.indexOf('*/', start) + 2;
const bodyEnd = html.lastIndexOf('/*', end);
const code = html.slice(bodyStart, bodyEnd);

let cat;
try {
  cat = vm.runInNewContext(code + '\n;({ ICONS: ICONS, RULES: RULES, CATEGORIES: CATEGORIES, autoIcon: autoIcon })', Object.create(null), { timeout: 5000 });
} catch (e) {
  console.error('FAIL: the catalog block does not run on its own (does it touch the DOM?): ' + e.message);
  process.exit(1);
}
const { ICONS, RULES, CATEGORIES, autoIcon } = cat;
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/* ---- icons ---- */
const iconKeys = Object.keys(ICONS);
iconKeys.forEach((k) => {
  const ic = ICONS[k];
  if (!/^[a-z][a-z0-9]*$/.test(k)) err('icon "' + k + '": the key must be lowercase letters and digits');
  if (!ic || typeof ic.name !== 'string' || !ic.name.trim()) { err('icon "' + k + '": missing name'); return; }
  const svg = ic.svg;
  if (typeof svg !== 'string') { err('icon "' + k + '": missing svg'); return; }
  if (!svg.startsWith('<svg viewBox="0 0 24 24"') || !svg.endsWith('</svg>')) err('icon "' + k + '": must be a 24x24 <svg viewBox="0 0 24 24" ...> ... </svg>');
  if (/<script|<foreignObject|<iframe|javascript:|\son[a-z]+\s*=|\shref\s*=|xlink:/i.test(svg)) err('icon "' + k + '": contains script, link or event-handler markup');
  if ((svg.match(/</g) || []).length !== (svg.match(/>/g) || []).length) err('icon "' + k + '": unbalanced < > in the svg');
});

/* ---- keyword lists (shared + per category) ---- */
function checkRules(rules, where, allowedIcons) {
  const seen = Object.create(null);
  if (!Array.isArray(rules)) { err(where + ': rules must be an array'); return; }
  rules.forEach((r, i) => {
    if (!Array.isArray(r) || r.length !== 2 || !Array.isArray(r[1])) { err(where + ' rule #' + i + ': expected [iconKey, [keywords]]'); return; }
    if (!has(ICONS, r[0])) err(where + ' rule #' + i + ': icon "' + r[0] + '" does not exist');
    else if (allowedIcons && allowedIcons.indexOf(r[0]) === -1) err(where + ' rule #' + i + ': icon "' + r[0] + '" is not in the category icon list, so the Auto result would not show in its dropdown group');
    if (!r[1].length) err(where + ' rule #' + i + ' (' + r[0] + '): no keywords');
    r[1].forEach((k) => {
      if (typeof k !== 'string' || !k.trim()) { err(where + ' rule "' + r[0] + '": empty keyword'); return; }
      // text is lower-cased before matching, so an ASCII keyword with capitals can never match
      if (/^[\x00-\x7f]+$/.test(k) && k !== k.toLowerCase()) err(where + ' rule "' + r[0] + '": keyword "' + k + '" must be lowercase');
      if (seen[k]) warn(where + ': keyword "' + k + '" is listed twice (rules "' + seen[k] + '" and "' + r[0] + '"); the first one wins');
      else seen[k] = r[0];
    });
  });
}
checkRules(RULES, 'shared rules', null);

/* ---- categories ---- */
if (!Array.isArray(CATEGORIES) || !CATEGORIES.length) err('CATEGORIES must be a non-empty array');
const ids = Object.create(null);
const inAnyCategory = Object.create(null);
(CATEGORIES || []).forEach((c, idx) => {
  const where = 'category "' + (c && c.id) + '"';
  if (!c || typeof c.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(c.id)) { err('category #' + idx + ': id must be lowercase letters, digits or "-"'); return; }
  if (ids[c.id]) err(where + ': duplicate id');
  ids[c.id] = true;
  if (typeof c.name !== 'string' || !c.name.trim()) err(where + ': missing name');
  if (idx === 0) {
    if (c.id !== 'general' || c.icons !== '*' || c.rules.length || c.quick.length) err('the first category must be "general" with icons "*", no rules and no quick features (it keeps the pre-category behaviour for old records)');
    return;
  }
  if (!Array.isArray(c.icons) || !c.icons.length) { err(where + ': icons must be a non-empty array'); return; }
  const seenIcon = Object.create(null);
  c.icons.forEach((k) => {
    if (!has(ICONS, k)) err(where + ': icon "' + k + '" does not exist in ICONS');
    if (seenIcon[k]) err(where + ': icon "' + k + '" is listed twice');
    seenIcon[k] = true; inAnyCategory[k] = true;
  });
  checkRules(c.rules || [], where, c.icons);
  if (c.app !== undefined && typeof c.app !== 'boolean') err(where + ': app must be true or false (does a new label of this category show the App line by default)');
  if (!Array.isArray(c.quick) || !c.quick.length) { err(where + ': needs quick-add features'); return; }
  if (c.quick.length < 8) warn(where + ': only ' + c.quick.length + ' quick-add features (8 or more is recommended)');
  if (c.quick.length > MAX_FEATURES) err(where + ': more than ' + MAX_FEATURES + ' quick-add features');
  const seenQuick = Object.create(null);
  c.quick.forEach((t) => {
    if (typeof t !== 'string' || !t.trim() || t.length > MAX_TEXT) { err(where + ': quick feature "' + t + '" must be 1-' + MAX_TEXT + ' characters'); return; }
    const low = t.toLowerCase();
    if (seenQuick[low]) err(where + ': quick feature "' + t + '" is listed twice');
    seenQuick[low] = true;
    const icon = autoIcon(t, c.id);
    if (icon === 'star') err(where + ': quick feature "' + t + '" gets no icon (add a keyword rule for it)');
    else if (c.icons.indexOf(icon) === -1) err(where + ': quick feature "' + t + '" auto-matches "' + icon + '", which is not in the category icon list');
  });
});

/* ---- icons nobody lists (still reachable through General / "Other icons") ---- */
const orphans = iconKeys.filter((k) => !inAnyCategory[k]);
if (orphans.length) warn('icons not listed in any category: ' + orphans.join(', '));

/* ---- report ---- */
console.log('Catalog check: ' + iconKeys.length + ' icons, ' + RULES.length + ' shared rules, ' + CATEGORIES.length + ' categories (' + CATEGORIES.map((c) => c.id).join(', ') + ')');
warnings.forEach((m) => console.log('  warning: ' + m));
errors.forEach((m) => console.log('  ERROR:   ' + m));
if (errors.length) { console.log('FAILED: ' + errors.length + ' error(s)'); process.exit(1); }
console.log('OK' + (warnings.length ? ' (' + warnings.length + ' warning(s))' : ''));
