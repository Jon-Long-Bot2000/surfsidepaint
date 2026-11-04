import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { calculateProposal, defaultSelections } from '../461AvenidaDelRecreo/calculations.js';
import { categories, proposal } from '../461AvenidaDelRecreo/data.js';

const pageRoot = fileURLToPath(new URL('../461AvenidaDelRecreo/', import.meta.url));

test('approved Option A estimate includes 900 sq ft of hardwood and exterior repairs', () => {
  const result = calculateProposal(defaultSelections());
  assert.equal(result.total, 61200);
  assert.equal(result.baseline, 61200);
  assert.equal(result.selected.length, 17);
  assert.deepEqual(result.phaseTotals, { 'whole-house': 12500, interiors: 26700, outdoors: 22000 });
  assert.equal(result.selected.find(entry => entry.category.id === 'floors').option.price, 4500);
  assert.equal(result.selected.find(entry => entry.category.id === 'exterior-repairs').option.price, 3000);
  assert.equal(proposal.property.hardwoodSqft, 900);
});

test('upgrades replace complete packages without adding the baseline package twice', () => {
  const selections = defaultSelections();
  selections.windows = 'B';
  selections.kitchen = 'B';
  selections['primary-bedroom'] = 'B';
  const result = calculateProposal(selections);
  assert.equal(result.total, 115000);
  assert.equal(result.selected.length, 17);
  assert.equal(result.selected.filter(entry => entry.category.id === 'kitchen').length, 1);
  assert.equal(result.selected.find(entry => entry.category.id === 'kitchen').option.price, 19000);
  assert.equal(result.selected.find(entry => entry.category.id === 'primary-bedroom').option.price, 30000);
  assert.deepEqual(result.phaseTotals, { 'whole-house': 26500, interiors: 66500, outdoors: 22000 });
});

test('full remodel and hard-wax floor packages retain the approved complete estimates', () => {
  const selections = { ...defaultSelections(), kitchen: 'C', bathroom: 'C', floors: 'B' };
  const result = calculateProposal(selections);
  assert.equal(result.total, 113850);
  assert.equal(result.selected.find(entry => entry.category.id === 'floors').option.price, 7650);
  assert.equal(result.selected.find(entry => entry.category.id === 'bathroom').option.price, 15000);
  assert.equal(result.selected.find(entry => entry.category.id === 'kitchen').option.price, 45000);
});

test('landscape packages can be deferred without removing the baseline repairs', () => {
  const selections = defaultSelections();
  selections['front-yard'] = null;
  selections['side-yard'] = null;
  selections['back-yard'] = null;
  const result = calculateProposal(selections);
  assert.equal(result.total, 50200);
  assert.equal(result.difference, -11000);
  assert.equal(result.phaseTotals.outdoors, 11000);
  assert.equal(result.selected.length, 14);
  assert.ok(result.selected.some(entry => entry.category.id === 'exterior-repairs'));
  assert.ok(result.selected.some(entry => entry.category.id === 'kitchen'));
});

test('ROI uses the current window price and keeps independent scenarios separate', () => {
  const baseline = calculateProposal(defaultSelections());
  assert.equal(baseline.roi.windows, null);
  assert.deepEqual(baseline.roi.bathroom, { cost: 2500, recovery: 1500 });
  assert.equal(baseline.roi.addition, false);
  const result = calculateProposal({ ...defaultSelections(), windows: 'B', bathroom: 'C', 'primary-bedroom': 'B' });
  assert.deepEqual(result.roi.windows, { cost: 18000, recovery: 12330 });
  assert.deepEqual(result.roi.bathroom, { cost: 15000, recovery: 9000 });
  assert.equal(result.roi.addition, true);
  assert.equal(result.roi.repaintScenario, true);
  assert.equal(result.roi.repaintRecovery, undefined, 'complete-property paint coverage is not established');
  assert.equal(result.roi.total, undefined, 'overlapping returns must not be added');
});

test('unknown durations remain unknown for both baseline and upgraded configurations', () => {
  assert.equal(calculateProposal(defaultSelections()).timeline, null);
  const upgrades = Object.fromEntries(categories.map(category => [category.id, category.options.at(-1).id]));
  assert.equal(calculateProposal(upgrades).timeline, null);
  for (const category of categories) {
    for (const option of category.options) assert.equal(option.duration, null);
  }
});

test('a fresh default configuration restores all packages after edits', () => {
  const modified = defaultSelections();
  modified.windows = 'B';
  modified['front-yard'] = null;
  const restored = defaultSelections();
  assert.equal(restored.windows, 'A');
  assert.equal(restored['front-yard'], 'A');
  assert.equal(calculateProposal(restored).total, 61200);
});

test('proposal navigation and local references resolve without additional services', async () => {
  const html = await readFile(resolve(pageRoot, 'index.html'), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, 'static IDs must be unique');
  for (const [, href] of html.matchAll(/\bhref="#([^"]+)"/g)) assert.ok(ids.includes(href), `Missing anchor ${href}`);
  const localPaths = [...html.matchAll(/\b(?:href|src)="(\.\/[^"#]+)"/g)].map(match => match[1]);
  for (const path of localPaths) await access(resolve(pageRoot, path));
  for (const filename of ['app.js', 'calculations.js']) {
    const source = await readFile(resolve(pageRoot, filename), 'utf8');
    for (const [, module] of source.matchAll(/\bfrom\s+['"](\.\/[^'"]+)['"]/g)) await access(resolve(dirname(resolve(pageRoot, filename)), module));
  }
  assert.match(html, /noindex, nofollow/);
  assert.equal((await readFile(resolve(pageRoot, 'assets/project-proposal.pdf'))).subarray(0, 5).toString(), '%PDF-');
  assert.equal((await readFile(resolve(pageRoot, 'assets/property.jpeg'))).readUInt16BE(0), 0xffd8);
});
