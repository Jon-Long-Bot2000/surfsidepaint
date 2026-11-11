const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const seasons = [{name:'Winter',months:[11,0,1]},{name:'Spring',months:[2,3,4]},{name:'Summer',months:[5,6,7]},{name:'Fall',months:[8,9,10]}];
// Illustrative labor estimates for a single-story, 2,500 sq. ft. residence.
const tasks = [
  {id:'inspection',name:'Annual home inspection',short:'Home inspection',zone:'Whole home',icon:'home',detail:'Walk-through, visible-condition review, and a prioritized care checklist.',visits:[{m:0,h:2}]},
  {id:'filters',name:'Replace air filters',short:'Air filters',zone:'Comfort & safety',icon:'air',detail:'Replace accessible HVAC filters twice a year.',visits:[{m:1,h:.5},{m:7,h:.5}]},
  {id:'appliances',name:'Clean household appliances',short:'Appliance cleaning',zone:'Inside the home',icon:'appliance',detail:'Twice-yearly accessible appliance cleaning; scope agreed for your home.',visits:[{m:1,h:1.5},{m:7,h:1.5}]},
  {id:'alarms',name:'Check smoke & CO alarms',short:'Smoke & CO alarms',zone:'Comfort & safety',icon:'shield',detail:'Test accessible alarms, check dates, and replace batteries as needed.',visits:[{m:2,h:.5}]},
  {id:'leaks',name:'Check for plumbing leaks',short:'Plumbing leak check',zone:'Inside the home',icon:'drop',detail:'Check visible connections, under-sink areas, and accessible fixtures.',visits:[{m:2,h:1.5}]},
  {id:'pressure',name:'Pressure-wash entry & paths',short:'Entry & path washing',zone:'Outside the home',icon:'water',detail:'Post-spring cleaning of the entry and selected exterior hardscape.',visits:[{m:3,h:2}]},
  {id:'touchups',name:'Touch up exterior paint',short:'Exterior paint touch-ups',zone:'Outside the home',icon:'paint',detail:'Targeted touch-ups of minor wear with suitable matching paint.',visits:[{m:4,h:2}]},
  {id:'vents',name:'Clean accessible exhaust vents',short:'Exhaust vent cleaning',zone:'Inside the home',icon:'air',detail:'Clean accessible bathroom fan covers and exterior vent openings.',visits:[{m:5,h:1}]},
  {id:'hardware',name:'Adjust doors & cabinet hardware',short:'Doors & cabinet hardware',zone:'Inside the home',icon:'tool',detail:'Check operation, tighten loose hardware, and make minor adjustments.',visits:[{m:5,h:1}]},
  {id:'irrigation',name:'Check outdoor irrigation',short:'Irrigation check',zone:'Outside the home',icon:'water',detail:'Check accessible heads, visible leaks, and seasonal timer settings.',visits:[{m:6,h:2}]},
  {id:'gutters',name:'Clean gutters & downspouts',short:'Gutter cleaning',zone:'Outside the home',icon:'gutter',detail:'Pre-rainy-season debris removal from accessible single-story gutters.',visits:[{m:8,h:2}]},
  {id:'connections',name:'Check gutter connections',short:'Gutter connection check',zone:'Outside the home',icon:'gutter',detail:'Check accessible joints, drainage, and downspout connections before rain.',visits:[{m:9,h:.5}]},
  {id:'seals',name:'Check door & window weather seals',short:'Weather seals',zone:'Comfort & safety',icon:'window',detail:'Review seals and make minor weatherstripping adjustments before rain.',visits:[{m:9,h:1.5}]},
  {id:'chimney',name:'Annual chimney condition report',short:'Chimney report',zone:'Comfort & safety',icon:'home',detail:'Visual condition review and report; specialist work or sweeping is separately scoped.',visits:[{m:10,h:2}]},
  {id:'moisture',name:'Inspect for moisture after rain',short:'After-rain moisture check',zone:'Whole home',icon:'drop',detail:'Check accessible areas after the first substantial rain; actual month may shift.',visits:[{m:11,h:2}]}
];
const studies = [
  {id:'s1',name:'The living timeline',label:'Split picker',className:'split',description:'The direct approach: tasks on the left, a live twelve-month timeline on the right.',headline:'Small tasks. A whole year of care.'},
  {id:'s2',name:'A season at a time',label:'Seasonal planner',className:'seasonal',description:'Four seasonal chapters make a full year easier to browse without losing the annual view.',headline:'The right care, in the right season.'},
  {id:'s3',name:'The monthly appointment book',label:'Month explorer',className:'monthbook',description:'Pick a month on the right. Its scheduled work and available tasks appear on the left.',headline:'See what two hours can look like.'},
  {id:'s4',name:'The service-hour ledger',label:'Hours first',className:'ledger',description:'A clear monthly balance sheet connects each selected task to its estimated service hours.',headline:'A plan you can account for.'},
  {id:'s5',name:'The home care board',label:'Visual task cards',className:'visual',description:'Small illustrated task tiles make the work recognizable; the right-hand calendar collects your choices.',headline:'A little care, all around your home.'},
  {id:'s6',name:'The organized year',label:'Room-to-year planner',className:'accordion',description:'Browse tasks by part of the home, then open monthly folders to see the resulting schedule.',headline:'Every part of home. One clear plan.'}
];
const states = studies.map(()=>({selected:new Set(tasks.map(t=>t.id)),season:0,month:0,focus:'inspection',open:new Set([0,1,2])}));
let current = Math.max(0,studies.findIndex(s=>s.id===location.hash.slice(1)));
const demo = document.querySelector('#demo');
const hour = n => `${Number(n.toFixed(2))} ${n===1?'hr':'hrs'}`;
const visitTime = n => n===.5?'30 min':n===1.5?'1 hr 30 min':hour(n);
const iconPaths = {
 home:'<path d="m3 10 9-7 9 7v11H3Z"/><path d="M9 21v-7h6v7"/>',
 air:'<path d="M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h6a3 3 0 1 1-3 3"/>',
 appliance:'<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 6h1m3 0h4"/>',
 shield:'<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
 drop:'<path d="M12 3s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
 water:'<path d="m4 19 7-7m-3-3 6 6 3-3-6-6Z"/><path d="m15 4 2-2m1 5 3-1m-3 5h4M3 22h18"/>',
 paint:'<rect x="3" y="4" width="14" height="6" rx="2"/><path d="M17 7h3v7h-9v7M8 21h6"/>',
 tool:'<path d="M15 3a6 6 0 0 0-7 7l-5 7a3 3 0 0 0 4 4l7-7a6 6 0 0 0 7-7l-4 4-4-4Z"/>',
 gutter:'<path d="M3 5h13v8h5v8h-5v-4h-5V9H3ZM3 3v8"/>',
 window:'<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v18M4 12h16m-7-5 3-2"/>'
};
function icon(type){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[type]||iconPaths.home}</svg>`;}
function activeTasks(){return tasks.filter(t=>states[current].selected.has(t.id));}
function monthHours(m){return activeTasks().reduce((sum,t)=>sum+t.visits.filter(v=>v.m===m).reduce((s,v)=>s+v.h,0),0);}
function totalHours(){return months.reduce((sum,_,m)=>sum+monthHours(m),0);}
function timeMeta(t){const per=t.visits[0].h;return `${visitTime(per)}${t.visits.length>1?' × twice yearly':' · yearly'}`;}
function scheduleMeta(t){return t.visits.map(v=>months[v.m].slice(0,3)).join(' + ');}
function meter(){const total=totalHours();const covered=months.filter((_,m)=>monthHours(m)>=2).length;return `<div class="meter-wrap"><div class="meter-title"><strong>${hour(total)} <span>/ 24 hrs per year</span></strong><span class="coverage ${covered===12?'good':''}">${covered} of 12 months<br>meet the 2-hour target</span></div><div class="annual-track" role="progressbar" aria-label="Estimated annual service hours" aria-valuenow="${total}" aria-valuemin="0" aria-valuemax="24">${Array.from({length:24},(_,i)=>`<i class="${i<Math.floor(total)?'filled':''}"${i===Math.floor(total)&&total%1?' style="background:linear-gradient(to right,var(--green) 50%,#e7ece7 50%)"':''}></i>`).join('')}</div><p class="meter-note">${covered===12?'<b>A complete sample year:</b> two estimated hours in every month.':`${hour(24-total)} below the annual target. Explore the calendar to see which months need care.`}</p></div>`;}
function taskCard(t,tile=false){const selected=states[current].selected.has(t.id);return `<button type="button" class="${tile?'tile':'task-card'}" data-task="${t.id}" aria-pressed="${selected}" aria-label="${selected?'Remove':'Add'} ${t.name}, estimated ${timeMeta(t)}, ${scheduleMeta(t)}"><span class="toggle-mark" aria-hidden="true">${selected?'✓':'+'}</span>${tile?`<span class="tile-icon">${icon(t.icon)}</span>`:''}<span class="task-copy"><span class="task-title">${t.name}</span><span class="task-meta">Est. ${timeMeta(t)}</span>${tile?'':`<span class="task-detail">${t.detail}</span>`}<span class="task-meta">${scheduleMeta(t)}</span></span></button>`;}
function entries(m){return activeTasks().flatMap(t=>t.visits.filter(v=>v.m===m).map(v=>`<p class="month-task">${t.short}<small>Est. ${visitTime(v.h)}</small></p>`)).join('')||'<p class="empty-slot">Add a task to this month.</p>';}
function monthHeader(m){return `<div class="month-heading"><strong>${months[m]}</strong><span class="hours-pill">${hour(monthHours(m))} / 2</span></div>`;}
function monthBlock(m){return `<div class="month ${monthHours(m)>=2?'met':''}">${monthHeader(m)}${entries(m)}</div>`;}
function pane(side,title,small,body){return `<div class="pane ${side}-pane"><div class="pane-header"><h3>${title}</h3><small>${small}</small></div><div class="scroll-area" data-scroll="${side}">${body}</div></div>`;}
function filterRow(){if(current!==1)return '';return `<div class="filter-row" aria-label="Choose a season">${seasons.map((s,i)=>`<button type="button" class="filter" data-season="${i}" aria-pressed="${states[current].season===i}">${s.name}</button>`).join('')}</div>`;}
function workspace(){
 const state=states[current];
 if(current===1){const season=seasons[state.season];return pane('task',`${season.name} tasks`,'Tap to add / remove',tasks.filter(t=>t.visits.some(v=>season.months.includes(v.m))).map(t=>taskCard(t)).join(''))+pane('calendar','A year, in seasons','Two hours each month',seasons.map(s=>`<p class="season-heading">${s.name}</p><div class="timeline">${s.months.map(monthBlock).join('')}</div>`).join(''));}
 if(current===2){const m=state.month;return pane('task',`${months[m]} care`,'Choose a month →',`<div class="active-month"><h3>${hour(monthHours(m))} planned</h3><p>Two estimated hours is this month’s target.</p>${entries(m)}</div>${tasks.filter(t=>t.visits.some(v=>v.m===m)).map(t=>taskCard(t)).join('')}`)+pane('calendar','Your appointment book','Tap any month',months.map((_,i)=>`<button type="button" class="month-select" data-month="${i}" aria-pressed="${m===i}"><span>${months[i]}</span><span class="hours-pill">${hour(monthHours(i))}</span></button>`).join(''));}
 if(current===3)return pane('task','Service-hour menu','Estimates per visit',tasks.map(t=>taskCard(t)).join(''))+pane('calendar','Monthly balance','Target: 2 hrs / month',months.map((_,m)=>`<div class="ledger-row">${monthHeader(m)}<div class="mini-progress" aria-hidden="true"><span style="width:${Math.min(100,monthHours(m)/2*100)}%"></span></div>${entries(m)}</div>`).join(''));
 if(current===4)return pane('task','Care around your home','Tap a tile',`<div class="task-grid">${tasks.map(t=>taskCard(t,true)).join('')}</div>`)+pane('calendar','On the calendar','A little, each month',`<div class="timeline">${months.map((_,m)=>monthBlock(m)).join('')}</div>`);
 if(current===5){const zones=['Whole home','Inside the home','Outside the home','Comfort & safety'];return pane('task','By part of your home','Tap to add / remove',zones.map(z=>`<p class="zone-heading">${z}</p>${tasks.filter(t=>t.zone===z).map(t=>taskCard(t)).join('')}`).join(''))+pane('calendar','Your monthly folders','Open to explore',months.map((_,m)=>`<details data-folder="${m}" ${state.open.has(m)?'open':''}><summary><strong>${months[m]}</strong><span class="hours-pill">${hour(monthHours(m))} / 2</span></summary><div class="accordion-content">${entries(m)}</div></details>`).join(''));}
 return pane('task','Pick your care','15 familiar tasks',tasks.map(t=>taskCard(t)).join(''))+pane('calendar','Watch the year take shape','Estimates by month',`<div class="timeline">${months.map((_,m)=>monthBlock(m)).join('')}</div>`);
}
function render(preserve=false){
 const scrolls={};if(preserve)demo.querySelectorAll('[data-scroll]').forEach(el=>scrolls[el.dataset.scroll]=el.scrollTop);
 const study=studies[current];
 document.querySelector('#study-picker').innerHTML=studies.map((s,i)=>`<a class="study-choice" href="#${s.id}" ${current===i?'aria-current="page"':''}><span>0${i+1} · ${s.label}</span>${s.name}</a>`).join('');
 document.querySelector('#study-caption').innerHTML=`<h2>0${current+1} / ${study.name}</h2><p>${study.description}</p>`;
 demo.className=`demo ${study.className}`;
 demo.innerHTML=`<div class="demo-intro"><p class="eyebrow">MAINTENANCE PLANS · SAMPLE YEAR</p><h2>${study.headline}</h2><p>A maintenance plan puts routine tasks on a schedule, so small things get attention before they become bigger problems.</p><div class="residence">${icon('home')}<span>Single-story · 2,500 sq. ft. · Illustrative time estimates</span></div></div>${meter()}${filterRow()}<div class="workspace">${workspace()}</div><div class="demo-footer"><p>Explore this sample. Surfside would tailor your actual plan to your home, priorities, and seasonal needs.</p><div class="reset-actions"><button type="button" class="quiet-button" data-action="clear">Clear tasks</button><button type="button" class="quiet-button primary" data-action="reset">Restore sample</button></div></div><p class="sr-only" role="status" aria-live="polite" id="plan-announcement"></p>`;
 if(preserve)demo.querySelectorAll('[data-scroll]').forEach(el=>el.scrollTop=scrolls[el.dataset.scroll]||0);
 demo.querySelectorAll('details').forEach(el=>el.addEventListener('toggle',()=>{const m=Number(el.dataset.folder);el.open?states[current].open.add(m):states[current].open.delete(m);}));
}
demo.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 const state=states[current];let announcement='';
 if(button.dataset.task){const id=button.dataset.task;const task=tasks.find(t=>t.id===id);state.selected.has(id)?state.selected.delete(id):state.selected.add(id);announcement=`${task.name} ${state.selected.has(id)?'added to':'removed from'} the plan. ${hour(totalHours())} scheduled across the year.`;}
 else if(button.dataset.season!==undefined)state.season=Number(button.dataset.season);
 else if(button.dataset.month!==undefined)state.month=Number(button.dataset.month);
 else if(button.dataset.action==='clear'){state.selected.clear();announcement='All tasks removed. Zero service hours scheduled.';}
 else if(button.dataset.action==='reset'){state.selected=new Set(tasks.map(t=>t.id));announcement='Sample restored. Two service hours each month, 24 hours across the year.';}
 else return;
 const selector=button.dataset.task?`[data-task="${button.dataset.task}"]`:button.dataset.season!==undefined?`[data-season="${button.dataset.season}"]`:button.dataset.month!==undefined?`[data-month="${button.dataset.month}"]`:`[data-action="${button.dataset.action}"]`;
 render(true);demo.querySelector(selector)?.focus({preventScroll:true});if(announcement)document.querySelector('#plan-announcement').textContent=announcement;
});
window.addEventListener('hashchange',()=>{const index=studies.findIndex(s=>s.id===location.hash.slice(1));if(index>=0){current=index;render();}});
render();
