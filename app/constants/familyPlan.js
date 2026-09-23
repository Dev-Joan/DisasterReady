// Redesigned for readers as young as 6: `label` is a 1-3 word caption under
// a big picture card, and `speak` is the full sentence read aloud with
// expo-speech (see useKidSpeech) — the idea a non-reader still gets, just
// by ear instead of by reading a paragraph.
export const MEETING_POINT_OPTIONS = [
  { id: 'tree', emoji: '🌳', label: 'Big Tree', speak: 'Meet at a big tree or landmark outside.' },
  { id: 'neighbor', emoji: '🏡', label: "Neighbor's House", speak: "Meet at a trusted neighbor's house." },
  { id: 'school', emoji: '🏫', label: 'School', speak: 'Meet at the school sign or gate.' },
  { id: 'park', emoji: '🏞️', label: 'Park', speak: 'Meet at a park bench nearby.' }
];

export const FAMILY_MEMBER_OPTIONS = [
  { id: 'mom', emoji: '👩', label: 'Mom', speak: 'Call Mom.' },
  { id: 'dad', emoji: '👨', label: 'Dad', speak: 'Call Dad.' },
  { id: 'grandma', emoji: '👵', label: 'Grandma / Grandpa', speak: 'Call Grandma or Grandpa.' },
  { id: 'sibling', emoji: '🧒', label: 'Brother / Sister', speak: 'Call your brother or sister.' },
  { id: 'neighbor', emoji: '🏡', label: 'Neighbor', speak: 'Call a trusted neighbor.' },
  { id: 'emergency', emoji: '🚑', label: '911', speak: 'Call Emergency Services, 911.' }
];

export const GO_BAG_ITEMS = [
  { id: 'water', emoji: '💧', label: 'Water', speak: 'Water — your body needs it every day, even in an emergency.' },
  { id: 'snacks', emoji: '🥫', label: 'Snacks', speak: "Snacks that last — food that doesn't spoil keeps your energy up." },
  { id: 'flashlight', emoji: '🔦', label: 'Flashlight', speak: 'Flashlight — lets you see safely if the power goes out.' },
  { id: 'firstaid', emoji: '🩹', label: 'First Aid', speak: 'First aid kit — for treating small cuts and scrapes.' },
  { id: 'charger', emoji: '🔋', label: 'Charger', speak: 'Phone charger — keeps your phone alive to call for help.' },
  { id: 'meds', emoji: '💊', label: 'Medicine', speak: 'Any medicine you need every day.' },
  { id: 'comfort', emoji: '🧸', label: 'Comfort Toy', speak: 'A comfort item — a favorite toy helps you feel calm.' },
  { id: 'documents', emoji: '📄', label: 'ID Papers', speak: 'Copies of important papers, like ID.' }
];
