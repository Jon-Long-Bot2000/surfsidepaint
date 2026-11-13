(async () => {
  const root = document.querySelector('.homes-calendar-animation');
  if (!root) return;
  const response = await fetch('/homes/calendar-animation-data.json');
  if (!response.ok) return;
  const data = await response.json();
  const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const stage = root.querySelector('.homes-calendar-stage');
  const world = root.querySelector('.homes-calendar-world');
  const focus = root.querySelector('.homes-calendar-focus');
  const grid = root.querySelector('.homes-calendar-task-grid');
  root.classList.add('is-populated');
  root.querySelector('.homes-calendar-controls').hidden = true;
  function tile(task) {
    const article = document.createElement('article'); article.className = 'homes-todo-card';
    const figure = document.createElement('figure'); const img = document.createElement('img'); img.src = task.image; img.alt = task.alt; img.referrerPolicy = 'no-referrer'; img.decoding = 'async'; figure.append(img);
    const copy = document.createElement('div'); copy.className = 'homes-todo-copy';
    const title = document.createElement('h3'); title.textContent = task.displayTitle; copy.append(title);
    if (task.note) { const note = document.createElement('span'); note.className = 'homes-calendar-task-note'; note.textContent = task.note; copy.append(note); }
    const description = document.createElement('p'); description.textContent = task.description; copy.append(description);
    const meta = document.createElement('div'); meta.className = 'homes-todo-frequency';
    for (const [label,value] of [['Frequency',task.frequency],['Estimated time',task.estimatedTime]]) {
      const l = document.createElement('span'); l.textContent = label; const v = document.createElement('strong'); v.textContent = value; meta.append(l,v);
    }
    copy.append(meta); article.append(figure,copy); return article;
  }

  let selected;
  function closeMonth() {
    focus.hidden = true;
    root.classList.remove('is-focused', 'is-manual');
    selected?.focus();
  }
  world.querySelectorAll('svg > g[transform]').forEach((group, month) => {
    group.setAttribute('data-calendar-month', String(month));
    group.setAttribute('role', 'button'); group.setAttribute('tabindex', '0');
    group.setAttribute('aria-label', `${names[month]}: view scheduled tasks`);
    function open() {
      selected = group;
      root.querySelector('.homes-calendar-month').textContent = names[month];
      grid.replaceChildren(...data[month].map(tile));
      root.classList.add('is-focused', 'is-manual'); focus.hidden = false;
      root.querySelector('.homes-calendar-close').focus();
    }
    group.addEventListener('click', open);
    group.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
  });
  root.querySelector('.homes-calendar-close').addEventListener('click', closeMonth);
  focus.addEventListener('click', event => { if (event.target === focus) closeMonth(); });
  root.addEventListener('keydown', event => { if (event.key === 'Escape' && !focus.hidden) closeMonth(); });
  const scrim = document.createElement('button');
  scrim.type = 'button'; scrim.className = 'homes-calendar-scrim';
  const label = document.createElement('span'); label.textContent = 'Tap any month to view scheduled tasks!'; scrim.append(label);
  stage.append(scrim);
  world.inert = true;
  scrim.addEventListener('click', () => { scrim.remove(); world.inert = false; world.querySelector('[data-calendar-month]')?.focus({ preventScroll: true }); });
})().catch(() => {});
