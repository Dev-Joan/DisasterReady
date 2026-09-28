export const STORY_TITLE = "Max & Mia's Flood Story";
export const STORY_PAGES = [{
  id: 'storm',
  scene: 'storm',
  text: "It's raining hard in Max and Mia's town. The river is rising. A flood might be coming!"
}, {
  id: 'pack',
  scene: 'pack',
  text: 'Mom says, "Let\'s pack our emergency bag!" Water, snacks, and a flashlight go inside.'
}, {
  id: 'dark',
  scene: 'dark',
  text: 'Suddenly the lights go out! Max feels scared - but Mia grabs the flashlight from the bag.'
}, {
  id: 'rise',
  scene: 'rise',
  text: 'The water keeps rising. A rescuer says: "Everyone move to higher ground!" Up the stairs they go.'
}, {
  id: 'rescue',
  scene: 'rescue',
  text: 'The rescue team arrives! Max and Mia stayed calm, packed their bag, and moved to safety.'
}];
export const STORY_QUIZ = [{
  id: 'q1',
  question: 'What do you do first?',
  speak: 'A flood might be coming. What do you do first?',
  options: [{
    id: 'tell',
    emoji: '🙋',
    label: 'Tell a grown-up',
    correct: true
  }, {
    id: 'hide',
    emoji: '🙈',
    label: 'Hide',
    correct: false
  }, {
    id: 'watch',
    emoji: '🏃',
    label: 'Go watch outside',
    correct: false
  }]
}, {
  id: 'q2',
  question: "What's in the bag?",
  speak: "What should go in the emergency bag?",
  options: [{
    id: 'kit',
    emoji: '💧',
    label: 'Water & Food',
    correct: true
  }, {
    id: 'tv',
    emoji: '📺',
    label: 'A TV',
    correct: false
  }, {
    id: 'candy',
    emoji: '🍬',
    label: 'Just Candy',
    correct: false
  }]
}, {
  id: 'q3',
  question: 'Where do you go?',
  speak: 'The water is rising. Where do you go?',
  options: [{
    id: 'up',
    emoji: '⬆️',
    label: 'Upstairs',
    correct: true
  }, {
    id: 'down',
    emoji: '⬇️',
    label: 'Basement',
    correct: false
  }, {
    id: 'outside',
    emoji: '🌊',
    label: 'Outside',
    correct: false
  }]
}];
