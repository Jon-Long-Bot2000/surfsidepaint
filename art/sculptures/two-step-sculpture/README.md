# Two-Step Sculpture

This is the canonical design record and initial atlas for a new kinetic sculpture. Use the [shared atlas language](../../docs/atlas.md) and [Art instructions](../../AGENTS.md). This design establishes its mechanics independently of Austin Rain Prototype.

- Design slug: `two-step-sculpture`
- Development branch: `codex/Two-Step-Sculpture`
- Status: quick screw-driven M02 motion preview implemented; counterweight arrangement and reverse-spin reset are proposals awaiting owner review
- Study page: `/art/sculptures/two-step-sculpture/`
- Implementation mode: owner-approved prescribed motion study, with illustrative timing; not a physics simulation
- Release: owner authorized committing, merging to main, and publishing this quick preview without further tests, checks, or deployment verification

## Vision and accepted decisions

The working name is Two-Step Sculpture. The owner describes a kinetic fountain with two unique mechanisms that move independently. Mechanism 1 is the cup/bowl mechanism. Mechanism 2 now includes a circular ring joining the four cones, linked to a cylindrical sleeve around the stand. The lower stand is a screw; the loaded cone assembly descends and spins to the bottom. This supersedes the original static-cone baseline. Do not infer mechanical coupling between M01 and M02 from the working name.

The following is owner-described intended behavior, not a measured or physically validated prototype:

1. A hollow stand extends vertically from the ground support to the sculpture's top center. Mechanism 1 rests around the middle of its height.
2. An empty cup and empty bowl connect taut through a pulley at the top of the stand. Both are centered around the stand, which passes through the center of each. The heavier empty cup nests inside, and is supported by, the lighter empty bowl in the resting pose. The cord attaches to each vessel's rim.
3. Water is pumped from the ground-level catch basin up through the stand to four equally spaced fixed emitters in a square layout. Their upward jets arch into the cup. The owner subsequently requested the emitters one foot above the cup; the current study references the resting cup rim, retaining the established fixed-emitter arrangement.
4. The cup fills, then overflows into the bowl below it.
5. Once the loaded bowl becomes heavier than the full cup, the bowl descends and pulls the cup upward an equal distance. The owner specifies a 10-foot cord and wants 5 feet of upward cup travel and 5 feet of downward bowl travel; these are desired strokes, not yet a verified geometric fit.
6. The emitters and aqueducts remain fixed. The rising cup clears the streams, allowing them to reach four distinct downward-spiraling, open-top aqueducts. Their entrances sit just below and outside the cup rim and just above the bowl rim in the resting configuration, intended to clear both vessels' travel. The aqueducts are visually appealing water-descent channels, rather than the slow-release storage itself. Mechanism 2 comprises four equally spaced, cone-shaped storage areas arranged like a chandelier below the aqueducts. Restricted outlets let stored water drain completely toward the catch basin. The study places one cone below each aqueduct outlet; precise spacing and suspension geometry are illustrative.
7. The bowl has a small drain hole that releases water more slowly than it is supplied during filling. The cup remains upright throughout. Contact at its highest point opens a release valve; the valve automatically closes when the cup is no longer held against the top contact. This replaces the previously proposed tipping action entirely.
8. Cup discharge falls mostly into the bowl. The bowl continues draining and is intended eventually to rise back to its resting position, with the cup descending through the cord coupling. The owner accepts that the cup can start descending with some water remaining; its valve closes immediately when top contact ends. Exact top dwell and return timing are illustrative.
9. All water is intended eventually to return to the catch basin and be pumped back through the stand. Uncaptured cup discharge must also ultimately reach the basin; its exact route is unresolved. Repeated-cycle timing has not been established.

### Accepted decision history

