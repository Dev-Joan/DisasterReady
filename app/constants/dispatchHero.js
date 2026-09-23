// "Dispatch Hero" mini-game: triage several situations by urgency, then
// build a clear Who/What/Where emergency message for the most urgent one.
//
// Redesigned for readers as young as 6: every choice is a big picture with
// a short 1-3 word label, and `speak` holds the full sentence a real caller
// would say — read aloud with expo-speech (see useKidSpeech) instead of
// requiring the label itself to carry the whole idea in text.
export const DISPATCH_ROUNDS = [
  {
    id: 'round1',
    calls: [
      { id: 'gas', urgency: 4, emoji: '⚠️', label: 'Gas smell', speak: 'Grandma smells gas in the kitchen!' },
      { id: 'cat', urgency: 1, emoji: '🐈', label: 'Cat in a tree', speak: "The neighbor's cat is stuck in a tree." },
      { id: 'cut', urgency: 2, emoji: '🩹', label: 'Small cut', speak: 'Little brother has a small cut on his finger.' },
      { id: 'fire', urgency: 5, emoji: '🔥', label: 'Fire!', speak: "There's smoke and fire in the kitchen!" }
    ],
    who: [
      { id: 'who-correct', emoji: '🙋', label: 'Say my name', speak: "My name is Max, I'm 9 years old.", correct: true },
      { id: 'who-vague', emoji: '🤐', label: 'Stay quiet', speak: 'Um... hi...', correct: false }
    ],
    what: [
      { id: 'what-correct', emoji: '🔥', label: 'Fire!', speak: 'There is a fire with smoke in our kitchen!', correct: true },
      { id: 'what-cat', emoji: '🐈', label: 'A cat', speak: 'Something about a cat.', correct: false },
      { id: 'what-ball', emoji: '⚽', label: 'A ball', speak: 'Something about a ball.', correct: false }
    ],
    where: [
      { id: 'where-correct', emoji: '🏠', label: 'At home', speak: '123 Oak Street, the blue house.', correct: true },
      { id: 'where-school', emoji: '🏫', label: 'At school', speak: 'At school.', correct: false },
      { id: 'where-park', emoji: '🌳', label: 'At the park', speak: 'At the park.', correct: false }
    ]
  },
  {
    id: 'round2',
    calls: [
      { id: 'flood', urgency: 4, emoji: '🌊', label: 'Water rising', speak: 'Water is rising fast in the basement!' },
      { id: 'bruise', urgency: 1, emoji: '🤕', label: 'Sore knee', speak: "You bumped your knee, it's a little sore." },
      { id: 'power', urgency: 2, emoji: '💡', label: 'Power out', speak: 'The power just went out next door.' },
      { id: 'trapped', urgency: 5, emoji: '🆘', label: 'Trapped!', speak: 'Someone is trapped upstairs and the stairs are flooded!' }
    ],
    who: [
      { id: 'who-correct', emoji: '🙋', label: 'Say my name', speak: 'My name is Mia, I live with my mom and dad.', correct: true },
      { id: 'who-vague', emoji: '🤐', label: 'Stay quiet', speak: "It's me...", correct: false }
    ],
    what: [
      { id: 'what-correct', emoji: '🆘', label: 'Trapped!', speak: 'My dad is trapped upstairs, the stairs are flooded!', correct: true },
      { id: 'what-power', emoji: '💡', label: 'Power out', speak: 'Something about the power.', correct: false },
      { id: 'what-bruise', emoji: '🤕', label: 'A bruise', speak: 'Something about a bruise.', correct: false }
    ],
    where: [
      { id: 'where-correct', emoji: '🏠', label: 'At home', speak: '45 River Road, the house with the red door.', correct: true },
      { id: 'where-school', emoji: '🏫', label: 'At school', speak: 'At school.', correct: false },
      { id: 'where-park', emoji: '🌳', label: 'At the park', speak: 'At the park.', correct: false }
    ]
  }
];
