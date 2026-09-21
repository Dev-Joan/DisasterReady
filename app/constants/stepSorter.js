// Earthquake "Step Sorter" mini-game: each round is a real safety procedure
// the kid must place into the correct order. `steps` is written in the
// correct order already — the screen shuffles it for display.
export const STEP_SORTER_ROUNDS = [
  {
    id: 'shaking-starts',
    title: 'The ground starts shaking!',
    emoji: '🫨',
    steps: [
      { id: 'drop', emoji: '🙇', text: 'Drop to your hands and knees right away' },
      { id: 'cover', emoji: '🛡️', text: 'Cover your head and neck under a sturdy table' },
      { id: 'hold', emoji: '✊', text: 'Hold on and stay there until the shaking fully stops' },
      { id: 'check', emoji: '🩹', text: 'Check yourself and people near you for injuries' }
    ],
    wrongOrderWhy: {
      drop: 'If you don\'t drop first, you could be knocked over by the shaking before you\'re protected.',
      cover: 'Covering your head only works after you\'ve dropped down low — otherwise falling objects can still hit you.',
      hold: 'Letting go too soon means you could still get hurt while the ground is moving.',
      check: 'Checking for injuries only makes sense once the shaking has actually stopped.'
    }
  },
  {
    id: 'shaking-stops',
    title: 'The shaking just stopped',
    emoji: '🏚️',
    steps: [
      { id: 'stay-calm', emoji: '😌', text: 'Stay calm and check for injuries first' },
      { id: 'check-hazards', emoji: '🔥', text: 'Look for hazards like gas smells, sparks, or broken glass' },
      { id: 'grab-bag', emoji: '🎒', text: 'Grab your emergency bag if it\'s safe to reach' },
      { id: 'go-outside', emoji: '🚪', text: 'Go to your family\'s outdoor meeting point' },
      { id: 'wait-news', emoji: '📻', text: 'Listen to the radio or a grown-up for what to do next' }
    ],
    wrongOrderWhy: {
      'stay-calm': 'Checking on yourself and others always comes first — you can\'t help anyone if you\'re hurt too.',
      'check-hazards': 'You need to know it\'s safe to move around before grabbing anything or walking through the house.',
      'grab-bag': 'Your bag only matters once you know the path to it is safe.',
      'go-outside': 'Getting to the meeting point comes after you have your bag and know the way is clear.',
      'wait-news': 'Once your family is together and safe, that\'s when you listen for updates on what to do next.'
    }
  },
  {
    id: 'at-school',
    title: 'You feel shaking at school',
    emoji: '🏫',
    steps: [
      { id: 'drop-desk', emoji: '🪑', text: 'Drop under your desk right where you are' },
      { id: 'hold-desk', emoji: '✊', text: 'Hold onto a desk leg and cover your neck' },
      { id: 'wait-teacher', emoji: '🧑‍🏫', text: 'Wait for your teacher to say it\'s safe to move' },
      { id: 'line-up', emoji: '🚶', text: 'Walk calmly in line to the meeting spot outside' }
    ],
    wrongOrderWhy: {
      'drop-desk': 'You need to get down low immediately, before doing anything else, even at school.',
      'hold-desk': 'Holding on matters once you\'re already down and covered — not before.',
      'wait-teacher': 'Never move on your own until an adult says the shaking has stopped and it\'s safe.',
      'line-up': 'Heading outside only happens after an adult gives the all-clear.'
    }
  }
];