- Initial concept: nested vessels, fixed jets and aqueducts, equal opposite travel, bowl drainage, and a top-triggered cup discharge.
- Current revision: replace tipping with a contact-opened, automatically closing release valve. Cup orientation remains upright; do not reintroduce tilting or an upright-recovery stage.
- Current revision: cup discharge lands mostly in the bowl; the draining bowl is intended to return upward.
- Earlier clarification: M02 stores water and releases it through restricted outlets. The spiral aqueducts are channels, not a substitute for a storage mechanism. The subsequent cone decision below establishes their count and arrangement.
- Accepted development: M02 has four equally spaced cone-shaped stores below the aqueducts, like a chandelier; cone shape supports complete drainage. No moving cone structure is required in this first study.
- Accepted development: cup can descend with residual water; valve closes immediately on departure. Do not introduce a requirement to empty completely before return.
- Accepted development: use prescribed animation with explicitly illustrative timing.
- Latest emitter edit: fixed emitters are one foot above the resting cup rim in the implementation. This resting reference is the stated interpretation of the owner's requested height, not a new moving emitter assembly.
- Latest owner-defined M02: connect the cones with a circle, connect that circle to a cylinder around the stand, and make the lower stand a screw. Full cones drive descent and spinning until the assembly reaches the bottom.
- Owner requested a quick animation preview without repeating the full checks/tests. Counterweight placement is an assistant recommendation, not an accepted fabricated mechanism. The preview illustrates reverse-spin return as an explicit proposal.

Record subsequent accepted decisions here. Preserve Austin Rain Prototype's published source and behavior. The initial clarifications are now incorporated; further changes should preserve these accepted decisions.

## Initial atlas

IDs below are scoped to `two-step-sculpture`. They do not inherit Austin's assignments. `M01` and `M02` are local mechanism group references, not extra physical parts. Up/down refer to the ground; no camera-relative left/right or repeated-part numbering has been selected.

| ID | Part or feature | Role and movement | Status |
|---|---|---|---|
| P01 | Hollow stand and ground support | Vertical support and upward water route to the top center | Owner-described form; dimensions and construction unresolved |
| P02 | Pivot supports | Supports for the mechanisms | Owner-named parts; locations, axes, and assignments unresolved |
| P03 | Water cup | Centered around P01 and nested in P04 at rest; rises 5 feet as a target and stays upright while discharging through P14 at the top | Owner-described intended behavior; rim cord attachment accepted; shape, capacity, sliding support, and valve placement unresolved |
| P04 | Water bowl | Centered around P01; supports nested cup, receives overflow, and descends 5 feet as a target | Owner-described intended behavior; rim cord attachment accepted; shape, capacity, and sliding support unresolved |
| P05 | Taut connecting cord | Connects vessel rims over P06 and transmits tension | Owner specifies 10 feet total length; exact routing, knots, pulley wrap, and stroke compatibility unresolved |
| P06 | Top pulley | Redirects P05 at the top of the stand | Owner-described location; axle, support, and exact reeving unresolved |
| P07 | Four fixed emitters | Equally spaced in a square layout; one foot above the resting cup rim; jets arch first into P03 and later into P08 | Fixed status and requested height accepted; resting-rim reference is the current stated interpretation; orientation, nozzle radius, and trajectories illustrative |
| P08 | Four fixed open-top spiral aqueducts | Entrances just below/outside resting cup rim and above bowl rim; descent channels feeding P15 below | Form, fixed status, and intended vessel clearance accepted; sweep, support, and dimensions illustrative |
| P09 | Catch basin | Collects water at ground level | Owner-described closed-loop destination; dimensions unresolved |
| P10 | Recirculation pump | Constantly supplies water from P09 up through P01 | Owner-described input; flow and head unresolved |
| P11 | Water load | Accumulates in cup and bowl; changes their weights | Owner-described driving load; water quantities unresolved |
| P12 | Bowl drain hole | Releases water from P04 more slowly than filling input | Owner-defined part; size, outflow destination, and drainage time unresolved |
| P13 | Top valve actuator/contact part | Contact at the cup's highest point opens P14 | Revised role of the same top contact, formerly described as triggering tilt; exact construction unresolved |
| P14 | Cup release valve | Opens while cup is held against P13; automatically closes when that contact is released | Owner-defined action; valve type, outlet, actuator linkage, and closing mechanism unresolved |
| P15 | Four M02 storage cones | Equally spaced chandelier arrangement below aqueducts; accumulate water before restricted release | Owner-defined count, shape, and arrangement; exact profiles, capacity, and suspension illustrative |
| P16 | M02 restricted outlets | Drain P15 toward P09 from cone bottoms, allowing complete release | Owner-defined function; one bottom outlet per cone illustrated; outlet sizes and drainage rates unresolved |
| P01-S | Lower screw section of stand | Fixed helical surface constraining sleeve travel/rotation | Owner-defined stand feature; actual profile, diameter, and lead unresolved |
| P17 | Cone support ring and radial connections | Joins all four cones to the central sleeve; translates and rotates with them | Owner-defined ring connection; radial arm construction illustrative |
| P18 | Central cylindrical sleeve | Surrounds stand and couples cone assembly to screw | Owner-defined cylinder; matching thread or follower interface unresolved |
| P19 | Non-rotating lifting collar | Travels with P18 but does not spin; receives counterweight pull | Assistant-proposed; guide and load balance unresolved |
| P20 | Thrust bearing between collar and sleeve | Transfers axial lifting force while permitting relative rotation | Assistant-proposed; bearing selection unresolved |
| P21 | M02 counterweight cord | Connects P19 via fixed redirecting pulleys to P23 | Assistant-proposed, schematic 1:1 routing |
| P22 | M02 fixed pulley arrangement | Redirects cord above the assembly's highest position and toward external weight | Assistant-proposed; balanced lift attachment and support design unresolved |
| P23 | M02 counterweight | Rises during cone descent; proposed to lower and lift drained cones on return | Assistant-proposed; mass must be calculated from whole moving assembly and resistance |
| P24 | Counterweight and lifting-collar guides | Keep weight outside rotating envelope and collar from spinning | Assistant-proposed; illustrated external rails, not engineered |

