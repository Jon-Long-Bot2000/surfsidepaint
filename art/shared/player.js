// Each instance owns its controls, clock, observers, and event listeners.
export function mountPlayer(root, { duration, stages, poseAt, stageAt, draw }) {
  const canvas = root.querySelector('canvas');
  const playButton = root.querySelector('[data-action="play"]');
  const restartButton = root.querySelector('[data-action="restart"]');
  const timeline = root.querySelector('[data-role="timeline"]');
  const speedSelect = root.querySelector('[data-role="speed"]');
  const status = root.querySelector('[data-role="status"]');
  const controls = root.querySelector('[data-role="controls"]');
  const stageButtons = [...root.querySelectorAll('[data-stage]')];
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const events = new AbortController();
  const listen = (target, type, handler) => target.addEventListener(type, handler, { signal: events.signal });
  let playing = !motionPreference.matches;
  let inView = true;
  let destroyed = false;
  let time = 0;
  let speed = 1;
  let lastTimestamp = null;
  let frame = null;
  let activeStage = -1;
  let width = 1200;
  let height = 600;

  function updateControls() {
    const { index, name } = stageAt(time);
    if (index !== activeStage || status.textContent !== name) {
      activeStage = index;
      status.textContent = name;
      stageButtons.forEach((button, i) => {
        if (i === index) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
    }
    timeline.value = String(time);
    timeline.setAttribute('aria-valuetext', `${name}, ${time.toFixed(1)} of ${duration} seconds`);
    playButton.textContent = playing ? 'Pause' : 'Play';
  }

  function render() {
    draw({ time, pose: poseAt(time), width, height });
    updateControls();
  }

  function tick(timestamp) {
    frame = null;
    if (destroyed || !playing || document.hidden || !inView) { lastTimestamp = null; return; }
    if (lastTimestamp !== null) time = (time + Math.min((timestamp - lastTimestamp) / 1000, 0.1) * speed) % duration;
    lastTimestamp = timestamp;
    render();
    schedule();
  }

  function schedule() {
    if (!destroyed && playing && !document.hidden && inView && frame === null) frame = requestAnimationFrame(tick);
  }

  function cancelFrame() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    lastTimestamp = null;
  }

  function setPlaying(value) {
    if (destroyed) return;
    playing = value;
    cancelFrame();
    updateControls();
    schedule();
  }

  function seek(value) {
    if (destroyed) return;
    setPlaying(false);
    time = Math.max(0, Math.min(duration, value));
    render();
  }

  listen(playButton, 'click', () => setPlaying(!playing));
  listen(restartButton, 'click', () => {
    time = 0;
    render();
    setPlaying(!motionPreference.matches);
  });
  listen(timeline, 'input', () => seek(Number(timeline.value)));
  listen(speedSelect, 'change', () => { speed = Number(speedSelect.value); });
  stageButtons.forEach((button, i) => listen(button, 'click', () => seek(stages[i].inspect)));
  listen(motionPreference, 'change', () => { if (motionPreference.matches) setPlaying(false); });
  listen(document, 'visibilitychange', () => { cancelFrame(); schedule(); });
  listen(window, 'pagehide', cancelFrame);
  listen(window, 'pageshow', schedule);

  const intersection = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    cancelFrame();
    schedule();
  });
  intersection.observe(canvas);

  const resize = new ResizeObserver(() => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    width = rect.width;
    height = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    render();
  });
  resize.observe(canvas);

  timeline.max = String(duration);
  controls.hidden = false;
  render();
  schedule();

  return {
    seek,
    pause: () => setPlaying(false),
    destroy() {
      destroyed = true;
      playing = false;
      cancelFrame();
      events.abort();
      intersection.disconnect();
      resize.disconnect();
      controls.hidden = true;
    },
  };
}
