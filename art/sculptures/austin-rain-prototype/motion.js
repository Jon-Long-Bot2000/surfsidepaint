import { MODEL } from './model.js';

// Prescribed motion study. These timings do not calculate forces or water flow.
export const DURATION = 20;
export const STAGES = Object.freeze([
  { name: 'Resting', start: 0, inspect: 0 },
  { name: 'Water input', start: 2.5, inspect: 4.5 },
  { name: 'Activated', start: 6, inspect: 7.8 },
  { name: 'Open', start: 9.5, inspect: 10.5 },
  { name: 'Return to rest', start: 13.5, inspect: 16.3 },
]);

const smooth = (value) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
const ramp = (t, from, to) => smooth((t - from) / (to - from));

export function poseAt(time, model = MODEL) {
  const opening = ramp(time, 6, 9.5) * (1 - ramp(time, 13.5, 18.5));
  return {
    opening,
    water: ramp(time, 2.8, 6.5) * (1 - ramp(time, 11.5, 18)),
    pour: ramp(time, 2.5, 3) * (1 - ramp(time, 6.8, 7.5)),
    tilt: model.restingTilt + opening * model.opening,
    bowlY: model.bowlRestY + opening * model.bowlTravel,
    drainOpacity: time > 12 && time < 18 ? Math.sin((time - 12) / 6 * Math.PI) * 0.6 : 0,
  };
}

export function stageAt(time) {
  const index = Math.max(0, STAGES.findLastIndex(stage => time >= stage.start));
  return { index, name: index === 4 && time >= 18.5 ? 'Resting' : STAGES[index].name };
}
