export const SAFE_HOUSE_ZONES = [{
  key: 'kitchen',
  emoji: '🍳',
  label: 'Near the Stove'
}, {
  key: 'curtains',
  emoji: '🪟',
  label: 'By the Curtains'
}, {
  key: 'hallway',
  emoji: '🚪',
  label: 'The Exit Hallway'
}, {
  key: 'bedroom',
  emoji: '🛏️',
  label: 'The Bedroom'
}, {
  key: 'outlet',
  emoji: '🔌',
  label: 'The Wall Outlet'
}];
export const SAFE_HOUSE_ITEMS = [{
  id: 'extinguisher',
  emoji: '🧯',
  name: 'Fire Extinguisher',
  safeZones: ['kitchen'],
  dangerZones: [],
  why: 'A fire extinguisher belongs near the stove, where most house fires start - so it\'s ready the second you need it.'
}, {
  id: 'alarm',
  emoji: '🚨',
  name: 'Smoke Alarm',
  safeZones: ['bedroom', 'hallway'],
  dangerZones: [],
  why: 'Smoke alarms work best in bedrooms and hallways, so they wake you up in time to escape.'
}, {
  id: 'heater',
  emoji: '🔥',
  name: 'Space Heater',
  safeZones: [],
  dangerZones: ['curtains', 'bedroom'],
  why: 'A heater next to curtains or bedding can set fabric on fire - heaters need open space around them.'
}, {
  id: 'candle',
  emoji: '🕯️',
  name: 'Candle',
  safeZones: [],
  dangerZones: ['curtains'],
  why: 'A candle near curtains is one of the most common ways house fires start. Never place a flame near fabric.'
}, {
  id: 'charger',
  emoji: '🔌',
  name: 'Phone Charger',
  safeZones: ['outlet'],
  dangerZones: [],
  why: 'One charger in a single outlet is safe - that\'s exactly what outlets are for.'
}, {
  id: 'powerstrip',
  emoji: '🔋',
  name: 'Overloaded Power Strip',
  safeZones: [],
  dangerZones: ['outlet', 'bedroom'],
  why: 'Plugging too many things into one outlet can overheat the wires and start a fire.'
}, {
  id: 'boxes',
  emoji: '📦',
  name: 'Stack of Boxes',
  safeZones: [],
  dangerZones: ['hallway'],
  why: 'Boxes blocking the hallway trap you inside if there\'s ever smoke or fire - exits must always stay clear.'
}, {
  id: 'blanket',
  emoji: '🧣',
  name: 'Fire Blanket',
  safeZones: ['kitchen'],
  dangerZones: [],
  why: 'A fire blanket in the kitchen can smother a small stove fire before it spreads.'
}];