| ID | Mechanism | Definition | Status |
|---|---|---|---|
| M01 | Cup/bowl mechanism | P03 and P04 connected by P05 over P06 | Owner-defined mechanism; equal opposite travel intended |
| M02 | Screw-driven cone mechanism | P15/P17/P18 descend and rotate together on P01-S under water load, draining through P16 | Descent/spin owner-defined; counterweight return proposed; prescribed preview only |

| ID | Force or condition | Definition | Status |
|---|---|---|---|
| F01 | Opposing loaded weights | Gravity acts on each container and its retained water; P05 couples them through P06 | Qualitative physical relationship; no masses measured |
| F02 | Cup-on-bowl contact | P04 supports P03 at rest | Owner-described contact; actual contact surfaces and support constraints unresolved |
| C01 | M01 activation threshold | Bowl loading is sufficient to initiate bowl descent and cup ascent | Owner describes bowl becoming heavier than full cup; actual threshold needs friction and geometry evaluation |
| C02 | M01 target travel | Cup rises 5 feet and bowl descends 5 feet from rest | Owner-specified target; physical fit and lower/upper travel limits unresolved; distinct from C01 |
| C03 | Stream destination change | Rising cup clears fixed jets, exposing fixed aqueduct intakes to them | Owner-defined relationship; exact transition clearance and timing unresolved |
| C04 | Reset condition | Bowl drainage eventually permits P04 to rise and P03 to descend toward the nested resting pose | Return with residual cup water is accepted; required weight imbalance, remaining volume, and repeat timing not calculated |
| C05 | Cup-emptying trigger | P03 reaches its highest point and contact with P13 opens P14 | Owner-defined trigger; cup stays upright and discharge lands mostly in P04 |
| C06 | Cup valve closing condition | Cup leaves top contact P13 | Owner-defined automatic closing action; exact mechanical implementation unresolved |
| F03 | M02 loaded weight versus counterweight pull | Water changes the moving ring/sleeve/cone assembly's total weight relative to P23 | Proposed force relationship; masses and friction unmeasured |
| C07 | M02 activation threshold | Enough retained water to initiate assembly descent and rotation against resistance and proposed counterweight | Owner says full cones; exact fullness requires threshold tuning or an additional release mechanism, not yet selected |
| C08 | M02 target travel/rotation | Reach the bottom of the screw-guided stroke | Owner-defined destination; travel, turns, handedness, and physical stops unspecified |
| C09 | M02 return threshold | Proposed counterweight overcomes drained assembly weight and resistance | Proposed reset; owner has not yet confirmed return direction/sequence |

Movement statement: **P04 → 5 feet downward, coupled to P03 5 feet upward → relative to ground → C01 → separation and C03, followed by C05 at the top**. These strokes are targets; speed and timing are unspecified. Activation alone does not establish the full target travel or complete stream capture.

## Mechanical reasoning and validation

For an ideal fixed pulley with one taut, inextensible cord and suitable vertical routing, one endpoint descending requires the other to rise by the same distance. This supports the intended coupling in principle; actual routing, guides, and contact clearance have not been established. A cord transmits tension, not compression.

