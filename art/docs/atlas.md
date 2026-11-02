# Shared sculpture atlas language

This is the common language for all kinetic sculpture designs in `art/`. Each design has a separate parts and movement atlas in its own `README.md`. The initial worked example is [Austin Rain Prototype — Atlas v2](../sculptures/austin-rain-prototype/README.md#atlas-v2).

## References and certainty

- `P01`, `P02`, and similar IDs identify parts within one design. IDs are stable; do not renumber them to match file order or reuse retired IDs for different parts.
- A suffix identifies a feature of a part, such as `P03-B` for a slat's blade and `P03-H` for its lever tip. Those features belong to the same rigid body.
- `F01` identifies a force relationship; `C01` identifies a condition or desired state. Forces and thresholds are not physical components.
- When referring to several sculptures, qualify the ID with the design name or slug.
- For repeated pieces, use instance references such as `P03[01]` only after recording the reference view and numbering convention. Austin's physical instance numbering has not been established.
- Label statements as confirmed physical behavior, desired outcome, illustrative assumption, unresolved detail, or missing mechanism. Owner confirmation of the real mechanism does not mean the animation calculates it.

## Movement terms

| Term | Shared meaning |
|---|---|
| Open / close | Overall shape change or outcome; specify which parts and directions create it. |
| Rotate / swing | Turn about a pivot or axis. |
| Translate / travel | Change position without necessarily turning. |
| Inward / outward | Toward / away from the sculpture's declared center or central support. |
| Upward / downward | Away from / toward the ground, independent of the camera. |
| Left / right | Relative to an explicitly named reference view. |
| Taut / slack | A cord is carrying tension / is loose. Cords transmit pulls rather than pushes. |
| Hold | Maintain a specified pose or condition for a specified duration, if provided. |
| Return | Move back to a named reference pose. |
| Resting pose | The agreed starting/reference configuration; define it separately for each sculpture. |
| Opening angle | Rotation measured from the agreed resting pose; specify the part and units. |
| Activation threshold | The condition at which the intended movement begins. |
| Target opening | The desired extent of opening; reaching activation does not establish that this target has been reached. |
| Input / output | What enters or drives the mechanism / the movement or effect it produces. |
| Reset mechanism | What returns the sculpture to its resting condition. |

## Describing a change

Use: **part → movement → reference/direction → trigger → desired outcome**, adding amount and timing when known. Record unknown values rather than inventing them.

Example: “In Austin Rain Prototype, keep P01 and P02 fixed. Rotate P03 so P03-B moves outward as P06 descends. Hold the target opening for three seconds, then return to rest.” The hold is a proposed instruction, not a claim about existing physical control.

Keep cause and appearance separate. A motion study prescribes poses and timing to illustrate an idea. A physics simulation calculates behavior from declared quantities and constraints. Record which mode each design uses and which measurements or mechanisms remain missing.
