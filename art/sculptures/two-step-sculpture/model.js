// Feet for the intended M01 stroke; all other dimensions are illustrative.
// The drawn cord is schematic: 10 ft specified length is not a solved constraint.
export const MODEL = Object.freeze({
  travel: 5,
  specifiedCordLength: 10,
  cupRestY: 6.7,
  bowlRestY: 6.42,
  cupRadius: 1.3,
  cupDepth: 0.7,
  bowlRadius: 1.5,
  bowlDepth: 0.95,
  pulleyY: 12.25,
  channelStartY: 6.58,
  channelEndY: 3.95,
  channelStartRadius: 1.34,
  channelEndRadius: 3.3,
  channelSweep: Math.PI * 1.2,
  channelWidth: 0.22,
  coneRimY: 3.55,
  coneRadius: 0.72,
  coneDepth: 1.38,
  coneTravel: 1.6, // Illustrative stroke, independent of M01's five-foot travel.
  screwLead: 0.8, // Illustrative feet per revolution: two turns over the M02 stroke.
  basinRadius: 4.6,
  emitterY: 7.7, // Fixed: 1 ft above the cup's 6.7 ft resting rim, not moving with it.
  emitterRadius: 0.23,
  jetArch: 0.6,
});

export const jetPeakY = MODEL.emitterY + (MODEL.channelStartY - MODEL.emitterY + 4 * MODEL.jetArch) ** 2 / (16 * MODEL.jetArch);

// Local illustration convention: y is upward; four inlet positions form a square.
export const inletAngle = index => Math.PI / 4 + index * Math.PI / 2;
export function channelPoint(index, progress) {
  const angle = inletAngle(index) + MODEL.channelSweep * progress;
  const radius = MODEL.channelStartRadius + (MODEL.channelEndRadius - MODEL.channelStartRadius) * progress;
  return [Math.cos(angle) * radius, MODEL.channelStartY + (MODEL.channelEndY - MODEL.channelStartY) * progress, Math.sin(angle) * radius];
}
export function conePosition(index, drop = 0, rotation = 0) {
  const [x, , z] = channelPoint(index, 1);
  return [x * Math.cos(rotation) - z * Math.sin(rotation), MODEL.coneRimY - drop, x * Math.sin(rotation) + z * Math.cos(rotation)];
}
