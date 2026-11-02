// Illustration units, not measured physical dimensions. See README.md / Atlas v2.
export const MODEL = Object.freeze({
  slats: 16,           // P03: visual count; the physical count is unconfirmed.
  radius: 73,         // P02: represented pivot-support radius.
  length: 270,        // P03-B: blade length below the pivot.
  handle: 70,         // P03-H: lever-tip length above the pivot.
  width: 23,
  opening: 0.80,      // Additional illustrated tilt, radians; not a confirmed C02 target.
  restingTilt: 0.035,
  bowlRestY: 195,     // P06: renderer y increases downward.
  bowlTravel: 31,
});
