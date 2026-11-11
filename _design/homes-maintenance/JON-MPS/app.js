const response = await fetch('data.json');
if (!response.ok) throw new Error('The source data could not be loaded.');
const DATA = await response.json();
const TASKS = new Map(DATA.tasks.map(task => [task.id, task]));
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT = MONTHS.map(month => month.slice(0,3));
const COLORS = {water:'#558899',comfort:'#146657',exterior:'#a85c42',safety:'#8b783e',planning:'#758472'};
const PLANS = {
  protect:{number:'01',label:'Financial focus',small:'Prioritize cost comparisons',eyebrow:'GRAPHIC 01 / FINANCIAL FOCUS',
    title:'Start with the care that protects more.',
    lede:'A sample year led by the largest repair-to-service price comparisons in this sample. See the work and the time behind each visit. Price comparisons are context, not promised savings.',
    caption:'Prioritized by repair-to-service price ratio. Potential repair costs are context, not promised savings.'},
  outside:{number:'02',label:'Outside the home',small:'An exterior-only year',eyebrow:'GRAPHIC 02 / EXTERIOR CARE',
    title:'A little care. All around your home.',
    lede:'Gutters, exterior finishes, concrete, irrigation, and the perimeter. A year of practical outdoor work, in manageable two-hour visits.',
    caption:'Exterior services only. Larger projects are divided into clearly marked portions across the year.'},
  inside:{number:'03',label:'Inside the home',small:'Everyday comfort & upkeep',eyebrow:'GRAPHIC 03 / INTERIOR CARE',
    title:'Keep the everyday things working well.',
    lede:'From air filters to hot water and kitchen appliances, see how small visits can care for the things you rely on every day.',
    caption:'Interior services only. Monthly alarm checks are reserved first, with the remaining care fitted around them.'},
  custom:{number:'04',label:'Make it yours',small:'Build your own timeline',eyebrow:'GRAPHIC 04 / YOUR OWN YEAR',
    title:'Your home. Your priorities. Your year.',
    lede:'Choose a starting month, add services from the list, and see your year take shape. Each month holds up to two planned service hours.',
    caption:'Your changes stay in this browser. Download a copy of your sample plan whenever you like.'}
};
const DESIGNS = [
  {id:'calendar',name:'Care calendar',tag:'A year at a glance',description:'Twelve clear monthly cards. Easy to scan, understand, and share.'},
  {id:'seasons',name:'Seasonal roadmap',tag:'Four chapters of care',description:'Four chronological chapters give the year a calm, seasonal rhythm.'},
  {id:'time',name:'Time, made visible',tag:'Every minute has a place',description:'A two-hour ruler makes the amount of work tangible, month by month.'},
  {id:'book',name:'Appointment book',tag:'One month at a time',description:'A compact month selector opens a generous page of service details.'},
  {id:'wheel',name:'Year wheel',tag:'A continuous cycle',description:'An interactive annual dial connects recurring care with a selected month.'},
  {id:'journal',name:'Home care journal',tag:'Lead with the everyday benefit',description:'An editorial timeline makes each visit feel like a useful story about home.'}
];
const KEY = 'surfside-jon-mps-study-v1';
const emptyYear = () => Array.from({length:12},()=>[]);
const clone = value => JSON.parse(JSON.stringify(value));
let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { /* Keep an in-memory plan when storage is unavailable. */ }
const params = new URLSearchParams(location.search);
const state = {
  plan: Object.hasOwn(PLANS,params.get('graphic')) ? params.get('graphic') : 'protect',
  design: DESIGNS.some(d=>d.id===params.get('design')) ? params.get('design') : 'calendar',
  month:0, filter:'all', search:'', compare:false,
  custom:validYear(saved.custom) ? saved.custom : emptyYear(),
  favorites:saved.favorites && typeof saved.favorites==='object' ? saved.favorites : {}
};
let serial = Date.now();
let toastTimer;
function validYear(year) {
  return Array.isArray(year) && year.length===12 && year.every(month=>Array.isArray(month)
    && month.every(e=>TASKS.has(e.task) && Number.isFinite(e.minutes) && e.minutes>0 && e.minutes<=120
      && typeof e.job==='string' && Number.isFinite(e.fullMinutes) && e.fullMinutes>=e.minutes)
    && month.reduce((sum,e)=>sum+e.minutes,0)<=120);
}
function esc(value) { return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function mins(value) { return value===0?'0 min':value<60?`${value} min`:value%60?`${Math.floor(value/60)} hr ${value%60} min`:`${value/60} ${value===60?'hr':'hrs'}`; }
function usd(number) { return `$${Number(number).toLocaleString('en-US')}`; }
function range(value) { return value ? `${usd(value.low)}${value.high===value.low?'':`–${Number(value.high).toLocaleString('en-US')}`}${value.openEnded?'+':''}` : 'Scope-specific'; }
function cleanSource(value) { return value.replace(/\s+(?:Source|Cleaning, repairs|Plumbing, water mitigation|Repair, replacement|Fascia, foundation|Fence, deck|Water, mold|Inspection, repairs|Inspection, repair)\.?$/,''); }
function calendar() { return state.plan==='custom'?state.custom:DATA.plans[state.plan].calendar; }
function total(year=calendar()) { return year.flat().reduce((sum,e)=>sum+e.minutes,0); }
function monthTotal(m,year=calendar()) { return year[m].reduce((sum,e)=>sum+e.minutes,0); }
function save() { try { localStorage.setItem(KEY,JSON.stringify({custom:state.custom,favorites:state.favorites})); return true; } catch { return false; } }
function notify(message) {
  document.querySelector('#announcement').textContent=message;
  const toast=document.querySelector('#toast'); toast.textContent=message; toast.hidden=false;
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.hidden=true,5500);
}
function color(task) { return `--cat:${COLORS[task.category]}`; }
const paths={
  home:'<path d="m3 10 9-7 9 7v11H3Z"/><path d="M9 21v-7h6v7"/>',
  air:'<path d="M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h6a3 3 0 1 1-3 3"/>',
  spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/><path d="m20 3 .5 1.5L22 5l-1.5.5L20 7l-.5-1.5L18 5l1.5-.5Z"/>',
  drop:'<path d="M12 3s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
  rain:'<path d="M4 13a4 4 0 0 1 1-8 6 6 0 0 1 11-1 5 5 0 1 1 3 9Z"/><path d="m7 17-1 3m6-3-1 3m6-3-1 3"/>',
  brush:'<rect x="3" y="4" width="14" height="6" rx="2"/><path d="M17 7h3v7h-9v7M8 21h6"/>',
  leaf:'<path d="M20 3C7 2 2 8 5 15s14 6 15-12Z"/><path d="M4 21 16 8M9 16l-1-5m5 1h5"/>',
  window:'<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v18M4 12h16"/>',
  shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
  bolt:'<path d="m13 2-9 12h7l-1 8 10-13h-8Z"/>',
  tool:'<path d="M15 3a6 6 0 0 0-7 7l-5 7a3 3 0 0 0 4 4l7-7a6 6 0 0 0 7-7l-4 4-4-4Z"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M7 3v4m10-4v4m-9 9 3 3 5-6"/>'
};
function icon(name) { return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.home}</svg>`; }
function costLine(task) {
  const service=range(task.serviceRanges[0]);
  const repair=task.ratio!==null?`<span> · Repair example </span>${range(task.comparisonRepair)}`:'<span> · Planning / care service</span>';
  return `<p class="cost-line">Full scope ${service}${repair}</p>`;
}
function portion(entry) {
  return entry.parts>1 ? `<span class="portion">Partial scope ${entry.part} of ${entry.parts} · ${mins(entry.fullMinutes)} full example</span>` : '';
}
function taskEntry(entry,{benefit=true}={}) {
  const task=TASKS.get(entry.task);
  return `<article class="task-entry" style="${color(task)}">
    <span class="task-icon">${icon(task.icon)}</span>
    <div class="task-main"><button class="task-name" type="button" data-detail="${task.id}" data-entry="${esc(entry.job)}">${esc(task.short)}</button>
      <p class="task-meta">${mins(entry.minutes)} this visit</p>${portion(entry)}
      ${benefit?`<p class="task-benefit">${esc(task.benefit)}</p>`:''}${costLine(task)}${state.plan==='protect'&&task.ratio!==null?`<span class="ratio-tag">${task.ratio.toFixed(1)}× price comparison</span>`:''}
      <button type="button" class="task-more" data-detail="${task.id}" data-entry="${esc(entry.job)}">Why this task? +</button>
      ${state.plan==='custom'?`<br><button type="button" class="remove-task" data-remove="${esc(entry.job)}">Remove this service</button>`:''}
    </div></article>`;
}
function track(m) {
  const parts=calendar()[m].map(e=>`<i style="${color(TASKS.get(e.task))};width:${e.minutes/120*100}%" title="${esc(TASKS.get(e.task).short)}: ${mins(e.minutes)}"></i>`).join('');
  return `<div class="capacity-track" aria-label="${monthTotal(m)} of 120 planned minutes">${parts}</div>`;
}
function emptyMonth(m) {
  return `<div class="empty-month">${state.plan==='custom'?'Room for your priorities.':'Time available for a home priority.'}${state.plan==='custom'?`<button type="button" data-target-month="${m}">Choose a service +</button>`:''}</div>`;
}
function monthCard(m) {
  const entries=calendar()[m];
  return `<article class="month-card"><header class="month-top"><h3><span>${String(m+1).padStart(2,'0')}</span>${MONTHS[m]}</h3><span class="time-pill">${mins(monthTotal(m))} / 2 hrs</span></header>
    <div class="month-body">${entries.length?entries.map(e=>taskEntry(e)).join(''):emptyMonth(m)}
    ${state.plan==='custom'&&monthTotal(m)<120?`<button class="add-month" type="button" data-target-month="${m}">Add to ${SHORT[m]} · ${mins(120-monthTotal(m))} free +</button>`:''}</div>
    ${monthTotal(m)>0&&monthTotal(m)<120?`<p class="capacity-free">${mins(120-monthTotal(m))} available</p>`:''}${track(m)}</article>`;
}
function legend() { return `<div class="legend">${Object.entries({water:'Water & drainage',comfort:'Everyday care',exterior:'Exterior',safety:'Safety',planning:'Planning'}).filter(([key])=>calendar().flat().some(e=>TASKS.get(e.task).category===key)).map(([key,label])=>`<span><i class="dot" style="--cat:${COLORS[key]}"></i>${label}</span>`).join('')}</div>`; }
function calendarView() { return `<div class="month-grid">${MONTHS.map((_,m)=>monthCard(m)).join('')}</div>`; }
const chapters=[
  {label:'JANUARY — MARCH',title:'Start with a little attention.',note:'Get familiar with the year ahead.',bg:'#e7eddf'},
  {label:'APRIL — JUNE',title:'Keep the good things going.',note:'Small visits. Visible progress.',bg:'#f1ecdc'},
  {label:'JULY — SEPTEMBER',title:'Care through the changing seasons.',note:'Make space for the work that matters.',bg:'#e5eeeb'},
  {label:'OCTOBER — DECEMBER',title:'Finish the year feeling prepared.',note:'Review, refresh, and look ahead.',bg:'#eee4d9'}
];
function seasonsView() {
  return `<div class="season-grid">${chapters.map((chapter,q)=>`<article class="season-card"><header class="season-cover" style="--season-bg:${chapter.bg}"><span>${chapter.label}</span><h3>${chapter.title}</h3><p>${chapter.note}</p></header>
    ${[q*3,q*3+1,q*3+2].map(m=>`<div class="season-month"><div>${SHORT[m]}<span class="season-time">${mins(monthTotal(m))}</span></div><div>${calendar()[m].length?calendar()[m].map(e=>taskEntry(e,{benefit:false})).join(''):emptyMonth(m)}${track(m)}</div></div>`).join('')}</article>`).join('')}</div>`;
}
function timeView() {
  return `<div class="time-ledger"><div class="ruler"><span>YOUR YEAR</span><div class="ruler-labels"><span>0 min</span><span>60 min</span><span>120 min</span></div></div>
    ${MONTHS.map((month,m)=>`<article class="time-row"><h3>${SHORT[m]}<small>${mins(monthTotal(m))}</small></h3><div><div class="time-bar" aria-label="${month}, ${monthTotal(m)} minutes planned">${calendar()[m].map(e=>{const t=TASKS.get(e.task);return `<button type="button" class="time-segment" style="${color(t)};width:${e.minutes/120*100}%" data-detail="${t.id}" data-entry="${esc(e.job)}" aria-label="${esc(t.short)}, ${mins(e.minutes)}">${e.minutes>=30?`${e.minutes}m`:''}</button>`;}).join('')}</div>
    <div class="bar-caption">${calendar()[m].map(e=>{const t=TASKS.get(e.task);return `<button type="button" data-detail="${t.id}" data-entry="${esc(e.job)}"><i class="dot" style="${color(t)}"></i><span>${esc(t.short)}${e.parts>1?` · Partial scope ${e.part}/${e.parts}`:''}<small>${mins(e.minutes)} this visit · ${t.ratio!==null?`${range(t.serviceRanges[0])} full scope / ${range(t.comparisonRepair)} repair example`:`${range(t.serviceRanges[0])} full scope`}</small></span></button>`;}).join('')||`<span class="task-meta">${mins(120-monthTotal(m))} available</span>`}</div>
    ${state.plan==='custom'?`<button type="button" class="task-more" data-target-month="${m}">Choose services for ${month} +</button>`:''}</div></article>`).join('')}</div>`;
}
function appointmentPage(m) {
  return `<div class="appointment-page"><header class="appointment-title"><div><p class="eyebrow">YOUR MONTH OF CARE</p><h3>${MONTHS[m]}</h3><p>${monthTotal(m)?`${mins(monthTotal(m))} planned, one useful visit at a time.`:'A fresh page for your priorities.'}</p></div><span class="time-pill">${mins(120-monthTotal(m))} free</span></header>
    ${calendar()[m].map(e=>taskEntry(e)).join('')||emptyMonth(m)}${track(m)}
    ${state.plan==='custom'?`<button type="button" class="add-month" data-target-month="${m}">Choose services for ${MONTHS[m]} +</button>`:''}</div>`;
}
function bookView() {
  return `<div class="appointment-book"><nav class="month-rail" aria-label="Choose an appointment month">${MONTHS.map((month,m)=>`<button type="button" class="month-choice" data-month="${m}" aria-pressed="${state.month===m}"><span>${month}</span><small>${mins(monthTotal(m))}</small></button>`).join('')}</nav>${appointmentPage(state.month)}</div>`;
}
function point(r,a) { const v=(a-90)*Math.PI/180;return [220+r*Math.cos(v),220+r*Math.sin(v)]; }
function ringPath(a,b) {
  const p=point(194,a),q=point(194,b),r=point(128,b),s=point(128,a);
  return `M${p} A194 194 0 0 1 ${q} L${r} A128 128 0 0 0 ${s}Z`;
}
function wheelView() {
  return `<div class="wheel-layout"><div><svg class="wheel" viewBox="0 0 440 440" role="group" aria-label="Choose a month on the year wheel">${MONTHS.map((month,m)=>{const [x,y]=point(160,m*30+15);return `<g role="button" tabindex="0" data-month="${m}" aria-label="${month}, ${mins(monthTotal(m))}" aria-pressed="${state.month===m}"><path d="${ringPath(m*30,m*30+30)}"/><text x="${x}" y="${y}">${SHORT[m]}</text></g>`;}).join('')}<text class="wheel-total" x="220" y="213">${Number((total()/60).toFixed(2))} hrs</text><text class="wheel-sub" x="220" y="245">A YEAR OF CARE</text><text class="wheel-sub" x="220" y="264">UP TO 2 HOURS A MONTH</text></svg>
    <nav class="wheel-months" aria-label="Year wheel months">${SHORT.map((month,m)=>`<button type="button" data-month="${m}" aria-pressed="${state.month===m}" aria-label="${MONTHS[m]}">${month}</button>`).join('')}</nav></div>${appointmentPage(state.month)}</div>`;
}
function journalView() {
  return `<div class="journal">${MONTHS.map((month,m)=>{const candidates=calendar()[m].filter(e=>e.task!=='t22');const first=[...(candidates.length?candidates:calendar()[m])].sort((a,b)=>b.minutes-a.minutes)[0];const t=first?TASKS.get(first.task):null;return `<article class="journal-entry"><div class="journal-month"><strong>${String(m+1).padStart(2,'0')}</strong><span>${month}</span></div><div class="journal-story"><div><h3>${esc(t?.benefit||'Make room for what your home needs.')}</h3>${calendar()[m].map(e=>taskEntry(e,{benefit:false})).join('')||emptyMonth(m)}<p class="journal-time">${mins(monthTotal(m))} planned · ${mins(120-monthTotal(m))} available</p></div><div class="journal-art">${icon(t?.icon||'home')}</div></div></article>`;}).join('')}</div>`;
}
function render() {
  const meta=PLANS[state.plan],year=calendar(),used=total(year),count=new Set(year.flat().map(e=>e.task)).size;
  document.body.classList.toggle('builder-on',state.plan==='custom');
  document.body.dataset.design=state.design;
  const url=new URL(location.href);url.searchParams.set('graphic',state.plan);url.searchParams.set('design',state.design);history.replaceState(null,'',url);
  document.querySelector('#plan-tabs').innerHTML=Object.entries(PLANS).map(([id,p])=>`<button type="button" role="tab" class="plan-tab" id="plan-${id}" data-plan="${id}" aria-selected="${state.plan===id}" tabindex="${state.plan===id?0:-1}" aria-controls="study"><span class="tab-num">${p.number}</span><span><strong>${p.label}</strong><small>${p.small}</small></span></button>`).join('');
  document.querySelector('#design-tabs').innerHTML=DESIGNS.map((d,i)=>`<button type="button" role="tab" class="design-tab" data-design="${d.id}" aria-selected="${state.design===d.id}" tabindex="${state.design===d.id?0:-1}" aria-controls="visualization"><span class="design-num">DIRECTION ${String(i+1).padStart(2,'0')}</span><strong>${d.name}</strong></button>`).join('');
  document.querySelector('#study-copy').innerHTML=`<header class="study-masthead"><div><p class="eyebrow">${meta.eyebrow}</p><h2>${meta.title}</h2><p class="study-lede">${meta.lede}</p></div><div class="study-stamp" aria-hidden="true"><strong>2 hrs</strong><small>MONTH BY MONTH</small></div></header>`;
  document.querySelector('#budget-summary').innerHTML=`<div class="summary"><div class="summary-item"><strong>${Number((used/60).toFixed(2))} <span>/ 24 hours</span></strong><small>Planned across the year</small></div><div class="summary-item"><strong>${year.filter(m=>m.length).length} <span>/ 12 months</span></strong><small>With care on the calendar</small></div><div class="summary-item"><strong>${count} <span>${count===1?'kind':'kinds'} of care</span></strong><small>Up to 2 hours each month</small></div></div>`;
  document.querySelector('#builder-tools').innerHTML=state.plan==='custom'?`<div class="builder-toolbar"><label for="target-month">Start your next service in <select id="target-month">${MONTHS.map((m,i)=>`<option value="${i}" ${i===state.month?'selected':''}>${m} · ${mins(120-monthTotal(i))} free</option>`).join('')}</select></label><div class="builder-actions"><button type="button" class="small-button" data-clear>Clear year</button><button type="button" class="small-button solid" data-download>Download my sample ↓</button></div><div class="preset-buttons"><span class="task-meta">Start with a sample:</span>${['protect','outside','inside'].map(id=>`<button type="button" data-load="${id}">${PLANS[id].label} +</button>`).join('')}</div></div><p class="year-status">${mins(1440-used)} available across your year. Longer services are allocated across open months. Monthly checks and condition-based work still follow the source guidance.</p>`:'';
  const views={calendar:calendarView,seasons:seasonsView,time:timeView,book:bookView,wheel:wheelView,journal:journalView};
  document.querySelector('#visualization').innerHTML=`<div class="visual-shell"><div class="visual-intro"><p>${state.plan==='custom'?'Choose tasks below to build your year.':'January through December · sample service allowances'}</p>${legend()}</div>${views[state.design]()}</div>`;
  document.querySelector('#task-library').hidden=state.plan!=='custom';
  if(state.plan==='custom')renderLibrary();
  document.querySelector('#study-footer').innerHTML=`<footer class="study-footer"><div><p>${meta.caption} Portions show time within a larger scope; displayed prices describe the full source scope.</p><button type="button" class="comparison-favorite" data-favorite aria-pressed="${state.favorites[state.plan]===state.design}">${state.favorites[state.plan]===state.design?'✓ Direction marked for this infographic':'♡ Mark this design direction'}</button></div>${state.plan==='custom'?'<button type="button" class="button secondary" data-download>Download my sample ↓</button>':`<button type="button" class="button" data-load="${state.plan}">Make this my starting point <span aria-hidden="true">↗</span></button>`}</footer>`;
  document.querySelector('#method-content').innerHTML=`<p><strong>The source:</strong> ${esc(DATA.source)}, 28 named tasks. Task descriptions, frequency guidance, time ranges, service costs, repair examples, and intrinsic benefits are retained in the task details. An unnamed trailing cost-only row is excluded.</p><p><strong>Time allowances:</strong> ${esc(DATA.timeMethod)} These are illustrative booking allowances, not completion guarantees. Portions represent selected areas or components; the entire source scope is only represented when all its portions are included. Actual preparation, access, materials, weather, drying, and specialist requirements can change the work.</p><p><strong>Financial focus:</strong> ${esc(DATA.ratioMethod)} Safety-device replacement costs are comparisons, not a dollar value assigned to safety. Service visit counts and seasonal placement are design-study choices; this sample does not claim to cover every component’s required maintenance.</p><p><strong>The interface:</strong> four infographic purposes share six distinct design directions. Your editable plan and marked design directions are stored locally when browser storage is available. No account, booking, or service request is created.</p><a class="source-link" href="source.csv" download>Download the supplied matrix</a><a class="source-link" href="?graphic=custom&design=${state.design}">Open the interactive study</a>`;
}
function renderLibrary(listOnly=false) {
  const host=document.querySelector('#task-library');
  if(!listOnly)host.innerHTML=`<div class="library-heading"><p class="eyebrow">28 WAYS TO CARE</p><h3>Choose your next service.</h3><a class="timeline-link" href="#visualization">View your timeline ↓</a><p>Add a full example scope. If it takes more than two hours, we’ll divide it across open months, starting in ${MONTHS[state.month]}.</p></div><div class="library-controls"><input id="task-search" type="search" placeholder="Find a task…" aria-label="Search maintenance tasks" value="${esc(state.search)}"><select id="task-filter" aria-label="Filter task location"><option value="all">All tasks</option><option value="exterior">Exterior only</option><option value="interior">Interior only</option><option value="whole">Whole home / mixed</option></select></div><div id="library-list" class="library-list"></div>`;
  const select=document.querySelector('#task-filter');if(select)select.value=state.filter;
  const matches=DATA.tasks.filter(t=>(state.filter==='all'||t.location===state.filter)&&`${t.name} ${t.description}`.toLowerCase().includes(state.search.toLowerCase()));
  document.querySelector('#library-list').innerHTML=matches.map(t=>`<article class="library-card"><h4>${esc(t.short)}</h4><p>${esc(t.description)}</p><p class="library-meta">${mins(t.minutes)} example allowance${t.minutes>120?' · split across visits':''}<br>${t.location==='whole'?'Whole home / mixed':t.location==='interior'?'Inside the home':'Outside the home'}</p>${costLine(t)}<div class="library-buttons"><button type="button" class="task-more" data-detail="${t.id}">Details +</button><button type="button" class="small-button solid" data-add="${t.id}" ${t.minutes>1440-total()?'disabled':''}>Add service +</button></div></article>`).join('')||'<p class="task-meta">No tasks match. Try another search or location.</p>';
}
function showDetail(id,jobId) {
  const task=TASKS.get(id);if(!task)return;
  const entries=jobId?calendar().flatMap((mo,m)=>mo.filter(e=>e.job===jobId).map(e=>({...e,month:m}))):[];
  document.querySelector('#detail-content').innerHTML=`<p class="eyebrow">THE CARE BEHIND THE CARD</p><div class="detail-heading"><span class="task-icon" style="${color(task)}">${icon(task.icon)}</span><h2 id="detail-title">${esc(task.name)}</h2></div><p class="detail-description">${esc(task.description)}</p><div class="detail-benefit"><span class="eyebrow">THE EVERYDAY RETURN</span><p>${esc(task.benefit)}</p></div><dl class="detail-data"><div><dt>Example booking allowance</dt><dd>${mins(task.minutes)}. Source estimate: ${esc(task.sourceTime)}.${entries.length?`<br>On this timeline: ${entries.map(e=>`${MONTHS[e.month]} ${mins(e.minutes)}`).join('; ')}.`:''}${task.minutes>120?'<br>This scope is divided into portions targeting selected areas/components.':''}</dd></div><div><dt>Maintenance frequency · source guidance</dt><dd>${esc(task.frequency)}</dd></div><div><dt>Service price · full source scope</dt><dd>${esc(cleanSource(task.service))}</dd></div><div><dt>Potential repair price examples · source guidance</dt><dd>${esc(cleanSource(task.repairs))}</dd></div>${task.ratio!==null?`<div><dt>Repair-to-service price comparison</dt><dd>${task.ratio.toFixed(1)}×, using the midpoints of the largest named repair range (${esc(task.comparisonRepair?.label || 'repair example')}: ${range(task.comparisonRepair)}) and the service range. This is a comparison of prices, not a forecast of savings.</dd></div>`:''}</dl><p class="detail-note">A service visit can reveal work that needs a separate scope. Monthly checks, event-triggered attention, and manufacturer instructions still apply between the example visits. Materials and specialist work may be separate.</p><p class="detail-source">Source: ${esc(DATA.source)}, row ${task.row}.</p>`;
  document.querySelector('#detail-dialog').showModal();
}
function loadPreset(id) {
  state.custom=clone(DATA.plans[id].calendar);state.plan='custom';state.month=0;save();render();
  notify(`${PLANS[id].label} copied into your editable year.`);
  document.querySelector('#study').focus({preventScroll:true});
}
function addService(id) {
  const task=TASKS.get(id);if(!task)return;
  const order=Array.from({length:12-state.month},(_,i)=>state.month+i);
  const available=order.reduce((sum,m)=>sum+120-monthTotal(m),0);
  if(task.minutes>available){notify(`${task.short} needs ${mins(task.minutes)}. Only ${mins(available)} are available from ${MONTHS[state.month]} through December. Choose an earlier starting month or remove a service.`);return;}
  let remaining=task.minutes;const job=`custom-${++serial}`,parts=[];
  for(const m of order){const take=Math.min(remaining,120-monthTotal(m));if(take){const entry={task:id,job,minutes:take,fullMinutes:task.minutes};state.custom[m].push(entry);parts.push(entry);remaining-=take;}if(!remaining)break;}
  parts.forEach((entry,i)=>Object.assign(entry,{part:i+1,parts:parts.length}));
  const persisted=save();render();notify(`${task.short} added${parts.length>1?` in ${parts.length} portions`:''}.${persisted?' Saved in this browser.':''}`);
}
function downloadPlan() {
  const year=calendar();
  const rows=[['Month','Task','Planned minutes','Portion','Total portions','Full scope estimated time','Maintenance frequency','Full scope service price','Potential repair examples','Everyday benefit']];
  MONTHS.forEach((name,m)=>year[m].forEach(e=>{const t=TASKS.get(e.task);rows.push([name,t.name,e.minutes,e.part,e.parts,t.sourceTime,t.frequency,t.service,t.repairs,t.benefit]);}));
  const csv=rows.map(row=>row.map(cell=>'"'+String(cell).replaceAll('"','""')+'"').join(',')).join('\r\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='my-surfside-sample-year.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  notify('Your sample plan has been downloaded.');
}
function miniature(id) {
  const months=calendar();const filled=months.map((mo,m)=>Math.max(.18,monthTotal(m)/120));
  if(id==='calendar')return `<svg viewBox="0 0 270 135" aria-hidden="true">${MONTHS.map((_,m)=>{const x=(m%4)*67,y=Math.floor(m/4)*44;return `<rect x="${x}" y="${y}" width="59" height="36" rx="4" fill="#fffefa"/><rect x="${x+7}" y="${y+9}" width="${39*filled[m]}" height="4" rx="2" fill="currentColor"/><path d="M${x+7} ${y+20}h38m-38 7h25" stroke="#b7cbb5" stroke-width="2"/>`;}).join('')}</svg>`;
  if(id==='seasons')return `<svg viewBox="0 0 270 135" aria-hidden="true">${[0,1,2,3].map(q=>{const x=q%2*138,y=Math.floor(q/2)*70;return `<rect x="${x}" y="${y}" width="129" height="62" rx="5" fill="#fffefa"/><rect x="${x}" y="${y}" width="129" height="18" rx="4" fill="#bacdb3"/>${[0,1,2].map(i=>`<path d="M${x+12} ${y+29+i*11}h10m8 0h${65*filled[q*3+i]}" stroke="currentColor" stroke-width="3"/>`).join('')}`;}).join('')}</svg>`;
  if(id==='time')return `<svg viewBox="0 0 270 135" aria-hidden="true">${MONTHS.map((_,m)=>`<rect x="22" y="${m*11}" width="230" height="6" rx="2" fill="#d3dfcd"/><rect x="22" y="${m*11}" width="${230*filled[m]}" height="6" rx="2" fill="currentColor" opacity="${.5+(m%3)*.2}"/>`).join('')}</svg>`;
  if(id==='book')return `<svg viewBox="0 0 270 135" aria-hidden="true"><rect width="270" height="135" rx="6" fill="#fffefa"/><rect width="75" height="135" rx="6" fill="#cbdac3"/>${Array.from({length:7},(_,i)=>`<rect x="10" y="${9+i*18}" width="55" height="11" rx="3" fill="${i===0?'#146657':'#fffefa'}"/>`).join('')}<path d="M92 18h100m-100 14h58" stroke="currentColor" stroke-width="5"/>${[0,1,2].map(i=>`<rect x="92" y="${48+i*26}" width="160" height="19" rx="3" fill="#e9eedf"/>`).join('')}</svg>`;
  if(id==='wheel')return `<svg viewBox="0 0 270 135" aria-hidden="true"><g transform="translate(11,-6) scale(.33)">${MONTHS.map((_,m)=>`<path d="${ringPath(m*30,m*30+30)}" fill="${m===0?'#146657':'#b9cdb2'}" stroke="#fffefa" stroke-width="5"/>`).join('')}</g><path d="M175 26h70m-70 18h40m-40 25h70m-70 17h55m-55 20h62" stroke="currentColor" stroke-width="5"/></svg>`;
  return `<svg viewBox="0 0 270 135" aria-hidden="true"><path d="M24 9v120" stroke="#a6bca0"/>${[0,1,2].map(i=>`<circle cx="24" cy="${16+i*47}" r="10" fill="#fffefa"/><rect x="48" y="${5+i*47}" width="158" height="7" rx="2" fill="currentColor"/><path d="M48 ${24+i*47}h145m-145 8h110" stroke="#a6bca0" stroke-width="3"/><rect x="230" y="${8+i*47}" width="30" height="28" rx="12" fill="#fffefa"/>`).join('')}</svg>`;
}
function compare() {
  document.querySelector('#compare-grid').innerHTML=DESIGNS.map((d,i)=>`<article class="compare-card ${state.design===d.id?'selected':''}"><div class="mini-preview">${miniature(d.id)}</div><div class="compare-card-copy"><span class="compare-number">${PLANS[state.plan].label.toUpperCase()} / ${String(i+1).padStart(2,'0')}</span><h3>${d.name}</h3><p>${d.description}</p><button type="button" class="small-button" data-pick-design="${d.id}">Open this direction ↗</button></div></article>`).join('');
  document.querySelector('#compare-dialog').showModal();
}
document.addEventListener('click',event=>{
  const button=event.target.closest('button, g[data-month]');if(!button)return;
  if(button.hasAttribute('data-close')){button.closest('dialog').close();return;}
  if(button.dataset.plan){state.plan=button.dataset.plan;state.month=0;render();document.querySelector(`[data-plan="${state.plan}"]`).focus({preventScroll:true});return;}
  if(button.dataset.design){state.design=button.dataset.design;render();document.querySelector(`[data-design="${state.design}"]`).focus({preventScroll:true});return;}
  if(button.dataset.month!==undefined){state.month=Number(button.dataset.month);render();return;}
  if(button.dataset.detail){showDetail(button.dataset.detail,button.dataset.entry);return;}
  if(button.dataset.load){loadPreset(button.dataset.load);return;}
  if(button.dataset.add){addService(button.dataset.add);return;}
  if(button.dataset.remove){state.custom=state.custom.map(m=>m.filter(e=>e.job!==button.dataset.remove));save();render();notify('Service and all its portions removed.');return;}
  if(button.dataset.targetMonth!==undefined){state.month=Number(button.dataset.targetMonth);render();document.querySelector('#task-library').scrollIntoView({behavior:'smooth',block:'start'});document.querySelector('#task-search').focus({preventScroll:true});return;}
  if(button.hasAttribute('data-clear')){state.custom=emptyYear();save();render();notify('Your year is clear. Choose a task or start with a sample.');return;}
  if(button.hasAttribute('data-download')){downloadPlan();return;}
  if(button.hasAttribute('data-favorite')){state.favorites[state.plan]=state.favorites[state.plan]===state.design?null:state.design;save();render();notify(state.favorites[state.plan]?'Design direction marked for this infographic.':'Design mark removed.');return;}
  if(button.id==='compare-button'){compare();return;}
  if(button.dataset.pickDesign){state.design=button.dataset.pickDesign;document.querySelector('#compare-dialog').close();render();document.querySelector('#study').focus({preventScroll:true});}
});
document.addEventListener('change',event=>{
  if(event.target.id==='target-month'){state.month=Number(event.target.value);render();}
  if(event.target.id==='task-filter'){state.filter=event.target.value;renderLibrary(true);}
});
document.addEventListener('input',event=>{if(event.target.id==='task-search'){state.search=event.target.value;renderLibrary(true);}});
document.addEventListener('keydown',event=>{
  if(event.target.matches('g[data-month]')&&['Enter',' '].includes(event.key)){event.preventDefault();event.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}
  const tab=event.target.closest('[role="tab"]');
  if(tab&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
    event.preventDefault();const tabs=[...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
    const current=tabs.indexOf(tab),next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(current+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    tabs[next].click();
  }
});
render();
