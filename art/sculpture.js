// Buildless canvas study. Geometry and timings are intentionally kept here for refinement.
const DURATION = 20;
const STAGES = [
  { name: 'Resting', start: 0, inspect: 0 },
  { name: 'Water input', start: 2.5, inspect: 4.5 },
  { name: 'Activated', start: 6, inspect: 7.8 },
  { name: 'Open', start: 9.5, inspect: 10.5 },
  { name: 'Return to rest', start: 13.5, inspect: 16.3 },
];
const MODEL = { slats: 16, radius: 73, length: 270, handle: 70, width: 23, opening: 0.80 };
const canvas = document.querySelector('#sculpture-canvas');
const ctx = canvas.getContext('2d');

if (ctx) startStudy();

function startStudy() {
  const playButton = document.querySelector('#sculpture-play');
  const restartButton = document.querySelector('#sculpture-restart');
  const timeline = document.querySelector('#sculpture-timeline');
  const speedSelect = document.querySelector('#sculpture-speed');
  const status = document.querySelector('#sculpture-status');
  const stageButtons = [...document.querySelectorAll('[data-stage]')];
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  let playing = !motionPreference.matches;
  let inView = true;
  let time = 0;
  let speed = 1;
  let lastTimestamp = null;
  let frame = null;
  let activeStage = -1;
  let viewWidth = 1200;
  let viewHeight = 600;

  // Projection from a slightly elevated, fixed camera. Positive z is nearer the viewer.
  const project = ([x, y, z]) => [600 + x, 150 + y * 0.96 + z * 0.29];
  const smooth = (value) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  const ramp = (t, from, to) => smooth((t - from) / (to - from));

  function path(points, fill, stroke, lineWidth = 1) {
    ctx.beginPath();
    points.forEach((point, index) => {
      const [x, y] = project(point);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    if (fill) { ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }

  function ellipse3d(radius, y, fill, stroke, lineWidth = 1, centerX = 0, centerZ = 0) {
    const points = Array.from({ length: 65 }, (_, i) => {
      const a = i / 64 * Math.PI * 2;
      return [centerX + Math.cos(a) * radius, y, centerZ + Math.sin(a) * radius];
    });
    path(points, fill, stroke, lineWidth);
  }

  function slatPoint(angle, tilt, distance, across = 0, thickness = 0) {
    const radius = MODEL.radius + Math.sin(tilt) * distance + Math.cos(tilt) * thickness;
    return [
      Math.cos(angle) * radius - Math.sin(angle) * across,
      Math.cos(tilt) * distance - Math.sin(tilt) * thickness,
      Math.sin(angle) * radius + Math.cos(angle) * across,
    ];
  }

  function drawSlat(angle, tilt, index) {
    const at = (distance, across = 0, thickness = 0) => slatPoint(angle, tilt, distance, across, thickness);
    // Narrow handles and shoulders echo the paint-stirrer profile in the prototype.
    const profile = [
      [-MODEL.handle, -5], [-MODEL.handle + 3, -7], [-36, -7], [-20, -MODEL.width / 2],
      [MODEL.length, -MODEL.width / 2], [MODEL.length, MODEL.width / 2],
      [-20, MODEL.width / 2], [-36, 7], [-MODEL.handle + 3, 7], [-MODEL.handle, 5],
    ];
    const light = 0.5 + 0.5 * Math.cos(angle + 0.7);
    const variation = (index % 3) * 2;
    const color = `rgb(${211 + light * 26 + variation}, ${201 + light * 26 + variation}, ${178 + light * 25 + variation})`;
    path([
      at(-20, MODEL.width / 2), at(MODEL.length, MODEL.width / 2),
      at(MODEL.length, MODEL.width / 2, -3), at(-20, MODEL.width / 2, -3),
    ], '#ab9e82', '#aa9c80', 0.5);
    path(profile.map(([along, across]) => at(along, across)), color, '#a99b7b', 0.65);

    // Fine, deterministic grain stays attached to each board throughout the motion.
    for (let grain = 0; grain < 4; grain++) {
      const offset = -8 + grain * 5 + (index % 2);
      path([at(-14, offset), at(70, offset + 0.6), at(175, offset - 0.4), at(267, offset + 0.3)], null, '#94805c22', 0.55);
    }
    path([at(-35, -6), at(-19, -10), at(268, -10)], null, '#fff9e295', 0.8);
    for (const along of [0, 113]) {
      const [x, y] = project(at(along, 0, 1));
      ctx.beginPath();
      ctx.ellipse(x + 0.7, y + 0.8, 2.8, 3.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#7e7258'; ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x, y, 2.1, 2.7, 0, 0, Math.PI * 2);
      ctx.fillStyle = along === 0 ? '#e9e6d9' : '#b1a07c'; ctx.fill();
    }
  }

  function drawBowl(y, water, t) {
    const [x, rim] = project([0, y, 0]);
    const radius = 61;
    const gradient = ctx.createLinearGradient(x - radius, rim, x + radius, rim + 50);
    gradient.addColorStop(0, '#d6d8d4');
    gradient.addColorStop(0.42, '#fcfcf6');
    gradient.addColorStop(1, '#b1b8b3');
    ctx.beginPath();
    ctx.moveTo(x - radius, rim);
    ctx.bezierCurveTo(x - 59, rim + 36, x - 25, rim + 54, x, rim + 54);
    ctx.bezierCurveTo(x + 25, rim + 54, x + 59, rim + 36, x + radius, rim);
    ctx.fillStyle = gradient; ctx.fill(); ctx.strokeStyle = '#a7afa8'; ctx.lineWidth = 1; ctx.stroke();
    ellipse3d(radius, y, '#b5c2bc', '#f9faf4', 3);
    ellipse3d(radius - 5, y + 1, '#85958a', '#9ca9a0', 1);
    if (water > 0.01) {
      const waterRadius = 33 + water * 22;
      ellipse3d(waterRadius, y + 9 - water * 7, `rgba(90, 165, 182, ${0.35 + water * 0.45})`, '#a9dce2', 0.8);
      for (let i = 0; i < 3; i++) {
        const ripple = (t * 0.65 + i / 3) % 1;
        ellipse3d(8 + ripple * (waterRadius - 10), y + 8 - water * 7, null, `rgba(226, 251, 249, ${(1 - ripple) * 0.6})`, 0.7);
      }
    }
    // A front lip gives the white bowl depth without hiding its water surface.
    const front = Array.from({ length: 33 }, (_, i) => {
      const a = i / 32 * Math.PI;
      return [Math.cos(a) * radius, y, Math.sin(a) * radius];
    });
    path(front, null, '#f6f7ef', 3.5);
  }

  function drawPour(opacity, t, bowlY) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity;
    // The blue bottle is a simple visual cue for the hand-poured input in the video.
    ctx.save(); ctx.translate(740, 64); ctx.rotate(-0.38);
    const bottle = ctx.createLinearGradient(0, -20, 0, 37);
    bottle.addColorStop(0, '#2a718b'); bottle.addColorStop(0.45, '#65b6c6'); bottle.addColorStop(1, '#286d82');
    ctx.beginPath();
    ctx.moveTo(-5, -13); ctx.lineTo(20, -13); ctx.quadraticCurveTo(30, -35, 47, -35);
    ctx.lineTo(119, -35); ctx.quadraticCurveTo(130, -35, 130, -23);
    ctx.lineTo(130, 23); ctx.quadraticCurveTo(130, 35, 119, 35);
    ctx.lineTo(47, 35); ctx.quadraticCurveTo(30, 35, 20, 13); ctx.lineTo(-5, 13); ctx.closePath();
    ctx.fillStyle = bottle; ctx.fill(); ctx.strokeStyle = '#2d7385'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#c17c53'; ctx.fillRect(6, -15, 5, 30);
    ctx.beginPath(); ctx.moveTo(45, -25); ctx.lineTo(116, -25); ctx.strokeStyle = '#c1ebeb88'; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
    const [, targetY] = project([0, bowlY, 0]);
    const sway = Math.sin(t * 8) * 2;
    for (const [width, color] of [[7, '#64a8b866'], [3.5, '#acd9e1bb'], [1.2, '#ffffffdd']]) {
      ctx.beginPath(); ctx.moveTo(733, 68);
      ctx.bezierCurveTo(679, 101, 612 + sway, 196, 602 + sway, targetY);
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
    }
    for (let i = 0; i < 7; i++) {
      const age = (t * 1.8 + i / 7) % 1;
      ctx.beginPath();
      ctx.ellipse(600 + Math.sin(i * 3.1) * age * 20, targetY - Math.sin(age * Math.PI) * 14, 1.2, 2, i, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(120, 184, 200, ${1 - age})`; ctx.fill();
    }
    ctx.restore();
  }

  function render() {
    const opening = ramp(time, 6, 9.5) * (1 - ramp(time, 13.5, 18.5));
    const water = ramp(time, 2.8, 6.5) * (1 - ramp(time, 11.5, 18));
    const pour = ramp(time, 2.5, 3) * (1 - ramp(time, 6.8, 7.5));
    const tilt = 0.035 + opening * MODEL.opening;
    const bowlY = 195 + opening * 31;
    const boards = Array.from({ length: MODEL.slats }, (_, i) => {
      const angle = i / MODEL.slats * Math.PI * 2 + 0.12;
      return { angle, index: i, depth: Math.sin(angle) };
    }).sort((a, b) => a.depth - b.depth);

    ctx.setTransform(canvas.width / viewWidth, 0, 0, canvas.height / viewHeight, 0, 0);
    ctx.clearRect(0, 0, viewWidth, viewHeight);
    // Fit the same model to a square phone canvas, keeping all of the open slats visible.
    const scale = Math.min(viewWidth / 790, viewHeight / 600);
    ctx.translate(viewWidth / 2, viewHeight / 2);
    ctx.scale(scale, scale);
    ctx.translate(-600, -300);

    const backdrop = ctx.createRadialGradient(560, 260, 20, 600, 300, 560);
    backdrop.addColorStop(0, '#ffffff'); backdrop.addColorStop(1, '#eef2ed');
    ctx.fillStyle = backdrop; ctx.fillRect(-1200, -1200, 3600, 3000);
    const shadow = ctx.createRadialGradient(605, 557, 8, 605, 557, 185 + opening * 55);
    shadow.addColorStop(0, '#4c584326'); shadow.addColorStop(1, '#4c584300');
    ctx.save(); ctx.translate(0, 429); ctx.scale(1, 0.23);
    ctx.fillStyle = shadow; ctx.fillRect(260, 250, 700, 600); ctx.restore();

    // Stand, splayed feet, and the small fixed pivot ring.
    path([[0, 408, 0], [-73, 421, 35]], null, '#666452', 4);
    path([[0, 408, 0], [64, 421, 46]], null, '#585849', 4);
    path([[0, 408, 0], [4, 421, -73]], null, '#777563', 3);
    path([[0, -5, 0], [0, 416, 0]], null, '#5d5c4c', 5);
    path([[-1, -5, -1], [-1, 414, -1]], null, '#a8a18b', 1.1);
    ellipse3d(MODEL.radius, 0, null, '#8d8e78', 2);

    boards.filter(board => board.depth < 0).forEach(board => drawSlat(board.angle, tilt, board.index));
    // Jute links from the upper handles to the hanging bowl.
    for (const board of boards) {
      const from = slatPoint(board.angle, tilt, -58);
      const to = [Math.cos(board.angle) * 54, bowlY, Math.sin(board.angle) * 54];
      path([from, to], null, board.depth < 0 ? '#9f90705a' : '#a18c68aa', 0.85);
    }
    drawBowl(bowlY, water, time);
    drawPour(pour, time, bowlY);
    boards.filter(board => board.depth >= 0).forEach(board => drawSlat(board.angle, tilt, board.index));
    // A few falling drops suggest the release of water during the reset study.
    if (time > 12 && time < 18) {
      ctx.save(); ctx.globalAlpha = Math.sin((time - 12) / 6 * Math.PI) * 0.6;
      for (let i = 0; i < 6; i++) {
        const age = (time * 0.7 + i / 6) % 1;
        const [x, y] = project([4 + Math.sin(i * 9) * 4, bowlY + 58 + age * (355 - bowlY), 8]);
        ctx.beginPath(); ctx.ellipse(x, y, 1.1, 2.6, 0, 0, Math.PI * 2); ctx.fillStyle = '#7aa6af'; ctx.fill();
      }
      ctx.restore();
    }
    updateControls();
  }

  function updateControls() {
    const index = Math.max(0, STAGES.findLastIndex(stage => time >= stage.start));
    const name = index === 4 && time >= 18.5 ? 'Resting' : STAGES[index].name;
    if (index !== activeStage || status.textContent !== name) {
      activeStage = index;
      status.textContent = name;
      stageButtons.forEach((button, i) => {
        if (i === index) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
    }
    timeline.value = String(time);
    timeline.setAttribute('aria-valuetext', `${name}, ${time.toFixed(1)} of ${DURATION} seconds`);
    playButton.textContent = playing ? 'Pause' : 'Play';
  }

  function tick(timestamp) {
    frame = null;
    if (!playing || document.hidden || !inView) { lastTimestamp = null; return; }
    if (lastTimestamp !== null) time = (time + Math.min((timestamp - lastTimestamp) / 1000, 0.1) * speed) % DURATION;
    lastTimestamp = timestamp;
    render();
    schedule();
  }

  function schedule() {
    if (playing && !document.hidden && inView && frame === null) frame = requestAnimationFrame(tick);
  }

  function setPlaying(value) {
    playing = value;
    lastTimestamp = null;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    updateControls();
    schedule();
  }

  function seek(value) {
    setPlaying(false);
    time = Math.max(0, Math.min(DURATION, value));
    render();
  }

  playButton.addEventListener('click', () => setPlaying(!playing));
  restartButton.addEventListener('click', () => {
    time = 0;
    render();
    setPlaying(!motionPreference.matches);
  });
  timeline.addEventListener('input', () => seek(Number(timeline.value)));
  speedSelect.addEventListener('change', () => { speed = Number(speedSelect.value); });
  stageButtons.forEach((button, i) => button.addEventListener('click', () => seek(STAGES[i].inspect)));
  motionPreference.addEventListener('change', () => { if (motionPreference.matches) setPlaying(false); });
  document.addEventListener('visibilitychange', () => { lastTimestamp = null; schedule(); });
  window.addEventListener('pagehide', () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null; lastTimestamp = null;
  });
  window.addEventListener('pageshow', schedule);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    lastTimestamp = null;
    schedule();
  }).observe(canvas);

  new ResizeObserver(() => {
    const rect = canvas.getBoundingClientRect();
    viewWidth = rect.width;
    viewHeight = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    render();
  }).observe(canvas);

  document.querySelector('#sculpture-controls').hidden = false;
  render();
  schedule();
}