A 10-foot cord does not by itself establish two 5-foot usable strokes. Total cord length includes the path around the pulley and the distances to its attachment points; knots or attachment allowances also matter. Five feet each is retained as the owner's desired travel. Check the resting and extreme rim positions against the complete cord path, stand height, vessel dimensions, and top clearance before claiming a physical fit.

For that ideal arrangement, bowl-side weight exceeding cup-side weight provides a driving imbalance after contact releases. Real activation also depends on pulley and guide friction, cord geometry, and any other connected loads. The initial contact pose and both cord lengths must be geometrically compatible. No threshold mass, force, or speed has been calculated.

The owner specifies that raising the cup clears fixed jet paths and exposes the fixed aqueduct mouths. Exact stream paths and intake dimensions still need a clearance check, including bowl and cord travel. P14 is now an accepted cup valve; do not add a supply-diverting valve, moving nozzle, latch, guide, or other additional mechanism as an accepted part without discussion.

The bowl drain and top-triggered valve discharge supply intended unloading actions. Transferring cup water into the bowl initially increases the bowl-side load while reducing the cup-side load, tending to maintain the activated configuration. Continued bowl drainage can later permit the heavier cup side to descend and lift the bowl, as the owner intends. This requires the appropriate weight imbalance after resistance is included; it is not a validated reset prediction. Valve flow, bowl capacity and possible overflow, capture of the falling discharge around the stand and fixed channels, drain/refill timing, and stream recapture during return remain unresolved.

P14 closes as soon as top contact is lost. The owner explicitly permits residual cup water at departure. No extra latch or physical timed hold has been accepted. The cup remains upright, so there is no tipping clearance or upright-recovery movement to animate. Central openings still need a workable sliding, water-retaining arrangement around P01.

M02's slow release uses the accepted four storage cones and restricted outflow. Their complete-draining shape does not establish a drain rate. The current visual water curves are prescribed, not a storage/outflow calculation.

Feasibility evaluation will require container masses and capacities, retained water through travel, cord attachments and pulley layout, contact/guide friction, stroke and endpoint constraints, emitter locations and flow, pump head, aqueduct intake geometry, and cup/bowl discharge details. Owner acceptance of a mechanism does not make an illustrative animation a physical validation.

## Animation implementation

### Latest quick M02 preview

The current preview replaces stationary cone hangers with a shared ring, radial arms, and central sleeve. It shows a lower screw, a non-rotating lifting collar/bearing, and a guided external counterweight to the left of the stand in the reference camera. Weight placement is outside the cone rotation envelope; fixed redirecting pulleys are above the ring's highest pose. A balanced yoke/attachment would need engineering to prevent side loading; the displayed single lift point is a schematic force-path cue.

The prescribed cone stroke is **1.6 ft**, with **0.8 ft lead per revolution**, producing **two turns** during descent. These are assistant-selected illustration values, independent of M01's five-foot strokes. M02 fills until 21 s, descends/spins from 21–28 s, rests at the bottom until 31 s, then illustrates proposed counterweight lift/reverse spin from 31–39 s. Restricted drainage continues. Water and timing do not calculate activation, descent completion, or reset.

Aqueducts remain fixed. While the cones are displaced, the preview sends their fixed outlet streams to the catch basin, rather than making streams follow rotating cones. Intermittent cone recapture, structural/bowl clearances, rail/cable clearance, stopping impacts, and continuous-fill dynamics are not solved.

**Mechanical recommendation, not validated design:** guide a counterweight beside the stand outside the rotating cones and spray. Pull a non-rotating collar through a thrust bearing against the rotating sleeve, rather than attaching the cord directly to the spinning ring. In a nominal 1:1 arrangement, counterweight force must exceed the drained moving assembly's weight plus return resistance, yet remain below loaded assembly weight minus descent resistance. Include ring, sleeve, cones, moving collar, retained water, and bearing/guide/screw/pulley resistance. No numerical counterweight is selected.

