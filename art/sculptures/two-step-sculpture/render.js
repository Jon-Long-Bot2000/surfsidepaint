import { MODEL, channelPoint, conePosition, inletAngle } from './model.js';

// Fixed three-quarter illustration. Rendering never advances time or solves forces.
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const M = MODEL;
  const ink = '#425966';
  const metal = '#b3a17d';
  const blue = '#359abb';
  const project = ([x, y, z]) => [540 + (x * 0.86 - z * 0.5) * 53, 792 + (-y + (x * 0.5 + z * 0.86) * 0.3) * 53];
  const depth = ([x, , z]) => x * 0.5 + z * 0.86;

  function path(points, stroke = ink, lineWidth = 1, fill = null) {
    ctx.beginPath();
    points.forEach((p, i) => {
      const [x, y] = project(p);
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    });
    if (fill) { ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }
  function ring(center, radius, fill = null, stroke = ink, lineWidth = 1, start = 0, sweep = Math.PI * 2) {
    const [x, y, z] = center;
    path(Array.from({ length: 65 }, (_, i) => {
      const a = start + i / 64 * sweep;
      return [x + Math.cos(a) * radius, y, z + Math.sin(a) * radius];
    }), stroke, lineWidth, fill);
  }
  function dot(point, radius, fill) {
    const [x, y] = project(point);
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
  }
  function stream(from, to, time, opacity = 1, width = 2) {
    if (opacity <= 0) return;
    ctx.save(); ctx.globalAlpha = opacity;
    path([from, to], '#81c9df66', width + 2);
    ctx.setLineDash([5, 9]); ctx.lineDashOffset = -time * 30;
    path([from, to], '#2998b9', width);
    ctx.restore();
  }
  function label(text, subtext, point, x, y, align = 'left') {
    const [px, py] = project(point);
    const end = align === 'left' ? x - 9 : x + 9;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(end, y + 2);
    ctx.strokeStyle = '#bdcbd0'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.fillStyle = ink; ctx.textAlign = align; ctx.font = '500 14px "DM Sans", sans-serif';
    ctx.fillText(text, x, y);
    ctx.fillStyle = '#6a7f89'; ctx.font = '12px "DM Sans", sans-serif'; ctx.fillText(subtext, x, y + 19);
    dot(point, 2, '#8b9fa8');
  }

  // Transparent section-style vessels keep the load and center stand legible.
  function vessel(center, radius, height, bottomRadius, water, color, cone = false) {
    const [x, y, z] = center;
    const bottom = [x, y - height, z];
    const side = Array.from({ length: 65 }, (_, i) => {
      const a = i / 64 * Math.PI * 2;
      return [x + radius * Math.cos(a), y, z + radius * Math.sin(a)];
    });
    const lower = side.map(p => [x + (p[0] - x) * bottomRadius / radius, y - height, z + (p[2] - z) * bottomRadius / radius]).reverse();
    // Individual facets express vessel volume without hiding water inside it.
    for (let i = 0; i < 64; i++) {
      const a = side[i]; const b = side[i + 1];
      const low = p => [x + (p[0] - x) * bottomRadius / radius, y - height, z + (p[2] - z) * bottomRadius / radius];
      path([a, b, low(b), low(a)], null, 0, '#b6c8cd12');
    }
    path([side[0], ...side.slice(1), ...lower], null, 0, '#e4edef25');
    ring(bottom, bottomRadius, null, '#79939b88', 1);
    // A cone's height fraction is the cube root of its illustrative volume fraction.
    if (water > 0.001) {
      const level = cone ? Math.cbrt(water) : water;
      const wy = y - height + height * level * 0.92;
      const wr = bottomRadius + (radius - bottomRadius) * level * 0.92;
      const frontAngle = Math.atan2(0.86, 0.5) - Math.PI / 2;
      const surface = Array.from({ length: 33 }, (_, i) => {
        const a = frontAngle + i / 32 * Math.PI;
        return [x + Math.cos(a) * wr, wy, z + Math.sin(a) * wr];
      });
      const base = surface.map(p => [x + (p[0] - x) * bottomRadius / wr, y - height, z + (p[2] - z) * bottomRadius / wr]).reverse();
      path([...surface, ...base], null, 0, '#5eb6cd38');
      ring([x, wy, z], wr, '#74c5d787', '#3b99b5', 1.1);
      // Center passage is conceptual; seals and sliding collars are not engineered.
      if (!cone) ring([x, wy + 0.01, z], 0.13, '#e5edf0', '#99aeb6', 0.7);
    }
    const silhouette = [-Math.PI / 6, Math.PI * 5 / 6];
    for (const a of silhouette) {
      path([[x + Math.cos(a) * radius, y, z + Math.sin(a) * radius], [x + Math.cos(a) * bottomRadius, y - height, z + Math.sin(a) * bottomRadius]], color, 1.6);
    }
    ring(center, radius, null, color, 2.8);
    ring(center, radius - 0.025, null, '#ffffffb0', 0.8);
  }

  function channel(index, pose, time) {
    const points = Array.from({ length: 101 }, (_, i) => channelPoint(index, i / 100));
    const edges = [-1, 1].map(sign => points.map((p, i) => {
      const a = inletAngle(index) + M.channelSweep * i / 100;
      return [p[0] + sign * Math.cos(a) * M.channelWidth / 2, p[1] + 0.04, p[2] + sign * Math.sin(a) * M.channelWidth / 2];
    }));
    path([...edges[0], ...edges[1].toReversed()], '#a79a7d', 0.65, '#e6ddc5c9');
    edges.forEach(edge => path(edge, '#b4a27f', 1));
    if (pose.aqueductFeed > 0.01) {
      path(points, '#49a6c4a0', 3.2 * pose.aqueductFeed);
      ctx.save(); ctx.globalAlpha = pose.aqueductFeed;
      ctx.setLineDash([7, 16]); ctx.lineDashOffset = -time * 22;
      path(points, '#e6fbff', 1.1); ctx.restore();
      const outlet = points.at(-1);
      // Channels stay fixed: water falls to the basin once cones move away.
      const target = pose.coneDrop < 0.02 ? conePosition(index) : [outlet[0], 0.04, outlet[2]];
      stream(outlet, target, time, pose.aqueductFeed, 2.8);
    }
  }

  function jet(index, pose, time) {
    const a = inletAngle(index);
    const radial = r => [Math.cos(a) * r, M.emitterY, Math.sin(a) * r];
    const from = radial(M.emitterRadius);
    // Fixed parabolas. A rising cup intercepts less; the final path never aims at it.
    const at = t => {
      const r = M.emitterRadius + (M.channelStartRadius - M.emitterRadius) * t;
      return [Math.cos(a) * r, M.emitterY + (M.channelStartY - M.emitterY) * t + M.jetArch * 4 * t * (1 - t), Math.sin(a) * r];
    };
    const b = M.channelStartY - M.emitterY + 4 * M.jetArch;
    const discriminant = b * b - 16 * M.jetArch * (pose.cupY - M.emitterY);
    // Clip the SAME arc at the cup rim plane when it intersects the rising cup.
    const end = discriminant >= 0 ? Math.min(1, (b + Math.sqrt(discriminant)) / (8 * M.jetArch)) : 1;
    const points = Array.from({ length: 51 }, (_, i) => at(i / 50 * end));
    path(points, '#6ab5ce55', 4.5);
    ctx.save(); ctx.setLineDash([8, 8]); ctx.lineDashOffset = -time * 27;
    path(points, '#2c91b5', 1.65); ctx.restore();
    path([[0, M.emitterY, 0], from], '#8c9fa6', 2.5);
    dot(from, 3, metal);
  }

  return function draw({ time, pose, width, height }) {
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, '#fdfefe'); background.addColorStop(1, '#edf3f5');
    ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
    const compact = width < 620;
    const scale = Math.min(width / (compact ? 680 : 1080), height / 880);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale); ctx.translate(-540, -440);

    // Ground grid and basin, common reference for all upward/downward directions.
    for (let i = -4; i <= 4; i++) {
      path([[-4.5, -0.14, i], [4.5, -0.14, i]], '#ccd9dd44', 0.7);
      path([[i, -0.14, -4.5], [i, -0.14, 4.5]], '#ccd9dd44', 0.7);
    }
    ring([0, -0.03, 0], M.basinRadius, '#d7e5e9', '#a6bac2', 1.5);
    ring([0, 0, 0], M.basinRadius - 0.15, '#b8dae4', '#eef7fa', 2);
    for (let i = 0; i < 4; i++) ring([0, 0.01, 0], 0.5 + ((time * 0.22 + i) % 4), null, '#eafaff50', 1);
    // P10 and the hollow stand's water supply, shown through a transparent section.
    path([[0.7, 0.06, 0.2], [0, 0.06, 0], [0, M.pulleyY + 0.05, 0]], '#718a92', 8);
    ctx.save(); ctx.setLineDash([4, 8]); ctx.lineDashOffset = time * 18;
    path([[0, 0.08, 0], [0, M.emitterY, 0]], '#6bc1dd', 3); ctx.restore();
    dot([0.7, 0.06, 0.2], 8, '#526e79');
    // Fixed lower screw, moving central sleeve, and rigid cone support ring.
    const screw = Array.from({length: 361}, (_, i) => {
      const y = 0.55 + i / 360 * 3.8;
      const a = y / M.screwLead * Math.PI * 2;
      return [Math.cos(a) * 0.19, y, Math.sin(a) * 0.19];
    });
    path(screw, '#97784b', 2.3);
    const ringY = M.coneRimY - pose.coneDrop;
    const atCone = i => conePosition(i, pose.coneDrop, pose.coneRotation);
    const order = [0, 1, 2, 3].sort((a, b) => depth(atCone(a)) - depth(atCone(b)));
    ring([0, ringY, 0], M.channelEndRadius, null, '#907a54', 3.2);
    for (const i of order) {
      const [x, y, z] = atCone(i);
      path([[0, ringY, 0], [x, y, z]], '#ab9570', 2);
    }
    vessel([0, ringY + 0.25, 0], 0.31, 0.5, 0.31, 0, '#92784c');
    path([[0.31 * Math.cos(pose.coneRotation), ringY + 0.2, 0.31 * Math.sin(pose.coneRotation)], [0.31 * Math.cos(pose.coneRotation), ringY - 0.2, 0.31 * Math.sin(pose.coneRotation)]], '#7c633c', 2.5);
    // Proposed non-rotating lift collar and thrust bearing isolate cord from spin.
    ring([0, ringY + 0.3, 0], 0.43, null, '#518a95', 3);
    ring([0, ringY + 0.38, 0], 0.43, null, '#95c1c5', 2);
    path([[-0.53, 1.6, 0], [-0.53, 4.6, 0]], '#829a9f99', 1.6);
    // Two fixed redirecting pulleys lead to a guided external counterweight.
    const weightY = 1.15 + pose.coneDrop;
    const weightX = -4.8, weightZ = -1.3;
    path([[weightX, 0.1, weightZ], [weightX, 4.65, weightZ]], '#8b9ca5', 2);
    path([[0, 4.65, 0], [weightX, 4.65, weightZ]], '#a8b6bb', 2);
    path([[-0.43, ringY + 0.33, 0], [-0.43, 4.65, 0], [weightX, 4.65, weightZ], [weightX, weightY + 0.55, weightZ]], '#92754c', 1.7);
    for (const p of [[-0.43, 4.65, 0], [weightX, 4.65, weightZ]]) dot(p, 5, '#a39271');
    vessel([weightX, weightY + 0.55, weightZ], 0.28, 0.7, 0.28, 0, '#536c79');
    const [wx, wy] = project([weightX, weightY + 0.2, weightZ]);
    ctx.fillStyle = '#536c79'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('W', wx, wy);
    for (const i of [0, 1, 2, 3]) channel(i, pose, time);
    for (const i of order.filter(i => depth(atCone(i)) < 0)) {
      vessel(atCone(i), M.coneRadius, M.coneDepth, 0.025, pose.coneWater[i], '#a79c83', true);
      const [x, y, z] = atCone(i);
      stream([x, y - M.coneDepth, z], [x, 0.04, z], time, pose.coneDrain, 1.2);
    }

    // A schematic single cord over one fixed pulley; endpoints stay on vessel rims.
    const cupAttach = [-M.cupRadius, pose.cupY, 0];
    const bowlAttach = [M.bowlRadius, pose.bowlY, 0];
    path([cupAttach, [-0.22, M.pulleyY, 0]], '#a18b62', 1.7);
    path([[0.22, M.pulleyY, 0], bowlAttach], '#a18b62', 1.7);
    const [px, py] = project([0, M.pulleyY, 0]);
    ctx.beginPath(); ctx.arc(px, py, 12, Math.PI, Math.PI * 2);
    ctx.strokeStyle = '#a18b62'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#e1ded2'; ctx.fill(); ctx.strokeStyle = '#7c8179'; ctx.lineWidth = 2; ctx.stroke();
    dot([0, M.pulleyY, 0], 2.5, '#657b81');

    // Bowl drain is offset from the stand; top cup outlet is schematic and offset too.
    stream([0.42, pose.bowlY - M.bowlDepth, 0.1], [0.42, 0.04, 0.1], time, pose.bowlDrain * 0.65, 1.1);
    vessel([0, pose.bowlY, 0], M.bowlRadius, M.bowlDepth, 0.38, pose.bowlWater, '#6c8793');
    if (pose.valveFlow) stream([0.4, pose.cupY - M.cupDepth, 0.12], [0.4, pose.bowlY - 0.1, 0.12], time, pose.valveFlow, 3.4);
    if (pose.overflow > 0) {
      for (let i = 0; i < 4; i++) {
        const a = inletAngle(i);
        stream([Math.cos(a) * M.cupRadius, pose.cupY, Math.sin(a) * M.cupRadius], [Math.cos(a) * (M.cupRadius + 0.12), pose.bowlY - 0.2, Math.sin(a) * (M.cupRadius + 0.12)], time, pose.overflow, 2);
      }
    }
    vessel([0, pose.cupY, 0], M.cupRadius, M.cupDepth, 0.43, pose.cupWater, '#a98d58');
    dot(cupAttach, 3, '#927b54'); dot(bowlAttach, 3, '#927b54');
    // Top contact and valve indicator: schematic linkage, not an engineered valve.
    path([[0, M.cupRestY + M.travel + 0.15, 0], [0.4, M.cupRestY + M.travel + 0.15, 0.12]], '#5c7884', 4);
    path([[0.4, pose.cupY - M.cupDepth, 0.12], [0.4, pose.cupY + 0.15, 0.12]], '#6d8b9677', 1.3);
    dot([0.4, pose.cupY - M.cupDepth, 0.12], 4, pose.valveOpen ? '#42b9a5' : '#ba8d55');
    for (let i = 0; i < 4; i++) jet(i, pose, time);

    for (const i of order.filter(i => depth(atCone(i)) >= 0)) {
      vessel(atCone(i), M.coneRadius, M.coneDepth, 0.025, pose.coneWater[i], '#a79c83', true);
      const [x, y, z] = atCone(i);
      stream([x, y - M.coneDepth, z], [x, 0.04, z], time, pose.coneDrain, 1.2);
    }

    if (!compact) {
      label('P06 · Fixed pulley', 'Cord routing schematic', [0, M.pulleyY, 0], 690, 75);
      label(`P14 · Valve ${pose.valveOpen ? 'open' : 'closed'}`, 'Upright cup · contact operated', [0.4, pose.cupY - M.cupDepth, 0.12], 750, 195);
      label('P03 · Cup', `Rise ${(pose.travel * 5).toFixed(1)} / 5 ft target`, [-0.75, pose.cupY, 0], 295, 280, 'right');
      label('P07 · Fixed emitters', '1 ft above the resting cup rim', [0, M.emitterY, 0], 290, 365, 'right');
      label('P04 · Bowl', `Descent ${(pose.travel * 5).toFixed(1)} / 5 ft target`, [0.85, pose.bowlY - 0.3, 0], 765, 380);
      label('P08 · Four spiral channels', 'Fixed · open top', channelPoint(1, 0.4), 280, 470, 'right');
      const nearCone = order.at(-1);
      label('M02 · Rotating cone ring', `${(pose.coneDrop / M.screwLead).toFixed(1)} turns · ${(pose.coneDrop).toFixed(1)} ft descent`, atCone(nearCone), 755, 625);
      label('Proposed counterweight', 'Guided · separate from rotating sleeve', [weightX, weightY + 0.2, weightZ], 290, 635, 'right');
      label('P09 · Catch basin', 'Continuous recirculation through stand', [0, 0, 3.9], 305, 835, 'right');
    }
    ctx.restore();

    // Screen-space notes stay readable at phone size.
    ctx.fillStyle = '#536e7a'; ctx.textAlign = 'left'; ctx.font = '12px "DM Sans", sans-serif';
    ctx.fillText('PRESCRIBED MOTION · ILLUSTRATIVE TIMING', 18, 26);
    ctx.fillStyle = '#6b808a'; ctx.font = '11px "DM Sans", sans-serif';
    ctx.fillText('Geometry and water flow are schematic', 18, 44);
  };
}
