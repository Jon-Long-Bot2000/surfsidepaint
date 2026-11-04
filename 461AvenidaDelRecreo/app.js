import { proposal, categories, roiAssumptions } from './data.js';
import { calculateProposal, defaultSelections, money } from './calculations.js';

let selections = defaultSelections();
let activePhase = proposal.phases[0].id;
const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const currentOption = category => category.options.find(option => option.id === selections[category.id]);
const categoryTag = category => category.optional ? '<span class="scope-tag recommended">Recommended · optional</span>' : '<span class="scope-tag">Baseline scope</span>';

function renderTabs() {
  $('#phase-tabs').innerHTML = proposal.phases.map(phase => `<button type="button" class="phase-tab" role="tab" id="tab-${phase.id}" aria-selected="${phase.id === activePhase}" aria-controls="compare-panel" tabindex="${phase.id === activePhase ? '0' : '-1'}" data-phase="${phase.id}"><span>${phase.number}</span>${escape(phase.short)}</button>`).join('');
}

function renderComparison() {
  const phase = proposal.phases.find(item => item.id === activePhase);
  const phaseCategories = categories.filter(category => category.phase === activePhase);
  const panel = $('#compare-panel');
  panel.setAttribute('aria-labelledby', `tab-${activePhase}`);
  panel.innerHTML = `<div class="phase-intro"><p>${escape(phase.description)}</p><small>${phaseCategories.length} improvements</small></div>` + phaseCategories.map(category => {
    const selected = currentOption(category);
    const body = category.options.length > 1
      ? `<fieldset class="choice-fieldset"><legend class="sr-only">Choose a package for ${escape(category.title.toLowerCase())}</legend><div class="option-grid ${category.options.length === 3 ? 'three-options' : ''}">${category.options.map(option => `<label class="option-card ${selected?.id === option.id ? 'is-selected' : ''}"><span class="option-topline"><span class="option-letter">OPTION ${option.id}</span><input type="radio" name="compare-${category.id}" value="${option.id}" data-category="${category.id}" aria-label="${escape(category.title)} Option ${option.id}: ${escape(option.title)}, ${money(option.price)}" ${selected?.id === option.id ? 'checked' : ''}></span><span class="option-name">${escape(option.title)}</span><span class="option-description">${escape(option.description)}</span><span class="option-price">${money(option.price)}</span></label>`).join('')}</div></fieldset>`
      : `<div class="fixed-package ${selected ? 'is-selected' : ''}"><div>${category.optional ? `<label class="include-label"><input type="checkbox" data-category="${category.id}" value="A" ${selected ? 'checked' : ''}>Include ${escape(category.title.toLowerCase())}</label>` : `<span class="option-name">${escape(category.options[0].title)}</span>`}<p>${escape(category.options[0].description)}</p></div><span class="option-price">${money(category.options[0].price)}</span></div>`;
    const footnote = category.id === 'floors' ? 'Complete package for the owner-confirmed 900 sq ft.'
      : category.id === 'primary-bedroom' ? 'Option B is the bathroom addition only; it does not include Option A repairs.'
      : category.id === 'windows' ? 'Retrofit replacement is subject to compatibility.'
      : category.optional ? 'Recommended and included by default. Uncheck to defer this package.' : '';
    return `<article class="comparison-card" data-comparison="${category.id}"><div class="category-heading"><div><h3>${escape(category.title)}</h3><p class="category-meta">${escape(category.condition)}</p></div>${categoryTag(category)}</div>${body}${footnote ? `<p class="package-note">${escape(footnote)}</p>` : ''}</article>`;
  }).join('');
}

function scopeOptionContent(category) {
  const selected = currentOption(category);
  const displayed = selected || category.options[0];
  return `<p class="scope-status ${!selected ? 'is-excluded' : ''}">${selected ? `Included · ${escape(displayed.title)} · ${money(displayed.price)} estimated package` : `Deferred · ${money(displayed.price)} package not included in your total`}</p><h4>${selected ? 'Included work' : 'Work available in this package'}</h4><ul>${displayed.scope.map(line => `<li>${escape(line)}</li>`).join('')}</ul>${displayed.notes.length ? `<div class="scope-notes">${displayed.notes.map(note => `<p>${escape(note)}</p>`).join('')}</div>` : ''}<p class="duration-note">Estimated duration: TBD</p>`;
}

