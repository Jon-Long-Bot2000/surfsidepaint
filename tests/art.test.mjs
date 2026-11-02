import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { mountPlayer } from '../art/shared/player.js';
import { DURATION, STAGES, poseAt, stageAt } from '../art/sculptures/austin-rain-prototype/motion.js';
import { createRenderer } from '../art/sculptures/austin-rain-prototype/render.js';
import { MODEL as TWO_STEP_MODEL, channelPoint, conePosition } from '../art/sculptures/two-step-sculpture/model.js';
import { DURATION as TWO_STEP_DURATION, STAGES as TWO_STEP_STAGES, poseAt as twoStepPose, stageAt as twoStepStage } from '../art/sculptures/two-step-sculpture/motion.js';
import { createRenderer as createTwoStepRenderer } from '../art/sculptures/two-step-sculpture/render.js';

const root = new URL('../', import.meta.url);

function environment(reduced, run) {
  class Element extends EventTarget {
    value = '0'; textContent = ''; hidden = true; attrs = new Map();
    setAttribute(name, value) { this.attrs.set(name, value); }
    removeAttribute(name) { this.attrs.delete(name); }
    getBoundingClientRect() { return { width: 1200, height: 600 }; }
  }
  const frames = new Map();
  const observers = [];
  const media = Object.assign(new Element(), { matches: reduced });
  const document = Object.assign(new Element(), { hidden: false });
  let next = 0;
  class Observer {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() { this.callback([{ isIntersecting: true }]); }
    disconnect() { this.disconnected = true; }
  }
  const globals = {
    document, window: Object.assign(new Element(), { devicePixelRatio: 1 }),
    matchMedia: () => media,
    requestAnimationFrame: callback => { frames.set(++next, callback); return next; },
    cancelAnimationFrame: id => frames.delete(id),
    ResizeObserver: Observer, IntersectionObserver: Observer,
  };
  const saved = Object.fromEntries(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.assign(globalThis, globals);
  const makePlayer = () => {
    const selectors = ['canvas', '[data-action="play"]', '[data-action="restart"]', '[data-role="timeline"]', '[data-role="speed"]', '[data-role="status"]', '[data-role="controls"]'];
    const elements = Object.fromEntries(selectors.map(selector => [selector, new Element()]));
    const buttons = STAGES.map(() => new Element());
    const draws = [];
    const player = mountPlayer({ querySelector: selector => elements[selector], querySelectorAll: () => buttons }, {
      duration: DURATION, stages: STAGES, poseAt, stageAt, draw: frame => draws.push(frame),
    });
    return { player, elements, buttons, draws };
  };
  const step = ms => {
    const current = [...frames.values()]; frames.clear();
    current.forEach(callback => callback(ms));
  };
  try { run({ makePlayer, frames, observers, media, document, step }); }
  finally {
    for (const [key, descriptor] of Object.entries(saved)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

test('Austin Rain retains its accepted poses and complete return to rest', () => {
  const rest = poseAt(0);
  const open = poseAt(STAGES[3].inspect);
  const activated = poseAt(STAGES[2].inspect);
  const closing = poseAt(STAGES[4].inspect);
  assert.deepEqual(poseAt(DURATION), rest);
  assert.equal(rest.opening, 0);
  assert.equal(open.opening, 1);
  assert.ok(activated.bowlY > rest.bowlY && activated.bowlY < open.bowlY);
  assert.ok(activated.tilt > rest.tilt && activated.tilt < open.tilt);
  assert.ok(closing.bowlY < open.bowlY && closing.bowlY > rest.bowlY);
  assert.ok(closing.water < open.water);
});

test('shared player repeats the full cycle in the accepted order', () => {
  environment(false, ({ makePlayer, step }) => {
    const { player, draws } = makePlayer();
    const transitions = [];
    for (let i = 0; i < 1500; i++) {
      step(i * 1000 / 60);
      const name = stageAt(draws.at(-1).time).name;
      if (name !== transitions.at(-1)) transitions.push(name);
    }
    assert.deepEqual(transitions.slice(0, 7), ['Resting', 'Water input', 'Activated', 'Open', 'Return to rest', 'Resting', 'Water input']);
    player.destroy();
  });
});

test('two canvases have independent controls and cleanup', () => {
  environment(false, ({ makePlayer, frames, observers, step }) => {
    const a = makePlayer(); const b = makePlayer();
    assert.equal(frames.size, 2);
    a.buttons[3].dispatchEvent(new Event('click'));
    assert.equal(a.draws.at(-1).time, STAGES[3].inspect);
    assert.equal(b.draws.at(-1).time, 0);
    assert.equal(frames.size, 1);
    step(0); step(100);
    assert.ok(b.draws.at(-1).time > 0);
    assert.equal(a.draws.at(-1).time, STAGES[3].inspect);
    a.player.destroy();
    assert.ok(observers.slice(0, 2).every(observer => observer.disconnected));
    const count = a.draws.length;
    a.buttons[0].dispatchEvent(new Event('click'));
    assert.equal(a.draws.length, count);
    b.player.destroy();
    assert.equal(frames.size, 0);
  });
});

test('reduced motion allows explicit inspection; hidden and offscreen canvases suspend playback', () => {
  environment(true, ({ makePlayer, frames, observers, media, document }) => {
    const a = makePlayer();
    assert.equal(frames.size, 0);
    a.buttons[2].dispatchEvent(new Event('click'));
    assert.equal(a.draws.at(-1).time, STAGES[2].inspect);
    assert.equal(frames.size, 0);
    a.elements['[data-action="play"]'].dispatchEvent(new Event('click'));
    assert.equal(frames.size, 1);
    observers[0].callback([{ isIntersecting: false }]);
    assert.equal(frames.size, 0);
    observers[0].callback([{ isIntersecting: true }]);
    assert.equal(frames.size, 1);
    document.hidden = true; document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(frames.size, 0);
    document.hidden = false; document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(frames.size, 1);
    media.dispatchEvent(new Event('change'));
    assert.equal(frames.size, 0);
    a.elements['[data-action="restart"]'].dispatchEvent(new Event('click'));
    assert.equal(a.draws.at(-1).time, 0);
    assert.equal(frames.size, 0);
    a.player.destroy();
  });
});

test('gallery and standalone page use the renamed study with valid assets and accessible references', async () => {
  for (const path of ['art/index.html', 'art/sculptures/austin-rain-prototype/index.html']) {
    const html = await readFile(new URL(path, root), 'utf8');
    assert.match(html, /Austin Rain Prototype/);
    assert.doesNotMatch(html, /Water-activated sculpture|\/art\/sculpture\.js/);
    assert.match(html, /data-sculpture="austin-rain-prototype"/);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(ids.length, new Set(ids).size);
    for (const match of html.matchAll(/\b(?:for|aria-describedby|aria-labelledby)="([^"]+)"/g)) {
      for (const id of match[1].split(' ')) assert.ok(ids.includes(id), id);
    }
    for (const match of html.matchAll(/\b(?:src|href)="(\/[^"#]*)"/g)) {
      const target = match[1].endsWith('/') ? match[1] + 'index.html' : match[1];
      await access(fileURLToPath(new URL(target.slice(1), root)));
    }
  }
  assert.equal(createRenderer({ getContext: () => null }), null);
});

test('Two-Step preserves equal opposite strokes, upright discharge, and immediate valve closure', () => {
  const rest = twoStepPose(0);
  const top = twoStepPose(20);
  assert.ok(Math.abs(top.cupY - rest.cupY - 5) < 1e-12);
  assert.ok(Math.abs(rest.bowlY - top.bowlY - 5) < 1e-12);
  assert.equal(top.valveOpen, true);
  const departure = twoStepPose(23.01);
  assert.ok(departure.cupY < top.cupY);
  assert.ok(departure.cupWater > 0);
  assert.equal(departure.valveOpen, false);
  assert.equal(departure.valveFlow, 0);
  for (let t = 0; t <= TWO_STEP_DURATION; t += 0.05) {
    const pose = twoStepPose(t);
    assert.ok(Math.abs((pose.cupY - rest.cupY) - (rest.bowlY - pose.bowlY)) < 1e-12);
    if (pose.valveOpen) assert.equal(pose.travel, 1);
    for (const water of [pose.cupWater, pose.bowlWater, ...pose.coneWater]) assert.ok(water >= 0 && water <= 1);
  }
  assert.deepEqual(twoStepPose(TWO_STEP_DURATION), rest);
});

test('Two-Step redirects input and retains independent cone drainage through return', () => {
  assert.equal(TWO_STEP_MODEL.emitterY - TWO_STEP_MODEL.cupRestY, 1);
  assert.equal(twoStepPose(0).aqueductFeed, 0);
  assert.ok(twoStepPose(8.5).overflow > 0);
  assert.equal(twoStepPose(20).aqueductFeed, 1);
  assert.equal(twoStepPose(32).travel, 0);
  assert.ok(twoStepPose(32).coneDrain > 0);
  assert.ok(twoStepPose(32).coneWater.every(water => water > 0));
  assert.ok(twoStepPose(38).coneWater.every(water => water === 0));
  for (const stage of TWO_STEP_STAGES) assert.ok(twoStepStage(stage.inspect).name.length > 0);
  const cones = Array.from({ length: 4 }, (_, i) => conePosition(i));
  assert.equal(new Set(cones.map(p => p.join(','))).size, 4);
  for (let i = 0; i < 4; i++) {
    assert.ok(cones[i][1] < channelPoint(i, 1)[1]);
    assert.ok(cones[i][1] - TWO_STEP_MODEL.coneDepth > 0);
    const next = cones[(i + 1) % 4];
    assert.ok(Math.abs(cones[i][0] * next[0] + cones[i][2] * next[2]) < 1e-10);
  }
});

test('Two-Step page has valid assets, unique accessible IDs, and its own player entry', async () => {
  const page = new URL('art/sculptures/two-step-sculpture/index.html', root);
  const html = await readFile(page, 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.match(html, /data-sculpture="two-step-sculpture"/);
  assert.match(html, /not a physics simulation/);
  assert.doesNotMatch(html, /austin-rain-prototype\/index.js/);
  for (const match of html.matchAll(/\b(?:for|aria-describedby|aria-labelledby)="([^"]+)"/g)) {
    for (const id of match[1].split(' ')) assert.ok(ids.includes(id), id);
  }
  for (const match of html.matchAll(/\b(?:src|href)="((?:\/|\.\/)[^"#]*)"/g)) {
    let target = match[1].endsWith('/') ? match[1] + 'index.html' : match[1];
    const url = target.startsWith('/') ? new URL(target.slice(1), root) : new URL(target, page);
    await access(fileURLToPath(url));
  }
});

test('Two-Step renderer handles all inspection poses at desktop and phone sizes', () => {
  let commands = 0;
  const context = new Proxy({}, {
    get: (_, property) => {
      if (property === 'createLinearGradient') return () => ({ addColorStop() {} });
      return (...args) => {
        commands++;
        for (const value of args.flat()) if (typeof value === 'number') assert.ok(Number.isFinite(value), property);
      };
    },
    set: () => true,
  });
  const draw = createTwoStepRenderer({ width: 1080, height: 880, getContext: () => context });
  for (const width of [375, 1280]) {
    for (const t of [0, 8.5, 13.5, 17, 20, 23.01, 26.5, 32, 40]) {
      draw({ time: t, pose: twoStepPose(t), width, height: width < 620 ? 510 : 1000 });
    }
  }
  assert.ok(commands > 0);
  assert.equal(createTwoStepRenderer({ getContext: () => null }), null);
});
