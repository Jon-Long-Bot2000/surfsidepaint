// Source: supplied November 1 walkthrough proposal and owner clarifications.
// Prices are complete, mutually exclusive packages; never add their line items.
export const proposal = {
  prepared: '2026-11-04',
  validThrough: '2026-12-04',
  client: { name: 'Janet Davis', phone: '805-798-3562' },
  property: {
    address: '461 Avenida Del Recreo', city: 'Ojai, CA 93023',
    beds: 3, baths: 1, sqft: 1438, acres: 0.69, built: 1940,
    type: 'Single-family', zestimate: 1094000, pricePerSqft: 761,
    estimatedRent: 4278, estimatedRefinancePayment: 7303, hardwoodSqft: 900,
  },
  phases: [
    { id: 'whole-house', number: '01', title: 'Whole-house foundations', short: 'Whole house', description: 'Preserve the character. Improve the everyday.', sequence: 'Window and door work, followed by floor finishing once work that could damage the finish is complete. Scheduling to be confirmed.' },
    { id: 'interiors', number: '02', title: 'Rooms & interior finishes', short: 'Rooms & interiors', description: 'Thoughtful repairs, room by room.', sequence: 'Prepare the main house for rental. Coordinate room access while Janet continues to live in the home. Scheduling to be confirmed.' },
    { id: 'outdoors', number: '03', title: 'Exterior & grounds', short: 'Exterior & grounds', description: 'A welcoming arrival. A more usable property.', sequence: 'Coordinate exterior repairs before exterior painting. Prioritize the front house and grounds before shifting focus to the cottage. Scheduling to be confirmed.' },
  ],
};

const option = (id, title, price, description, scope, notes = []) => ({ id, title, price, description, scope, notes, duration: null });

