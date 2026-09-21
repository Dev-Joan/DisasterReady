// "Dispatch Hero" mini-game: triage several situations by urgency, then
// build a clear Who/What/Where emergency message for the most urgent one.
export const DISPATCH_ROUNDS = [
  {
    id: 'round1',
    calls: [
      { id: 'gas', urgency: 4, emoji: '⚠️', text: 'Grandma smells gas in the kitchen' },
      { id: 'cat', urgency: 1, emoji: '🐈', text: 'The neighbor\'s cat is stuck in a tree' },
      { id: 'cut', urgency: 2, emoji: '🩹', text: 'Little brother has a small cut on his finger' },
      { id: 'fire', urgency: 5, emoji: '🔥', text: 'There\'s smoke and fire in the kitchen' }
    ],
    who: [
      { id: 'who-correct', text: 'My name is Max, I\'m 9 years old', correct: true },
      { id: 'who-vague', text: 'Um, hi', correct: false }
    ],
    what: [
      { id: 'what-correct', text: 'There is a fire with smoke in our kitchen', correct: true },
      { id: 'what-vague', text: 'Something is wrong at my house', correct: false }
    ],
    where: [
      { id: 'where-correct', text: '123 Oak Street, the blue house', correct: true },
      { id: 'where-vague', text: 'At home', correct: false }
    ]
  },
  {
    id: 'round2',
    calls: [
      { id: 'flood', urgency: 4, emoji: '🌊', text: 'Water is rising fast in the basement' },
      { id: 'bruise', urgency: 1, emoji: '🤕', text: 'You bumped your knee, it\'s a little sore' },
      { id: 'power', urgency: 2, emoji: '💡', text: 'The power just went out next door' },
      { id: 'trapped', urgency: 5, emoji: '🆘', text: 'Someone is trapped upstairs and the stairs are flooded' }
    ],
    who: [
      { id: 'who-correct', text: 'My name is Mia, I live with my mom and dad', correct: true },
      { id: 'who-vague', text: 'It\'s me', correct: false }
    ],
    what: [
      { id: 'what-correct', text: 'My dad is trapped upstairs, the stairs are flooded', correct: true },
      { id: 'what-vague', text: 'There\'s a lot of water', correct: false }
    ],
    where: [
      { id: 'where-correct', text: '45 River Road, the house with the red door', correct: true },
      { id: 'where-vague', text: 'Near the river somewhere', correct: false }
    ]
  }
];