function renderScope() {
  $('#scope-phases').innerHTML = proposal.phases.map(phase => `<section class="scope-phase" aria-labelledby="scope-phase-${phase.id}"><div class="scope-phase-heading"><span class="phase-number">${phase.number}</span><h3 id="scope-phase-${phase.id}">${escape(phase.title)}</h3><span class="scope-phase-sum" data-phase-total="${phase.id}"></span></div>${categories.filter(category => category.phase === phase.id).map(category => `<details class="scope-item" id="scope-${category.id}" data-scope="${category.id}"><summary><span class="scope-item-name">${escape(category.title)}</span><span class="scope-item-meta"><span class="scope-choice-badge" data-scope-badge="${category.id}"></span><span class="scope-price" data-scope-price="${category.id}"></span><span class="disclosure-icon" aria-hidden="true">+</span></span></summary><div class="scope-body"><p class="condition">${escape(category.condition)}</p>${category.options.length > 1 ? `<div class="scope-selector-row"><label for="scope-choice-${category.id}">Selected package</label><select id="scope-choice-${category.id}" data-category="${category.id}">${category.options.map(option => `<option value="${option.id}">Option ${option.id} · ${escape(option.title)} · ${money(option.price)}</option>`).join('')}</select></div>` : category.optional ? `<div class="scope-selector-row"><label class="include-label"><input type="checkbox" data-category="${category.id}" value="A" checked>Include ${escape(category.title.toLowerCase())}</label><span>${money(category.options[0].price)}</span></div>` : ''}<div data-scope-content="${category.id}">${scopeOptionContent(category)}</div></div></details>`).join('')}</section>`).join('');
}

function renderRoi(result) {
  const { roi } = result;
  const assumption = roiAssumptions;
  $('#summary-roi').innerHTML = `${roi.windows ? `<div class="summary-roi-line"><span>Windows · 68.5%</span><b>${money(roi.windows.recovery)}</b></div>` : ''}${roi.bathroom ? `<div class="summary-roi-line"><span>Bathroom · 60%</span><b>${money(roi.bathroom.recovery)}</b></div>` : ''}${roi.addition ? '<div class="summary-roi-line"><span>Bath addition</span><b>10% rent capacity</b></div>' : ''}<small class="roi-scope-note">Resale recovery shown separately.${roi.repaintScenario ? ' Repaint: 65% source scenario; complete-property coverage unconfirmed.' : ''} No combined ROI.</small>`;
  $('#roi-breakdown').innerHTML = `
    <article class="roi-card ${roi.windows ? 'is-active' : 'is-inactive'}"><span class="roi-state">${roi.windows ? 'Replacement windows selected' : 'Replacement windows not selected'}</span><h3>Window replacement</h3><div class="roi-value">${roi.windows ? money(roi.windows.recovery) : '68.5%'}</div><div class="roi-caption">${roi.windows ? 'potential resale cost recovery' : 'source resale-recovery assumption'}</div><p>${roi.windows ? `68.5% × ${money(roi.windows.cost)} complete package, using the proposal’s stated recovery rate with the current estimate.` : 'Option A refurbishes the existing windows. The 68.5% replacement-window recovery assumption is not applied to refurbishment.'}</p></article>
    <article class="roi-card ${roi.bathroom ? 'is-active' : 'is-inactive'}"><span class="roi-state">Bathroom renovation selected</span><h3>Bathroom renovation</h3><div class="roi-value">${roi.bathroom ? money(roi.bathroom.recovery) : '—'}</div><div class="roi-caption">potential resale cost recovery</div><p>${roi.bathroom ? `60% × ${money(roi.bathroom.cost)} selected package.` : 'Select a bathroom package to see this scenario.'} The proposal separately suggests $${assumption.bathroom.monthlyRentIncreaseMinimum}+ in monthly rental uplift and a 2–4 year payback. These are source assumptions, not additional resale returns.</p></article>
    <article class="roi-card"><span class="roi-state">Complete-property scope to be confirmed</span><h3>A complete repaint</h3><div class="roi-value">65%</div><div class="roi-caption">source resale-recovery assumption</div><p>The proposal also suggests 2–5% property-value uplift and $150+ monthly rental uplift. These measures overlap; they are not added. Main-house packages do not confirm cottage coverage, so no repaint return is calculated.</p></article>
    <article class="roi-card ${roi.addition ? 'is-active' : 'is-inactive'}"><span class="roi-state">${roi.addition ? 'Private bathroom addition selected' : 'Private bathroom addition not selected'}</span><h3>A private bathroom</h3><div class="roi-value">10%</div><div class="roi-caption">potential increase in rental-price capacity</div><p>${roi.addition ? 'Applied as a separate planning assumption for the selected $30,000 addition.' : 'Applies only to the $30,000 primary-bedroom bathroom addition.'} The proposal does not specify a home-value return, so none is calculated.</p></article>`;
}