export const categories = [
  {
    id: 'windows', phase: 'whole-house', title: 'Windows', kind: 'essential',
    condition: 'The existing windows appear to match throughout and retain valuable original character, but are not energy efficient.',
    options: [
      option('A', 'Refurbish existing', 4000, 'Keep the original character.', [
        'Service ropes and weights; calibrate windows.', 'Replace components as needed, repair glazing, and install weatherstripping.',
      ], ['Existing windows are not energy efficient.']),
      option('B', 'Retrofit replacement', 18000, 'Invest in high-efficiency windows.', [
        'Replace existing windows with retrofit windows, if compatible.',
      ], ['Compatibility must be confirmed.', 'Higher upfront cost; the proposal describes potential long-term energy and resale benefits.']),
    ],
  },
  {
    id: 'doors', phase: 'whole-house', title: 'Doors', kind: 'essential',
    condition: 'Refresh the doors and unify the hardware to support long-term rental use.',
    options: [
      option('A', 'Refurbish existing', 4000, 'Refresh doors and matching hardware.', ['Refurbish existing doors to meet requirements for attracting long-term renters.', 'Install new, matching handles throughout.']),
      option('B', 'Replace doors', 11000, 'Upgrade materials throughout.', ['Install solid-core interior doors.', 'Install solid wood or glass-panel exterior doors.', 'Install new, matching handles throughout.']),
    ],
  },
  {
    id: 'floors', phase: 'whole-house', title: 'Hardwood floors', kind: 'essential',
    condition: 'Finish 900 square feet of existing hardwood, using the area confirmed by the owner.',
    options: [
      option('A', 'Polyurethane recoat', 4500, 'A durable, lower-maintenance finish.', ['Recoat 900 square feet of hardwood with polyurethane.'], ['The proposal describes less labor, cheaper materials, greater durability, and less maintenance than the hard-wax oil alternative.']),
      option('B', 'Hard-wax oil refinish', 7650, 'A more refined natural finish.', ['Refinish 900 square feet of hardwood with hard-wax oil.'], ['The proposal describes this as the nicer finish.']),
    ],
  },
  {
    id: 'living', phase: 'interiors', title: 'Living room', kind: 'essential',
    condition: 'Repair termite-damaged floor areas and refresh fixtures, trim, and the fireplace mantel.',
    options: [
      option('A', 'Repair & refresh', 2500, 'Address the essentials.', ['Repair termite-damaged areas of hardwood floor.', 'Replace light fixtures.', 'Repair trim.', 'Install a new fireplace mantel.']),
      option('B', 'Fireplace upgrade', 3700, 'Add a plaster fireplace finish.', ['All Living Room Option A work.', 'Install a plaster finish over the fireplace brick.']),
    ],
  },
  {
    id: 'kitchen', phase: 'interiors', title: 'Kitchen', kind: 'essential',
    condition: 'The proposal identifies Option A work as required before renting the house.',
    options: [
      option('A', 'Rental-ready refresh', 8000, 'Restore the kitchen for daily use.', ['Repaint cabinets: standard preparation, prime, and paint to a contractor-grade finish.', 'Replace flooring.', 'Refurbish countertops.', 'Replace the hood.', 'Replace light fixtures.', 'Hide ceiling damage.']),
      option('B', 'Enhanced renovation', 19000, 'Upgrade finishes and key fixtures.', ['Includes the Option A scope, with upgraded cabinet, countertop, and ceiling treatments.', 'Refurbish cabinets with premium preparation, filler, prime, and paint to a designer-grade finish.', 'Replace hinges and handles.', 'Install new countertops and a new sink.', 'Repair ceiling drywall: new tape around edges, float repair areas, skim the entire surface, and texture.'], ['A single complete package price is used; standard and upgraded treatments are not priced twice.']),
      option('C', 'Full kitchen remodel', 45000, 'A complete kitchen transformation.', ['Full kitchen remodel: new everything.'], ['Detailed specifications for the full remodel are not provided in the source proposal.']),
    ],
  },
  {
    id: 'laundry', phase: 'interiors', title: 'Laundry room', kind: 'essential',
    condition: 'Address rodent-damaged flooring, wall repairs, and worn finishes.',
    options: [
      option('A', 'Repair & refresh', 2000, 'Restore the room’s essentials.', ['Repair the rodent-damaged floor and replace flooring.', 'Remove wallpaper.', 'Repair the southern wall with the electrical panel.', 'Repaint cabinets.', 'Replace the broken window pane.', 'Install a new exterior door threshold.']),
      option('B', 'Enhanced utility room', 3700, 'Add storage and upgraded cabinetry.', ['All Laundry Room Option A work.', 'Build a water heater closet.', 'Refurbish cabinets with new hardware and a designer-grade finish.']),
    ],
  },
  {
    id: 'hallway', phase: 'interiors', title: 'Hallway', kind: 'essential',
    condition: 'Refresh the connecting spaces with coordinated details.',
    options: [option('A', 'Hardware & trim repairs', 500, 'A considered finish between rooms.', ['Replace cabinet and drawer handles.', 'Replace or install the light fixture.', 'Repair trim.'])],
  },
  {
    id: 'bedroom-1', phase: 'interiors', title: 'Bedroom 1', kind: 'essential',
    condition: 'Address failing paint and damaged trim or casings.',
    options: [
      option('A', 'Repair & refresh', 800, 'Repair surfaces and update lighting.', ['Replace light fixtures.', 'Remove failing paint.', 'Repair damaged trim and casings.']),
      option('B', 'Ceiling restoration', 1200, 'Include a fully retextured ceiling.', ['All Bedroom 1 Option A work.', 'Repair and retexture the entire ceiling.']),
    ],
  },
  {
    id: 'bedroom-2', phase: 'interiors', title: 'Bedroom 2', kind: 'essential',
    condition: 'Repair water-damaged drywall on the south wall and worn finishes.',
    options: [option('A', 'Repair & refresh', 1200, 'Address wall damage and finishes.', ['Repair water-damaged drywall on the south wall.', 'Replace light fixtures.', 'Remove failing paint.', 'Repair damaged trim and casings.'])],
  },
  {
    id: 'bathroom', phase: 'interiors', title: 'Bathroom', kind: 'essential',
    condition: 'Improve the existing bathroom, including shower runoff, fixtures, and tile grout.',
    options: [
      option('A', 'Essential refresh', 2500, 'Improve function and brighten finishes.', ['Install a shower curb to prevent excessive floor runoff; no bathtub.', 'Install a new vanity, mirror, and light fixtures.', 'Repair and brighten tile grout.']),
      option('B', 'Shower & bathtub upgrade', 6000, 'Introduce a new shower and bathtub.', ['All Bathroom Option A work except the shower curb.', 'Remove the pony-wall bench.', 'Install a new shower and bathtub.']),
      option('C', 'Full bathroom remodel', 15000, 'Reimagine the entire room.', ['All Bathroom Option B work.', 'Full remodel, including floor replacement.']),
    ],
  },
  {
    id: 'primary-bedroom', phase: 'interiors', title: 'Primary bedroom', sourceTitle: 'Master Bedroom', kind: 'essential',
    condition: 'Repair the exterior-door floor and threshold, update lighting, and address cracked closet plaster; alternatively, consider a private bathroom addition.',
    options: [
      option('A', 'Repair & refresh', 1200, 'Restore the existing bedroom.', ['Repair the floor at the exterior door.', 'Install a new threshold and new light fixtures.', 'Repair cracked plaster in the closet.']),
      option('B', 'Private bathroom addition', 30000, 'Add a bathroom for this bedroom.', ['Bathroom addition: consider adding a private bathroom for this room.'], ['Per the owner’s clarification, this package does not include the Primary Bedroom Option A repairs. It replaces that selection in this comparison.']),
    ],
  },
  {
    id: 'interior-paint', phase: 'interiors', title: 'Interior repaint', kind: 'essential',
    condition: 'Bring the main house together with coordinated interior paint finishes.',
    options: [
      option('A', 'Standard repaint', 8000, 'A simple, cohesive interior palette.', ['Standard preparation, spot prime, and paint.', 'Single-color satin finish for body and trim throughout.', 'Flat white ceilings.'], ['Some stains may reappear.']),
      option('B', 'Premium repaint', 10000, 'More definition and premium finishes.', ['Premium paint with two colors for satin body and semi-gloss urethane trim.', 'One additional accent-wall color.']),
    ],
  },
  {
    id: 'exterior-repairs', phase: 'outdoors', title: 'Exterior repairs', kind: 'essential',
    condition: 'Address missing or damaged siding, porch deterioration, exposed areas, and a leaking carport roof.',
    options: [option('A', 'Repair & protect', 3000, 'Resolve the identified exterior repairs.', ['South: replace missing siding and replace battens as needed.', 'East: repair the water-damaged porch ceiling and railings.', 'North: install crawlspace doors and vent covers, replace broken siding, address the exposed electrical box, and remove the damaged gutter.', 'West: clean up wires and replace battens.', 'Install gutters in critical locations.', 'Carport: repair the leaking roof.'], ['Complete package estimate confirmed by the owner. Coordinate these repairs before exterior painting.'])],
  },
  {
    id: 'exterior-paint', phase: 'outdoors', title: 'Exterior repaint', kind: 'essential',
    condition: 'Refresh the exterior while coordinating repair work and color selection.',
    options: [
      option('A', 'Standard repaint', 8000, 'A fresh, coordinated exterior.', ['Standard preparation, spot prime, and paint.', 'Two colors for body and trim; front porch the same color as the body.', 'Paint the chimney.'], ['Uneven surfaces may remain.']),
      option('B', 'Premium repaint', 11000, 'More detailed preparation and paint.', ['More detailed preparation and premium paint.'], ['The source describes the intended finish as “repairs and blemishes disappear.” Final repair scope and finish expectations must be confirmed.']),
    ],
  },
  {
    id: 'front-yard', phase: 'outdoors', title: 'Front yard', kind: 'recommended', optional: true,
    condition: 'Create a welcoming entrance and a simpler landscape with lower water and maintenance needs.',
    options: [option('A', 'Welcoming arrival', 3500, 'Thoughtful planting and a clear path.', ['Design a low-maintenance, low-water-use landscape with a welcoming front entrance, a thoughtful path, and a simplified feel that increases curb appeal.'])],
  },
  {
    id: 'side-yard', phase: 'outdoors', title: 'Side yard', kind: 'recommended', optional: true,
    condition: 'Clear and improve the yard off the primary bedroom, with privacy and controlled access.',
    options: [option('A', 'Clear & create privacy', 3500, 'A more usable space off the bedroom.', ['Remove the pond.', 'Clear brush, firewood, stumps, trash, and other debris.', 'Install a privacy fence from the south property line to the side door, with a gate.', 'Install a gate to the backyard.', 'Install ground covering.'])],
  },
  {
    id: 'back-yard', phase: 'outdoors', title: 'Backyard', kind: 'recommended', optional: true,
    condition: 'Improve grading, fencing, privacy, and the separation between the main house and cottage.',
    options: [option('A', 'Privacy & usable space', 4000, 'Define the yard and cottage boundary.', ['Replace rake wire support.', 'Grade or level selected areas and install ground covering.', 'Remove gates to the cottage; add a gate to the driveway.', 'Extend the carport fence the full length of the yard.', 'Extend the privacy fence between the main house and cottage.', 'Plant hedges or vines to hide the cottage and utilize the privacy fence.', 'Reconfigure wire fencing to extend the center length of the yard.', 'Protect above-ground water drain and septic vents.'])],
  },
];

// These are supplied proposal assumptions, not independently verified returns.
export const roiAssumptions = {
  windows: { resaleRecovery: 0.685, energyReduction: 0.25, sourcePaybackYears: 6, illustrativeAnnualHvac: 3000, illustrativeAnnualSavings: 750, illustrativeHvacCost: 10000, illustrativeHvacLife: 15, illustrativeLifeExtension: 3, illustrativeAssetSavings: 2000 },
  bathroom: { resaleRecovery: 0.60, monthlyRentIncreaseMinimum: 200, sourcePaybackYears: [2, 4] },
  repaint: { resaleRecovery: 0.65, propertyValueIncrease: [0.02, 0.05], monthlyRentIncreaseMinimum: 150, requiresCompleteProperty: true },
  addition: { rentCapacityIncrease: 0.10, propertyValueIncrease: null },
};
