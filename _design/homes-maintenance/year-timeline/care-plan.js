(() => {
  const tasks = [
    ['January', 'Check for moisture', 'Spot damp patches and water entry after storms.', 'After severe storms, look for new ceiling stains, damp walls, pooling and signs of water entering around doors and windows.', 'This is triggered by weather, in any month. Investigate active leaks promptly rather than waiting for a scheduled visit.'],
    ['February', 'Inspect decks & patios', 'Check railings, surfaces and steps before spring.', 'Review accessible deck boards, railings, steps and patio surfaces for looseness, deterioration and trip hazards.', 'Start with a condition check. Repairs and replacement work depend on the findings and are planned separately.'],
    ['March', 'Replace air filters', 'Refresh suitable filters for spring.', 'Check HVAC filters for dust and buildup. Replace disposable filters with the correct size and equipment-approved rating.', 'Spring is a useful reminder; filter changes also follow the equipment instructions, actual condition and household needs throughout the year.'],
    ['April', 'Refresh weatherstripping', 'Close worn gaps before warmer days.', 'Inspect door and window seals for gaps, brittleness and drafts. Replace worn accessible weatherstripping where needed.', 'Match the seal to the door or window. Check operation after installation and keep drainage openings clear.'],
    ['May', 'Check irrigation', 'Find leaks and adjust watering for the heat.', 'Run irrigation zones to check for leaks, broken heads, overspray and uneven coverage. Adjust watering for seasonal conditions.', 'This is a seasonal planning reminder. Continue checking during use and follow current local watering rules.'],
    ['June', 'Clear surrounding vegetation', 'Trim growth and remove dry perimeter debris.', 'Review vegetation near the home, trim appropriate growth and clear accumulated dry leaves and debris.', 'Scope depends on the property. Maintain defensible space year-round and follow local fire guidance and restrictions on equipment use.'],
    ['July', 'Pressure wash & touch up paint', 'Clean suitable surfaces and refresh worn spots.', 'Assess surface condition, choose an appropriate cleaning method and identify small areas of exterior paint that need attention.', 'Washing, drying, preparation and painting may need separate visits. Follow finish instructions and suitable weather conditions.'],
    ['August', 'Service water heater', 'Plan flushing and an equipment condition check.', 'Review the water heater’s condition and manufacturer-recommended maintenance, including flushing and anode inspection where appropriate.', 'August is the sample plan’s service month. Equipment type, access and condition determine the actual procedure and service scope.'],
    ['September', 'Service your HVAC', 'Get heating ready for cooler nights.', 'Schedule an appropriate heating-system inspection and service before colder weather arrives.', 'A qualified HVAC professional handles equipment servicing. Cooling-system maintenance has its own pre-season schedule.'],
    ['October', 'Clean gutters & drains', 'Clear the path for rainy-season runoff.', 'Remove accessible debris and check gutters, downspouts, drain inlets and discharge routes before seasonal rains.', 'Access, height and debris affect the scope. Recheck after heavy leaf fall or storms and address drainage faults as they appear.'],
    ['November', 'Clean appliances', 'Refresh the kitchen before holiday hosting.', 'Choose kitchen priorities such as range-hood filters, accessible refrigerator coils and dishwasher filters.', 'Follow each appliance manual. Some components require more frequent care, and some condensers require no cleaning.'],
    ['December', 'Annual home inspection', 'Review the year and plan what comes next.', 'Review your home’s condition, completed maintenance and outstanding priorities to shape the next year’s plan.', 'December is the sample plan’s chosen review month. A Home Health Inspection is a separate service, not included in the monthly subscription.']
  ];
  const months = document.querySelector('.care-months');
  const connectors = document.querySelector('.care-connectors');
  const currentMonth = Number(new Intl.DateTimeFormat('en-US', { month: 'numeric', timeZone: 'America/Los_Angeles' }).format(new Date())) - 1;
  const dialog = document.querySelector('.care-detail');
  tasks.forEach(([month, title, short], index) => {
    const li = document.createElement('li');
    li.className = 'care-month' + (index === currentMonth ? ' is-current' : '');
    const mark = document.createElement('span'); mark.className = 'month-mark'; mark.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span'); label.className = 'month-name'; label.textContent = month.slice(0, 3).toUpperCase();
    if (index === currentMonth) { label.setAttribute('aria-current', 'date'); const note = document.createElement('span'); note.className = 'current-note'; note.textContent = 'THIS MONTH'; li.append(note); }
    const button = document.createElement('button'); button.type = 'button'; button.className = 'care-card'; button.setAttribute('aria-label', `${month}: ${title}. View details`); button.setAttribute('aria-haspopup', 'dialog');
    const heading = document.createElement('strong'); heading.textContent = title;
    const desc = document.createElement('span'); desc.className = 'card-description'; desc.textContent = short;
    const more = document.createElement('span'); more.className = 'card-more'; more.textContent = '↗'; more.setAttribute('aria-hidden', 'true');
    button.append(heading, desc, more); button.addEventListener('click', () => openTask(index));
    li.append(mark, label, button); months.append(li);
    const x = index * 100 + 50;
    const center = Math.floor(index / 2) * 200 + 100;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', index % 2 === 0 ? `M${center} 196 C${center} 218 ${x} 219 ${x} 239` : `M${center} 304 C${center} 292 ${x} 303 ${x} 294`);
    connectors.append(path);
  });
  function openTask(index) {
    const [month, title, , description, scope] = tasks[index];
    dialog.querySelector('.detail-month').textContent = month;
    dialog.querySelector('h2').textContent = title;
    dialog.querySelector('.detail-description').textContent = description;
    dialog.querySelector('.detail-scope p').textContent = scope;
    dialog.showModal();
  }
  dialog.querySelector('.detail-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.detail-done').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
})();
