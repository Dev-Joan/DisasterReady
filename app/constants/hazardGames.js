// Kit items per hazard: correct = belongs in the kit, false = decoy
export const HAZARD_DATA = {
  flood: {
    label: 'Flood',
    emoji: '🌊',
    color: '#38BDF8',
    intro: 'A big rainstorm is coming and the river is rising!',
    items: [
      { id: 'water', emoji: '💧', name: 'Water', correct: true, iconBg: '#DBEAFE', why: 'Clean water keeps your body strong while waiting for help.' },
      { id: 'snacks', emoji: '🥫', name: 'Snacks', correct: true, iconBg: '#DCFCE7', why: 'Energy boosters to keep you active during an emergency.' },
      { id: 'flashlight', emoji: '🔦', name: 'Flashlight', correct: true, iconBg: '#FEF3C7', why: 'Helps you see safely when electricity is out.' },
      { id: 'radio', emoji: '📻', name: 'Radio', correct: true, iconBg: '#FCE7F3', why: 'Listen for important safety updates.' },
      { id: 'firstaid', emoji: '🩹', name: 'First Aid', correct: true, iconBg: '#FEE2E2', why: 'Supplies to help with little injuries.' },
      { id: 'boots', emoji: '🥾', name: 'Rubber Boots', correct: true, iconBg: '#FFEDD5', why: 'Keep your feet dry and safe in flood water.' },
      { id: 'contacts', emoji: '📱', name: 'Contact Card', correct: true, iconBg: '#CCFBF1', why: 'Numbers to reach trusted adults and emergency services.' },
      { id: 'teddy', emoji: '🧸', name: 'Teddy Bear', correct: true, iconBg: '#EDE9FE', why: 'A favorite item brings comfort in stressful moments.' },
      { id: 'console', emoji: '🎮', name: 'Game Console', correct: false, iconBg: '#FEE2E2', why: "Fun, but it won't keep you safe in a flood!" },
      { id: 'tv', emoji: '📺', name: 'Television', correct: false, iconBg: '#F1F5F9', why: "Too big and heavy — it can't help you!" },
      { id: 'candy', emoji: '🍭', name: 'Candy', correct: false, iconBg: '#FCE7F3', why: "Healthy snacks give you real energy — sweets don't!" },
      { id: 'ball', emoji: '⚽', name: 'Football', correct: false, iconBg: '#F1F5F9', why: 'Playing comes later — safety first, little hero!' }
    ],
    dangers: [
      { id: 'wire', emoji: '⚡', safe: '🔌', x: 30, y: 100, name: 'Loose wire in water', why: 'Never touch electricity near water — turn it off!' },
      { id: 'candle', emoji: '🕯️', safe: '💡', x: 220, y: 130, name: 'Burning candle', why: 'Candles can start fires — use a flashlight instead!' },
      { id: 'window', emoji: '🪟', safe: '✅', x: 120, y: 260, name: 'Open window in storm', why: 'Close windows so rain and wind stay out!' },
      { id: 'exit', emoji: '📦', safe: '🚪', x: 250, y: 300, name: 'Blocked doorway', why: 'Keep exits clear so you can escape quickly!' },
      { id: 'spill', emoji: '🫗', safe: '🧹', x: 40, y: 380, name: 'Water on the floor', why: 'Wet floors are slippery — clean spills right away!' }
    ],
    gates: [
      { question: 'Flood water is rising! Where do you go?', answers: ['Basement', 'Higher ground', 'Under a bridge'], correct: 1 },
      { question: 'You see flood water on the road. You should...', answers: ['Walk through it', 'Go around it', 'Swim in it'], correct: 1 },
      { question: 'The power went out! What do you use for light?', answers: ['Candles everywhere', 'A flashlight', 'The oven'], correct: 1 }
    ]
  },

  earthquake: {
    label: 'Earthquake',
    emoji: '🏚️',
    color: '#F59E0B',
    intro: 'The ground is starting to shake — get ready to stay safe!',
    items: [
      { id: 'water', emoji: '💧', name: 'Water', correct: true, iconBg: '#DBEAFE', why: 'Water may be cut off after a quake — store some!' },
      { id: 'snacks', emoji: '🥫', name: 'Canned Food', correct: true, iconBg: '#DCFCE7', why: 'Food that lasts keeps you going if shops close.' },
      { id: 'flashlight', emoji: '🔦', name: 'Flashlight', correct: true, iconBg: '#FEF3C7', why: 'Power often fails after a quake — you need light.' },
      { id: 'helmet', emoji: '⛑️', name: 'Helmet', correct: true, iconBg: '#FEE2E2', why: 'Protects your head from falling objects.' },
      { id: 'whistle', emoji: '🎽', name: 'Whistle', correct: true, iconBg: '#FCE7F3', why: 'Blow it so rescuers can find you if you\'re trapped.' },
      { id: 'firstaid', emoji: '🩹', name: 'First Aid', correct: true, iconBg: '#FEE2E2', why: 'Helps treat cuts from broken glass and debris.' },
      { id: 'shoes', emoji: '👟', name: 'Sturdy Shoes', correct: true, iconBg: '#FFEDD5', why: 'Protect your feet from broken glass on the floor.' },
      { id: 'radio', emoji: '📻', name: 'Radio', correct: true, iconBg: '#CCFBF1', why: 'Hear official updates when phones don\'t work.' },
      { id: 'console', emoji: '🎮', name: 'Game Console', correct: false, iconBg: '#FEE2E2', why: "It won't help in an earthquake — leave it!" },
      { id: 'balloon', emoji: '🎈', name: 'Balloon', correct: false, iconBg: '#F1F5F9', why: 'Fun, but not useful when the ground shakes!' },
      { id: 'candy', emoji: '🍭', name: 'Candy', correct: false, iconBg: '#FCE7F3', why: 'Real food keeps you stronger than sweets.' },
      { id: 'skateboard', emoji: '🛹', name: 'Skateboard', correct: false, iconBg: '#F1F5F9', why: 'Too big to carry and not for emergencies!' }
    ],
    dangers: [
      { id: 'shelf', emoji: '🗄️', safe: '🔩', x: 30, y: 90, name: 'Unsecured shelf', why: 'Bolt tall furniture to the wall so it can\'t fall!' },
      { id: 'mirror', emoji: '🪞', safe: '✅', x: 230, y: 120, name: 'Mirror over bed', why: 'Don\'t hang heavy things above where you sleep!' },
      { id: 'vase', emoji: '🏺', safe: '📦', x: 110, y: 240, name: 'Vase on high shelf', why: 'Store heavy items low so they can\'t fall on you!' },
      { id: 'exit2', emoji: '🚪', safe: '✅', x: 250, y: 300, name: 'Blocked exit', why: 'Keep doorways clear to escape after shaking stops!' },
      { id: 'gas', emoji: '🔥', safe: '🔧', x: 40, y: 370, name: 'Gas leak risk', why: 'Know how to turn off the gas to prevent fires!' }
    ],
    gates: [
      { question: 'The ground starts shaking! What do you do?', answers: ['Run outside fast', 'Drop, cover, hold on', 'Stand in the middle of the room'], correct: 1 },
      { question: 'Where is safest during shaking?', answers: ['Under sturdy furniture', 'Next to a window', 'In the elevator'], correct: 0 },
      { question: 'After the shaking stops, you should...', answers: ['Light a match to see', 'Check for hazards carefully', 'Run around'], correct: 1 }
    ]
  },

  fire: {
    label: 'Fire',
    emoji: '🔥',
    color: '#EF4444',
    intro: 'Smoke alarms are beeping — it\'s time to act fast and stay low!',
    items: [
      { id: 'extinguisher', emoji: '🧯', name: 'Fire Extinguisher', correct: true, iconBg: '#FEE2E2', why: 'Puts out small fires before they grow.' },
      { id: 'alarm', emoji: '🚨', name: 'Smoke Alarm', correct: true, iconBg: '#FEF3C7', why: 'Warns you early so you can escape in time.' },
      { id: 'flashlight', emoji: '🔦', name: 'Flashlight', correct: true, iconBg: '#FEF3C7', why: 'Helps you see through smoke and darkness.' },
      { id: 'firstaid', emoji: '🩹', name: 'First Aid', correct: true, iconBg: '#FEE2E2', why: 'Treats small burns and injuries.' },
      { id: 'blanket', emoji: '🧣', name: 'Fire Blanket', correct: true, iconBg: '#FFEDD5', why: 'Smothers flames and protects you from heat.' },
      { id: 'phone', emoji: '📱', name: 'Phone', correct: true, iconBg: '#CCFBF1', why: 'Call emergency services once you\'re safely outside.' },
      { id: 'keys', emoji: '🔑', name: 'House Keys', correct: true, iconBg: '#EDE9FE', why: 'Grab them so you can unlock doors to escape.' },
      { id: 'mask', emoji: '😷', name: 'Cloth Mask', correct: true, iconBg: '#DBEAFE', why: 'Covers your mouth from smoke as you get low and go.' },
      { id: 'console', emoji: '🎮', name: 'Game Console', correct: false, iconBg: '#FEE2E2', why: "Never go back for toys — just get out!" },
      { id: 'tv', emoji: '📺', name: 'Television', correct: false, iconBg: '#F1F5F9', why: 'Leave belongings behind — your safety matters most!' },
      { id: 'candy', emoji: '🍭', name: 'Candy', correct: false, iconBg: '#FCE7F3', why: 'Don\'t waste time grabbing snacks in a fire!' },
      { id: 'painting', emoji: '🖼️', name: 'Painting', correct: false, iconBg: '#F1F5F9', why: 'Things can be replaced — you can\'t. Get out!' }
    ],
    dangers: [
      { id: 'stove', emoji: '🍳', safe: '✅', x: 30, y: 90, name: 'Stove left on', why: 'Never leave cooking unattended — turn it off!' },
      { id: 'socket', emoji: '🔌', safe: '✅', x: 230, y: 120, name: 'Overloaded socket', why: 'Too many plugs can overheat and start a fire!' },
      { id: 'candle', emoji: '🕯️', safe: '💡', x: 110, y: 240, name: 'Candle near curtains', why: 'Keep flames far from things that can burn!' },
      { id: 'exit3', emoji: '📦', safe: '🚪', x: 250, y: 300, name: 'Blocked fire exit', why: 'Always keep escape routes clear!' },
      { id: 'heater', emoji: '🔥', safe: '✅', x: 40, y: 370, name: 'Heater near clothes', why: 'Keep heaters away from anything that can catch fire!' }
    ],
    gates: [
      { question: 'The smoke alarm goes off! You should...', answers: ['Hide under the bed', 'Get low and go outside', 'Open all windows first'], correct: 1 },
      { question: 'Why crawl low in a fire?', answers: ['It\'s faster', 'Clean air is near the floor', 'To find toys'], correct: 1 },
      { question: 'Once you\'re safely outside, you...', answers: ['Go back in for things', 'Call emergency services', 'Wait quietly'], correct: 1 }
    ]
  }
};

