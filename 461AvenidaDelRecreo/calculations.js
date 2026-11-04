import { categories, proposal, roiAssumptions } from './data.js';

export const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const resaleRecovery = (price, rate) => Math.round(price * rate * 100) / 100;

export function defaultSelections() {
  return Object.fromEntries(categories.map(category => [category.id, 'A']));
}

// One calculation path serves both the comparison and detailed scope controls.
// Unknown scheduling inputs remain unknown; no durations or concurrency invented.
// ROI is returned by improvement and is deliberately never blended or summed.
export function calculateProposal(selections) {
  const selected = categories.flatMap(category => {
    const choice = category.options.find(item => item.id === selections[category.id]);
    return choice ? [{ category, option: choice }] : [];
  });
  const total = selected.reduce((sum, entry) => sum + entry.option.price, 0);
  const baseline = categories.reduce((sum, category) => sum + category.options[0].price, 0);
  const windows = selected.find(entry => entry.category.id === 'windows' && entry.option.id === 'B');
  const bathroom = selected.find(entry => entry.category.id === 'bathroom');
  const addition = selected.find(entry => entry.category.id === 'primary-bedroom' && entry.option.id === 'B');
  const repaint = selected.some(entry => entry.category.id === 'interior-paint') && selected.some(entry => entry.category.id === 'exterior-paint');
  const roi = {
    windows: windows ? { cost: windows.option.price, recovery: resaleRecovery(windows.option.price, roiAssumptions.windows.resaleRecovery) } : null,
    bathroom: bathroom ? { cost: bathroom.option.price, recovery: resaleRecovery(bathroom.option.price, roiAssumptions.bathroom.resaleRecovery) } : null,
    addition: Boolean(addition),
    // The main-house packages do not establish complete-property/cottage coverage.
    repaintScenario: repaint,
  };
  return {
    selected, total, baseline, difference: total - baseline, roi,
    timeline: null,
    phaseTotals: Object.fromEntries(proposal.phases.map(phase => [phase.id, selected.filter(entry => entry.category.phase === phase.id).reduce((sum, entry) => sum + entry.option.price, 0)])),
    upgraded: selected.filter(entry => entry.option.id !== 'A').length,
  };
}