function synchronize(announce = false) {
  const result = calculateProposal(selections);
  const total = $('#summary-total');
  const oldTotal = total.textContent;
  total.textContent = money(result.total);
  if (announce && oldTotal !== total.textContent && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    total.animate([{ opacity: 0.45, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 250 });
  }
  const isDefault = categories.every(category => selections[category.id] === 'A');
  $('#summary-difference').textContent = isDefault ? 'Option A starting configuration' : result.difference === 0 ? 'Same cost as the Option A configuration' : `${money(Math.abs(result.difference))} ${result.difference > 0 ? 'above' : 'below'} the Option A configuration`;
  $('#selected-count').textContent = result.selected.length;
  $('#selected-scope-list').innerHTML = `<ul>${result.selected.map(({ category, option }) => `<li><a href="#scope-${category.id}" data-open-scope="${category.id}">${escape(category.title)} · ${option.id}</a><span>${money(option.price)}</span></li>`).join('')}</ul>`;
  $('#summary-phase-totals').innerHTML = proposal.phases.map(phase => `<div class="summary-phase-line"><span>${escape(phase.short)}</span><span>${money(result.phaseTotals[phase.id])}</span></div>`).join('');
  document.querySelectorAll('[data-phase-total]').forEach(element => { element.textContent = money(result.phaseTotals[element.dataset.phaseTotal]); });

  document.querySelectorAll('[data-category]').forEach(control => {
    const selected = selections[control.dataset.category];
    if (control.type === 'radio') {
      control.checked = control.value === selected;
      control.closest('.option-card').classList.toggle('is-selected', control.checked);
    } else if (control.type === 'checkbox') {
      control.checked = Boolean(selected);
      control.closest('.fixed-package')?.classList.toggle('is-selected', control.checked);
    } else if (control.tagName === 'SELECT') {
      control.value = selected;
    }
  });

  categories.forEach(category => {
    const selected = currentOption(category);
    $(`[data-scope="${category.id}"]`).classList.toggle('is-excluded', !selected);
    $(`[data-scope-badge="${category.id}"]`).textContent = selected ? category.options.length > 1 ? `Option ${selected.id}` : 'Included' : 'Deferred';
    $(`[data-scope-price="${category.id}"]`).textContent = selected ? money(selected.price) : '—';
    $(`[data-scope-content="${category.id}"]`).innerHTML = scopeOptionContent(category);
  });

  renderRoi(result);
  if (announce) {
    $('#selection-announcement').textContent = `${result.selected.length} packages selected. Total estimated cost ${money(result.total)}. Estimated completion TBD. ROI assumptions updated by improvement.`;
  }
}

document.addEventListener('change', event => {
  const control = event.target.closest('[data-category]');
  if (!control) return;
  const category = categories.find(item => item.id === control.dataset.category);
  if (!category) return;
  if (control.type === 'checkbox' && category.optional) {
    selections[category.id] = control.checked ? 'A' : null;
  } else if (category.options.some(option => option.id === control.value)) {
    selections[category.id] = control.value;
  }
  synchronize(true);
});

function setPhase(id, focus = false) {
  activePhase = id;
  document.querySelectorAll('[data-phase]').forEach(tab => {
    const selected = tab.dataset.phase === id;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  renderComparison();
  if (focus) $(`#tab-${id}`).focus();
}

$('#phase-tabs').addEventListener('click', event => {
  const tab = event.target.closest('[data-phase]');
  if (tab) setPhase(tab.dataset.phase);
});

$('#phase-tabs').addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const index = proposal.phases.findIndex(phase => phase.id === activePhase);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? proposal.phases.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + proposal.phases.length) % proposal.phases.length;
  setPhase(proposal.phases[next].id, true);
});

$('#reset-options').addEventListener('click', () => {
  selections = defaultSelections();
  synchronize(true);
});

$('#expand-scope').addEventListener('click', () => {
  const items = [...document.querySelectorAll('.scope-item')];
  const expand = items.some(item => !item.open);
  items.forEach(item => { item.open = expand; });
});

$('#scope-phases').addEventListener('toggle', event => {
  if (!event.target.matches('.scope-item')) return;
  const allOpen = [...document.querySelectorAll('.scope-item')].every(item => item.open);
  $('#expand-scope').textContent = allOpen ? 'Collapse all' : 'Expand all';
}, true);

document.addEventListener('click', event => {
  const link = event.target.closest('[data-open-scope]');
  if (link) $(`#scope-${link.dataset.openScope}`).open = true;
});

// A direct scope anchor should reveal its contents as well as its heading.
function revealScopeAnchor() {
  if (!window.location.hash.startsWith('#scope-')) return;
  const target = document.getElementById(window.location.hash.slice(1));
  if (target?.matches('.scope-item')) target.open = true;
}

renderTabs();
renderComparison();
renderScope();
synchronize();
revealScopeAnchor();
window.addEventListener('hashchange', revealScopeAnchor);