export const HAZARD_LEVELS = [
  { id: 1, title: 'Pack Fast!', emoji: '🎒', time: 90, mode: 'drag', desc: 'Tap the right items into your bag before time runs out!' },
  { id: 2, title: 'The Hidden Kit', emoji: '🔍', time: 120, mode: 'explore', desc: 'Search the room! Kit items are hidden in the furniture.' },
  { id: 3, title: 'Safety Detective', emoji: '🕵️', time: 90, mode: 'detective', desc: 'Find and fix the dangers hiding in the house!' },
  { id: 4, title: 'Escape Run!', emoji: '🏃', time: 0, mode: 'runner', desc: 'Run to safety! Grab items, dodge dangers, choose safe paths!' }
];

// One extra, hazard-specific mission per family — each teaches a distinct
// skill through its own mechanic instead of reskinning "tap the right item".
export const BONUS_MISSIONS = {
  flood: { screen: 'EscapeRoute', title: 'Escape Route Architect', emoji: '🗺️', desc: 'Trace a path to high ground before the water gets there!' },
  earthquake: { screen: 'StepSorter', title: 'Step Sorter', emoji: '📋', desc: 'Put the safety steps in the right order!' },
  fire: { screen: 'SafeHouse', title: 'Build-It Safe House', emoji: '🏠', desc: 'Place items around the house, then test it for fire safety!' }
};