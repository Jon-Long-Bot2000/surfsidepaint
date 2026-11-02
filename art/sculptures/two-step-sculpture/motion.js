import { MODEL, jetPeakY } from './model.js';

// Prescribed poses and independent visual water curves, NOT force/flow calculations.
export const DURATION = 40;
export const STAGES = Object.freeze([
  { name: 'Resting / input', start: 0, inspect: 0 },
  { name: 'Cup overflows', start: 6, inspect: 8.5 },
  { name: 'Activated / separate', start: 11, inspect: 13.5 },
  { name: 'Top valve open', start: 17, inspect: 20 },
  { name: 'Cup returns / cones spin', start: 23, inspect: 25.5 },
  { name: 'Cones at bottom', start: 28, inspect: 29.5 },
  { name: 'Counterweight reset (proposed)', start: 31, inspect: 35 },
]);

const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const ramp = (t, start, end) => smooth((t - start) / (end - start));
const mix = (a, b, t) => a + (b - a) * t;

export function poseAt(time, model = MODEL) {
  const t = Math.max(0, Math.min(DURATION, time));
  const travel = ramp(t, 11, 17) * (1 - ramp(t, 23, 32));
  const cupY = model.cupRestY + travel * model.travel;
  const bowlY = model.bowlRestY - travel * model.travel;
  // A schematic stream-capture boundary, not a solved ballistic intersection.
  const aqueductFeed = smooth((cupY - jetPeakY) / 0.08);
  const valveOpen = t >= 17 && t <= 23;
  let cupWater;
  if (t <= 6) cupWater = mix(0.35, 1, ramp(t, 0, 6));
  else if (t < 17) cupWater = 1;
  else if (t <= 23) cupWater = mix(1, 0.2, ramp(t, 17, 23));
  else cupWater = 0.2;
  // Jets resume filling near the end of return; the loop begins with retained water.
  if (t >= 31) cupWater += 0.15 * ramp(t, 31, 40);
  let bowlWater = 0;
  if (t <= 11) bowlWater = 0.78 * ramp(t, 6, 11);
  else if (t <= 17) bowlWater = mix(0.78, 0.64, ramp(t, 11, 17));
  else if (t <= 20) bowlWater = mix(0.64, 0.95, ramp(t, 17, 20));
  else bowlWater = 0.95 * (1 - ramp(t, 20, 36));
  // M02 is a separate prescribed cycle. Reverse-spin reset is a proposal.
  const coneDrop = model.coneTravel * ramp(t, 21, 28) * (1 - ramp(t, 31, 39));
  const coneRotation = coneDrop / model.screwLead * Math.PI * 2;

  return {
    travel, cupY, bowlY, cupWater, bowlWater, valveOpen, coneDrop, coneRotation,
    valveFlow: valveOpen ? 0.25 + 0.75 * (1 - ramp(t, 17, 23)) : 0,
    overflow: ramp(t, 6, 6.5) * (1 - ramp(t, 11, 11.5)),
    aqueductFeed,
    // Four identical curves here express symmetry, not mechanical coupling to M01.
    coneWater: Array.from({ length: 4 }, () => 0.98 * ramp(t, 14.5, 21) * (1 - ramp(t, 21, 38))),
    coneDrain: 0.8 * ramp(t, 15.5, 18) * (1 - ramp(t, 35, 38)),
    bowlDrain: bowlWater > 0.005 ? 1 : 0,
    // The pump runs continuously, including when the player reaches the loop seam.
    pump: 1,
  };
}

export function stageAt(time) {
  const index = Math.max(0, STAGES.findLastIndex(stage => time >= stage.start));
  return { index, name: time >= 39 ? 'Nested / cones reset' : STAGES[index].name };
}
