import { mountPlayer } from '../../shared/player.js';
import { DURATION, STAGES, poseAt, stageAt } from './motion.js';
import { createRenderer } from './render.js';

// The same design can be featured on /art/ and opened on its own study page.
for (const root of document.querySelectorAll('[data-sculpture="austin-rain-prototype"]')) {
  const draw = createRenderer(root.querySelector('canvas'));
  if (draw) mountPlayer(root, { duration: DURATION, stages: STAGES, poseAt, stageAt, draw });
}
