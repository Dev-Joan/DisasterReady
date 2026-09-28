export const TEEN_LESSONS = [{
  id: 'l1',
  title: 'Build Your Go-Bag',
  emoji: '🎒',
  xp: 20,
  intro: {
    what: "A go-bag (or 'grab bag') is a ready-packed bag with the essentials you'd need for the first 72 hours after any disaster - flood, earthquake, fire, or severe storm. It's the single fastest thing you can do to protect yourself.",
    prepare: 'Pack water, non-perishable snacks, a phone power bank, a torch, a small first-aid kit, copies of ID and important documents, some cash, and any essential medication.',
    react: "When an alert or evacuation order comes, grab the bag and go - don't stop to pack in the moment. Every extra minute spent searching for items is a minute not spent moving to safety.",
    protect: 'Store it somewhere you can reach in under a minute, like by the front door, not in a locked cupboard. Check and refresh it every few months.'
  },
  exercises: [{
    type: 'select',
    prompt: 'What is the main purpose of a go-bag?',
    options: ['To look stylish', 'To grab quickly and leave fast in an emergency', 'To store snacks for later'],
    correct: 1
  }, {
    type: 'wordbank',
    prompt: 'Build the sentence: the three most important things in a go-bag.',
    answer: ['Water', 'food', 'and', 'a', 'flashlight'],
    bank: ['Water', 'food', 'and', 'a', 'flashlight', 'television', 'perfume', 'games']
  }, {
    type: 'match',
    prompt: 'Match each item to why it matters in your go-bag.',
    pairs: [{
      id: 'p1',
      left: 'Flashlight',
      right: 'See safely when the power is out'
    }, {
      id: 'p2',
      left: 'Power bank',
      right: 'Keep your phone alive to call for help'
    }, {
      id: 'p3',
      left: 'First-aid kit',
      right: 'Treat small cuts and injuries'
    }, {
      id: 'p4',
      left: 'ID copies',
      right: 'Prove who you are if originals are lost'
    }]
  }, {
    type: 'truefalse',
    prompt: 'You should keep your go-bag somewhere hard to reach so it stays safe.',
    correct: false,
    explain: 'Keep it somewhere easy to grab - you may only have seconds to leave.'
  }, {
    type: 'select',
    prompt: 'Which item does NOT belong in a go-bag?',
    options: ['A power bank', 'A games console', 'A small first-aid kit'],
    correct: 1
  }]
}, {
  id: 'l2',
  title: 'Stay Informed',
  emoji: '📱',
  xp: 20,
  intro: {
    what: 'During a disaster, accurate information is what keeps you and your family safe - knowing when to shelter, when to evacuate, and which routes are open.',
    prepare: 'Follow official channels before anything happens: your local emergency service, government alert system, and a trusted broadcaster. Turn on emergency alerts on your phone.',
    react: 'When a warning comes in, verify it through an official source before acting on it, and never spread unverified rumours.',
    protect: 'Keep your phone charged and carry a portable battery. A battery-powered or hand-crank radio still works when mobile networks and power are down.'
  },
  exercises: [{
    type: 'select',
    prompt: 'Where should you get emergency information from?',
    options: ['Random social media posts', 'Official emergency services and government alerts', 'Whichever site loads fastest'],
    correct: 1
  }, {
    type: 'truefalse',
    prompt: "It's fine to share an emergency warning even if you haven't verified it, because it might help someone.",
    correct: false,
    explain: 'Unverified rumours can cause panic or send people the wrong way - always verify with an official source before sharing.'
  }, {
    type: 'wordbank',
    prompt: 'Build the reason to own a battery radio.',
    answer: ['Works', 'when', 'networks', 'are', 'down'],
    bank: ['Works', 'when', 'networks', 'are', 'down', 'the', 'power', 'loudly', 'always']
  }, {
    type: 'order',
    prompt: 'Put these steps in the right order for when an alert arrives.',
    steps: ['Verify it through an official source', 'Alert the people around you', 'Follow the instructions given', 'Keep monitoring for updates']
  }, {
    type: 'select',
    prompt: "What's a smart habit before a storm warning arrives?",
    options: ['Let your phone battery run low', 'Keep your phone charged and know your alert sources', 'Turn off all notifications'],
    correct: 1
  }]
}, {
  id: 'l3',
  title: 'Flood Smarts',
  emoji: '🌊',
  xp: 20,
  intro: {
    what: 'A flood happens when water rises faster than the ground or drainage can absorb it - from heavy rain, storm surge, or overflowing rivers. Floods are deceptively dangerous because moving water is far more powerful than it looks.',
    prepare: "Know if you're in a flood-risk area, move valuables and documents to higher shelves, and identify higher ground you can reach on foot before water rises.",
    react: "If told to evacuate, go early - don't wait until water is at your door. Move to higher ground immediately and avoid basements and low-lying rooms.",
    protect: "Never walk or drive through floodwater: just 15cm can knock an adult off their feet, and 60cm can float a car. You can't see hazards under the surface. Turn off electricity at the mains if it's safe to reach."
  },
  exercises: [{
    type: 'select',
    prompt: 'How much moving water can knock an adult off their feet?',
    options: ['About 15 cm (ankle deep)', 'About 1 metre (waist deep)', 'Only if it is over your head'],
    correct: 0
  }, {
    type: 'truefalse',
    prompt: 'It is safe to drive through floodwater if it looks shallow.',
    correct: false,
    explain: 'Never drive through floodwater - just 60 cm can float a car, and you cannot see hazards underneath.'
  }, {
    type: 'wordbank',
    prompt: 'Build the safety rule for a flood warning.',
    answer: ['Move', 'to', 'higher', 'ground', 'early'],
    bank: ['Move', 'to', 'higher', 'ground', 'early', 'the', 'basement', 'slowly', 'later']
  }, {
    type: 'select',
    prompt: 'If told to evacuate before a flood, when should you go?',
    options: ['Early, as soon as you are told', 'After packing everything you own', 'Only once water reaches your door'],
    correct: 0
  }]
}, {
  id: 'l4',
  title: 'Earthquake Response',
  emoji: '🏚️',
  xp: 20,
  intro: {
    what: 'An earthquake is a sudden shaking of the ground caused by movement along a fault line. It can strike without warning and lasts seconds to a couple of minutes, but aftershocks can continue for days.',
    prepare: 'Secure heavy furniture and shelves to walls, identify the sturdy furniture in each room you could shelter under, and keep your go-bag somewhere accessible.',
    react: "The moment shaking starts: Drop to the ground, take Cover under sturdy furniture, and Hold On until it stops. Don't run outside - most injuries happen from falling objects and debris.",
    protect: "If you're in bed, stay there and protect your head with a pillow. Stay away from windows and tall furniture. Once shaking stops, check for hazards like gas leaks before moving around."
  },
  exercises: [{
    type: 'wordbank',
    prompt: 'Build the three-step earthquake rule.',
    answer: ['Drop', 'Cover', 'Hold', 'On'],
    bank: ['Drop', 'Cover', 'Hold', 'On', 'Run', 'Jump', 'Outside', 'Climb']
  }, {
    type: 'tapimage',
    prompt: 'Tap every hazard that could fall or hurt someone when the shaking starts.',
    items: [{
      id: 'shelf',
      emoji: '🗄️',
      xPct: 10,
      yPct: 10,
      hazard: true,
      why: 'An unsecured shelf can topple over during shaking.'
    }, {
      id: 'mirror',
      emoji: '🪞',
      xPct: 60,
      yPct: 12,
      hazard: true,
      why: 'Heavy mirrors hung without anchors can fall and shatter.'
    }, {
      id: 'table',
      emoji: '🪑',
      xPct: 15,
      yPct: 60,
      hazard: false
    }, {
      id: 'vase',
      emoji: '🏺',
      xPct: 62,
      yPct: 58,
      hazard: true,
      why: 'Heavy items stored up high can fall directly onto you.'
    }, {
      id: 'door',
      emoji: '🚪',
      xPct: 35,
      yPct: 35,
      hazard: false
    }, {
      id: 'plant',
      emoji: '🪴',
      xPct: 38,
      yPct: 68,
      hazard: false
    }]
  }, {
    type: 'select',
    prompt: 'During shaking, where is the safest place?',
    options: ['Next to a large window', 'Under sturdy furniture', 'In a lift'],
    correct: 1
  }, {
    type: 'truefalse',
    prompt: 'You should run outside immediately when shaking starts.',
    correct: false,
    explain: 'Most injuries happen from falling debris - Drop, Cover and Hold On until the shaking stops.'
  }, {
    type: 'select',
    prompt: 'If you are in bed during an earthquake, you should...',
    options: ['Run to the kitchen', 'Stay and protect your head with a pillow', 'Stand in the doorway'],
    correct: 1
  }]
}, {
  id: 'l5',
  title: 'Help Others Safely',
  emoji: '🤝',
  xp: 20,
  intro: {
    what: 'In the aftermath of a disaster, communities that look out for each other recover faster - but helping only works if you stay safe while doing it.',
    prepare: 'Learn basic first aid before disaster strikes, and know which neighbours might need extra help - elderly people, those with disabilities, or people living alone.',
    react: "Check on people nearby if it's safe to do so. Offer what you can - information, supplies, or a hand - but never enter damaged buildings or dangerous areas yourself.",
    protect: 'Never risk your own safety to attempt a rescue - call professional responders instead. Staying calm, prepared, and informed is what makes you genuinely useful in a crisis.'
  },
  exercises: [{
    type: 'select',
    prompt: 'Who might need extra help from you after a disaster?',
    options: ['Nobody, everyone is fine', 'Elderly neighbours or people living alone', 'Only your own family'],
    correct: 1
  }, {
    type: 'truefalse',
    prompt: 'You should enter a damaged building to rescue someone if no one else is around.',
    correct: false,
    explain: 'Never enter a damaged or dangerous structure yourself - call professional responders instead.'
  }, {
    type: 'fillblank',
    template: 'You should never enter a damaged building to help someone - instead, call {blank}.',
    blankOptions: ['professional responders', 'your friends for advice', 'the building owner'],
    correct: 0
  }, {
    type: 'wordbank',
    prompt: 'Build the rule for personal risk when helping others.',
    answer: ['Never', 'risk', 'your', 'own', 'safety'],
    bank: ['Never', 'risk', 'your', 'own', 'safety', 'Always', 'someone', 'elses', 'ignore']
  }, {
    type: 'select',
    prompt: 'What makes you genuinely useful during a crisis?',
    options: ['Panicking loudly', 'Staying calm, prepared, and informed', 'Doing everything alone'],
    correct: 1
  }]
}];