The screw must permit load-driven rotation (backdriving). A self-locking thread may not descend under water load. Lead, diameter, friction, and load require calculation/testing; a coarse helix alone is not proof. See [Roton's backdriving explanation](https://www.roton.com/screw-university/screw-actions/screw-backdriving-efficiency/) and [NSK's thrust bearing overview](https://www.nsk.com/am-en/tools-resources/knowledge-center/bearing-abcs/thrust-bearings/). The collar arrangement is an engineering proposal based on those component functions, not a manufacturer-approved assembly.

Fullness is the desired activation state, distinct from reaching the bottom. Without a latch, threshold crossing could occur before all cones are full; a tuned load threshold does not establish an exact fill level. Rotation reverses on the proposed upward return along the same fixed helix. Neither the return nor its timing has been physically validated.

Per the owner's quick-preview instruction, the full build/check/test pass is **not repeated for this M02 update**. Previous verification below applies to the earlier baseline.

The standalone page uses the shared player, existing Art styles, and scoped local style additions in `study.css`. `/art/` links to this study without changing the Austin Rain featured canvas or modules.

- `model.js` owns adjustable geometry and schematic channel paths.
- `motion.js` owns poses and illustrative stage timing.
- `render.js` owns drawing, including fixed jet arcs clipped at the cup rim plane.
- `index.js` mounts an independent canvas using `../../shared/player.js`.
- `index.html` uses scoped controls and unique accessible IDs.

### Original M01 loop / earlier static-cone baseline

| Stage | Illustrative time | Visible behavior |
|---|---|---|
| Resting / input | 0–6 s | Nested vessels; continuous fixed jets fill the cup |
| Cup overflows | 6–11 s | Cup remains full; overflow increases bowl load while bowl drains |
| Activated / separate | 11–17 s | Cup rises and bowl descends equally toward five-foot targets; jets reach aqueducts as cup clears them |
| Top valve open | 17–23 s | Upright cup contacts actuator; discharge enters bowl; cones accumulate and drain |
| Return / valve closed | 23–32 s | Contact ends, valve immediately closes, cup returns with water remaining and bowl rises |
| Nested / cones draining | 32–40 s | Vessels settle; cup resumes filling; cones continue draining and empty before the loop seam |

This is a recurring-operation loop. It begins with 35% illustrative cup water retained/refilled from the prior return, not the original completely empty startup. The cup retains 20% at departure; these fractions and all water levels are illustration values, not measured volumes. Pump input is continuous. The visual top dwell is scheduled; no physical latch or timer is implied.

All dimensions except the owner's five-foot target strokes and specified 10-foot cord are illustration choices. The renderer does not solve constant cord length, cord/stand interference, guides, central seals, nozzle clearance during vessel passage, exact nesting contact, water capture, conservation of volume, hydraulic residence time, or force balance. The square nozzle manifold and fixed chandelier arms/hangers are illustrative mounting cues. P02's eventual pivot construction is not designed; the first study shows no extra pivoting mechanism.

The same fixed jet curves are used before and after separation; the view clips them where they meet the cup rim plane. Motion uses a geometric height cue to fade aqueduct feed; no jet speed, pressure, pump head, or ballistic dynamics are calculated. Inlet dimensions and the interception of the falling cup discharge still need physical clearance checks.

Cone instances are not physically numbered yet. Internal array indexes are rendering order, not accepted atlas instance IDs.

Do not invent dimensions, activation thresholds, target angles, timing, or reset behavior silently. Record any illustrative values and distinguish them from accepted physical inputs.

## Remaining design inputs and next review

Review the quick M02 preview for ring/sleeve appearance, descent and spin, counterweight location, and the proposed reverse-spin reset. Physical inputs still needed include cup/bowl profiles and masses/capacities, central seals and guide clearances, cord routing and dimensional fit, valve construction, flow rates, bowl/cone outlet sizes, structural support, screw/follower geometry, M02 stroke and lead, activation/fullness behavior, counterweight mass/routing, and travel stops.

Original references and temporary exports belong under ignored `.local/art/two-step-sculpture/`. The owner authorized publishing this preview through GitHub Pages from main, with further checks and deployment verification explicitly waived. The local repository-root preview is on port 5198; network addresses are transient and are not design dimensions or deployment URLs.

## Verification of the first study

`npm ci`, `npm run typecheck`, `npm run check:syntax`, `npm run build`, and `npm test` completed successfully (13 tests, including Art regressions). New checks cover opposite target strokes, valve contact/departure, residual cup water, recurring poses, cone drainage through return, page references, and finite renderer commands at phone/desktop sizes. These are software checks, not physical validation.

Browser inspection covered desktop/mobile layout, stage seeking, keyboard timeline movement, speed selection, gallery navigation, raised emitter placement, and console errors (none reported). Shared-player tests cover reduced motion, independent players, and cleanup; reduced motion was not separately switched on in the live OS. Austin Rain source, shared player/styles, Home Services generated files, and CNAME remain unchanged.
