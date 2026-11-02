import { mountPlayer } from '../../shared/player.js';
import { DURATION, STAGES, poseAt, stageAt } from './motion.js';
import { createRenderer } from './render.js';

for (const root of document.querySelectorAll('[data-sculpture="two-step-sculpture"]')) {
  const draw = createRenderer(root.querySelector('canvas'));
  if (draw) mountPlayer(root, { duration: DURATION, stages: STAGES, poseAt, stageAt, draw });
}
