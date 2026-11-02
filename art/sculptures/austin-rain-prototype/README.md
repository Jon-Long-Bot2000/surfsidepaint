# Austin Rain Prototype

Austin Rain Prototype is the sculpture formerly called the Water-activated sculpture in this chat and on the Art page. Its wooden slats open as a suspended bowl fills with water, then close as water drains. This is the canonical design record and Atlas v2 for this sculpture. Use the [shared atlas language](../../docs/atlas.md) and [Art instructions](../../AGENTS.md) alongside it.

- Design slug: `austin-rain-prototype`
- Study page: `/art/sculptures/austin-rain-prototype/`
- Featured canvas: `/art/` → Current development
- Implementation mode: prescribed motion study, not a physics simulation
- Accepted baseline: preserve the reviewed appearance, 20-second cycle, stage poses, and playback controls during the rename and organization

## Atlas v2

The owner confirmed the water, bowl, taut-cord, and slat mechanism in this chat. Mounting construction and numerical dimensions remain unspecified.

| ID | Part or feature | Definition | Movement or role | Status |
|---|---|---|---|---|
| P01 | Stand | Central post and ground support | Remains fixed during operation | Established reference |
| P02 | Pivot support | Structure holding the slats' pivot locations | Holds pivots stationary while slats rotate | Exact construction unconfirmed; represented as a ring |
| P03 | Slats | Complete wooden pieces arranged around the center | Rotate between resting and open positions | Confirmed; physical count unspecified |
| P03-B | Blades | Long portions below the pivots | Swing outward/upward during opening and inward/downward during closing | Confirmed features of P03, not independent bodies |
| P03-H | Lever tips | Short upper portions above the pivots | Move inward under cord pull and outward during return | Confirmed features of P03 |
| P04 | Slat pivots | Joints about which slats rotate | Let blades and lever tips swing together as one rigid piece | Function confirmed; mounting details unspecified |
| P05 | Cord links | Taut connections between each lever tip and the water bowl | Transmit the bowl's pull to the lever tips and the slats' restoring pull to the bowl | Confirmed |
| P06 | Water bowl | Suspended container connected to the lever tips | Descends under sufficient water load and rises as that load drains away | Confirmed |
| P07 | Water load | Water held in the bowl | Increases the bowl's downward force as it accumulates | Confirmed |
| P08 | Water input | Water supplied from outside the sculpture | Supplies water faster than the drain hole releases it during filling | Confirmed; bottle is an external input cue in the study |
| P09 | Drain hole | Small outlet in the bowl | Releases water and enables return to rest after input ceases | Confirmed passive reset mechanism |
| P10 | Input shutoff | Mechanism that would stop input at a chosen condition | Would end filling at the chosen activation or opening condition | Missing; no design selected |

| ID | Force or condition | Shared definition | Status |
|---|---|---|---|
| F01 | Slat restoring pull | Combined opposing force transmitted through taut cords, tending to raise the bowl and lower the blades; exceeds the empty bowl's weight | Confirmed relationship; no force measurements |
| C01 | Activation threshold | Loaded bowl produces enough downward force to overcome the opposing restoring pull and begin opening | Definition confirmed; numerical threshold unspecified |
| C02 | Target opening | Desired blade rotation measured from the resting pose | Definition agreed; physical target angle unspecified |

Activation threshold and target opening are separate: beginning to open does not establish that the desired opening has been reached.

## Confirmed operating sequence

| State or transition | Movement and cause | Outcome |
|---|---|---|
| Resting | Restoring pull holds the bowl raised and blades down | Narrow resting form |
| Filling | Input exceeds drainage and water accumulates | Increasing downward load |
| Activation | Loaded bowl overcomes the restoring pull and begins descending | Opening begins |
| Opening | Bowl descends, cords pull lever tips inward, blades rotate outward | Movement toward the target opening |
| Target opening | Blades reach the desired rotation | Desired open form; automatic input stopping or holding is not established |
| Draining / closing | After input ceases, drainage reduces load until restoring pull raises the bowl and lowers the blades | Return toward rest |
| Resting again | Bowl is raised and blades are down | Cycle reset |

## Current animation and assumptions

The current model draws 16 slats, a ring-shaped pivot support, cords, a bowl, a blue pouring bottle, and a stand. Counts, proportions, bowl travel, and tilt are illustration parameters rather than confirmed physical measurements. The name change and module separation preserve these visual choices.

`model.js` owns the adjustable values. `motion.js` prescribes a 20-second loop: Resting at 0 seconds, Water input at 2.5, Activated at 6, Open at 9.5, Return to rest at 13.5, and settled rest from 18.5. These times are not measured activation thresholds or a prediction of the physical sculpture.

Water fill, pouring, drainage, bowl travel, and blade tilt are visual curves. Cord endpoints are drawn connections; constant cord length, force balance, and water flow are not solved. The animation stops its pouring cue on a schedule; this does not implement or propose a physical P10 shutoff. The physical drain is continuous, while the study shows selected drain droplets as a visual cue.

Shared semantic directions use up/down relative to the ground. The renderer retains its original illustration coordinates: y increases downward and positive z is nearer the viewer. It converts those coordinates to the fixed camera view; they are not a proposed physical coordinate standard.

## Unresolved design inputs

- Physical slat count, dimensions, masses, pivot mounting, attachment geometry, and cord lengths.
- Reference view and numbering for individual slats.
- Bowl mass, capacity, input flow, drain-hole size, and drainage behavior.
- Numerical activation threshold C01 and desired target opening C02.
- Input shutoff P10: trigger condition, mechanism, and behavior after activation.
- Whether a target pose should be held, for how long, and by what physical mechanism.

## Source files and next-chat context

`index.html` is the standalone page; `index.js` mounts this design; `model.js`, `motion.js`, and `render.js` divide geometry, movement, and appearance. Both the study page and the Art hub use these same modules and the shared player.

Original references and temporary exports belong in ignored `.local/art/austin-rain-prototype/`. Assets intended for the website can be added to an `assets/` directory beside these source files.

At handoff, read this record and the shared atlas first. Preserve the accepted visual study unless a requested change affects it. Update confirmed facts and accepted behavior here; keep unanswered physics and missing mechanisms explicit.
