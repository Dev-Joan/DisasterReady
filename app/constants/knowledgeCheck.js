export const KNOWLEDGE_CHECK_CHAPTERS = [{
  id: 'kc-cpr',
  group: 'First Aid: Medical',
  sourceType: 'firstAid',
  sourceId: 'cpr',
  title: 'CPR (Adult)',
  icon: 'heart-pulse',
  color: '#D32F2F',
  questions: [{
    id: 'q1',
    prompt: 'How long should you check for normal breathing before acting?',
    options: ['No more than 10 seconds', 'At least 2 minutes', 'Until you are completely certain', 'About 30 seconds'],
    correct: 0,
    explain: 'Check for normal breathing for no more than 10 seconds - occasional gasps are NOT normal breathing.'
  }, {
    id: 'q2',
    prompt: 'Where should you place your hands for chest compressions?',
    options: ['On the stomach', 'In the centre of the chest', 'On the throat', 'On the ribs, to one side'],
    correct: 1,
    explain: 'Place the heel of one hand in the centre of the chest, with your other hand on top, fingers interlocked.'
  }, {
    id: 'q3',
    prompt: 'At what rate should you give chest compressions?',
    options: ['100-120 per minute', 'About 10 per minute', 'As slowly and gently as possible', 'Once every few seconds is enough'],
    correct: 0,
    explain: 'Push hard and fast at 100-120 compressions per minute, letting the chest fully rise between pushes.'
  }, {
    id: 'q4',
    prompt: 'What should you do as soon as an AED (defibrillator) is available?',
    options: ['Ignore it and keep doing compressions only', 'Use it and follow its spoken instructions', 'Wait for paramedics before touching it', 'Only use it if you have training'],
    correct: 1,
    explain: "Use an AED as soon as one is available and follow its spoken instructions - it's designed to guide you."
  }, {
    id: 'q5',
    prompt: 'When should you stop CPR?',
    options: ['After exactly 2 minutes, no matter what', 'Only once help arrives or the person shows signs of life', 'As soon as your arms get tired', 'After giving 10 compressions'],
    correct: 1,
    explain: 'Continue compressions without stopping until emergency help arrives or the person starts to show signs of life.'
  }]
}, {
  id: 'kc-burns',
  group: 'First Aid: Medical',
  sourceType: 'firstAid',
  sourceId: 'burns',
  title: 'Burns & Scalds',
  icon: 'fire',
  color: '#EA580C',
  questions: [{
    id: 'q1',
    prompt: 'How long should you cool a burn under running water?',
    options: ['At least 20 minutes', 'About 5 seconds', 'Until the pain fully stops, however long', 'It should never be cooled with water'],
    correct: 0,
    explain: 'Cool the burn under cool or lukewarm running water for at least 20 minutes.'
  }, {
    id: 'q2',
    prompt: 'What should you NEVER put on a burn?',
    options: ['Cool running water', 'Ice, cream, or butter', 'Loose cling film', 'Nothing at all - leave it bare'],
    correct: 1,
    explain: 'Never use ice, iced water, creams, or greasy substances like butter - they can worsen the injury.'
  }, {
    id: 'q3',
    prompt: 'What should you do with jewellery or tight clothing near a burn?',
    options: ['Leave it exactly where it is', 'Gently remove it before it swells, unless stuck to the burn', 'Cut it off even if already stuck to the burn', 'Tighten it to reduce swelling'],
    correct: 1,
    explain: "Gently remove jewellery, watches, or tight clothing before it starts to swell, unless it's stuck to the burn."
  }, {
    id: 'q4',
    prompt: 'How should you cover a cooled burn?',
    options: ['Wrap it as tightly as possible', 'Loosely with cling film', 'Leave it fully exposed for days', 'With a tight bandage and antiseptic cream'],
    correct: 1,
    explain: "Cover the burn loosely with cling film (or a clean plastic bag for hands/feet) - never wrap tightly."
  }, {
    id: 'q5',
    prompt: 'When should you call emergency services for a burn?',
    options: ['Only if the person insists', 'For large, deep, or facial burns, or one bigger than their hand', 'Burns never need emergency services', 'Only for burns on the leg'],
    correct: 1,
    explain: "Call emergency services for large, deep, or facial burns, burns to a child, or any burn bigger than the person's hand."
  }]
}, {
  id: 'kc-bleeding',
  group: 'First Aid: Medical',
  sourceType: 'firstAid',
  sourceId: 'bleeding',
  title: 'Severe Bleeding',
  icon: 'water-alert',
  color: '#B91C1C',
  questions: [{
    id: 'q1',
    prompt: 'What is the first thing you should do to control severe bleeding?',
    options: ['Apply firm pressure with a clean pad or cloth', 'Run the wound under cold water', 'Wrap it loosely and wait', 'Elevate it without applying pressure'],
    correct: 0,
    explain: 'Press firmly on the wound with a clean pad or cloth to stop the bleeding.'
  }, {
    id: 'q2',
    prompt: 'If blood soaks through your first pad, what should you do?',
    options: ['Remove it and start fresh', 'Add another pad on top without removing the first', 'Stop applying pressure', 'Wash the wound immediately'],
    correct: 1,
    explain: 'If blood soaks through, add another pad on top - do not remove the first one, as this disturbs clotting.'
  }, {
    id: 'q3',
    prompt: 'Why should you raise an injured limb above the heart if possible?',
    options: ['It looks more professional', 'It helps slow the bleeding', 'It has no real effect', 'It prevents infection'],
    correct: 1,
    explain: 'Raising the injured area above the level of the heart helps slow the bleeding.'
  }, {
    id: 'q4',
    prompt: 'Once bleeding is controlled, how tight should a dressing be?',
    options: ['As tight as physically possible', 'Firm enough to maintain pressure, not cut off circulation', "It doesn't matter", 'Loose enough to fall off easily'],
    correct: 1,
    explain: 'Secure the pad firmly enough to maintain pressure, but not so tight it cuts off circulation.'
  }, {
    id: 'q5',
    prompt: 'What should you watch for while waiting for help after severe bleeding?',
    options: ['Signs of shock', 'Whether they seem bored', 'Whether the bandage colour matches', 'Nothing else is needed'],
    correct: 0,
    explain: 'Keep the person lying down and warm, reassure them, and watch for signs of shock.'
  }]
}, {
  id: 'kc-choking',
  group: 'First Aid: Medical',
  sourceType: 'firstAid',
  sourceId: 'choking',
  title: 'Choking (Adult)',
  icon: 'lungs',
  color: '#7C3AED',
  questions: [{
    id: 'q1',
    prompt: 'What should you encourage first if a choking adult can still cough?',
    options: ['Lying down flat', 'To keep coughing to clear it themselves', 'Drinking water quickly', 'Holding their breath'],
    correct: 1,
    explain: 'If they can still cough, encourage them to keep coughing to try to clear the blockage themselves.'
  }, {
    id: 'q2',
    prompt: "How many back blows should you give if coughing doesn't work?",
    options: ['Up to 5, leaning them forward', 'Exactly 1', 'As many as possible without pausing', '10, with the person lying down'],
    correct: 0,
    explain: 'Lean them forward and give up to 5 sharp blows between the shoulder blades.'
  }, {
    id: 'q3',
    prompt: 'Where do you place your fist for abdominal thrusts?',
    options: ['On the chest', 'Above the navel', 'On the back', 'On the throat'],
    correct: 1,
    explain: 'Place a fist above the navel, grasp it with your other hand, and pull sharply inwards and upwards.'
  }, {
    id: 'q4',
    prompt: "What's the correct pattern if back blows alone don't clear it?",
    options: ['5 back blows, then 5 abdominal thrusts, alternating', 'Only abdominal thrusts, forever', 'Wait 10 minutes between attempts', 'Shake the person firmly'],
    correct: 0,
    explain: 'Alternate 5 back blows and 5 abdominal thrusts until the blockage clears or help arrives.'
  }, {
    id: 'q5',
    prompt: 'What should you do if the choking person becomes unresponsive?',
    options: ['Leave them to rest', 'Call emergency services and begin CPR', 'Give them more water', 'Keep doing abdominal thrusts only'],
    correct: 1,
    explain: 'If the person becomes unresponsive, call emergency services and begin CPR.'
  }]
}, {
  id: 'kc-fa-flood',
  group: 'First Aid: During a Disaster',
  sourceType: 'firstAid',
  sourceId: 'flood',
  title: 'During a Flood',
  icon: 'home-flood',
  color: '#1E3A8A',
  questions: [{
    id: 'q1',
    prompt: 'Where should you go as flood water rises?',
    options: ['The highest safe level you can reach', 'A basement or cellar', 'Outside to check the water level', 'Wherever is closest'],
    correct: 0,
    explain: 'Get to the highest safe level you can - never go into a basement or cellar as water rises.'
  }, {
    id: 'q2',
    prompt: 'How much moving floodwater can float a car?',
    options: ['About 60 cm', 'About 5 metres', 'Cars can never be moved by water', 'Only fully submerged water'],
    correct: 0,
    explain: 'Just 60 cm of moving water can float a car, and hazards are hidden underneath.'
  }, {
    id: 'q3',
    prompt: 'If safe to reach, what should you turn off during a flood?',
    options: ['The Wi-Fi router', 'Electricity and gas at the mains', 'The doorbell', 'The water supply only'],
    correct: 1,
    explain: 'If it is safe to reach, turn off electricity and gas at the mains to reduce fire and electrocution risk.'
  }, {
    id: 'q4',
    prompt: 'What should you bring during a flood evacuation?',
    options: ['Your go-bag with water, medication, and a torch', 'As much furniture as possible', 'Nothing at all', 'Only cash'],
    correct: 0,
    explain: 'Bring your go-bag: water, medication, documents, phone and charger, and a torch.'
  }, {
    id: 'q5',
    prompt: 'How should you stay informed during a flood?',
    options: ['Follow official alerts, not rumours', 'Only trust word of mouth', 'Ignore all alerts to avoid panic', 'Wait for someone to knock on your door'],
    correct: 0,
    explain: 'Follow official alerts and instructions on a radio or phone. Do not rely on rumours.'
  }]
}, {
  id: 'kc-fa-earthquake',
  group: 'First Aid: During a Disaster',
  sourceType: 'firstAid',
  sourceId: 'earthquake',
  title: 'During an Earthquake',
  icon: 'home-alert',
  color: '#B45309',
  questions: [{
    id: 'q1',
    prompt: 'What are the three steps of the earthquake safety rule?',
    options: ['Drop, Cover, Hold On', 'Stop, Drop, Roll', 'Run, Duck, Cover', 'Sit, Wait, Call'],
    correct: 0,
    explain: 'Drop, Cover, and Hold On is the core earthquake safety rule.'
  }, {
    id: 'q2',
    prompt: "If there's no sturdy furniture nearby, what should you do?",
    options: ['Protect your head and neck with your arms, away from windows', 'Stand next to a window for a better view', 'Run to find furniture no matter how far', 'Stand in an open doorway'],
    correct: 0,
    explain: 'If there is no sturdy furniture, protect your head and neck with your arms and move away from windows.'
  }, {
    id: 'q3',
    prompt: "If you're in bed when an earthquake starts, what should you do?",
    options: ['Run to another room immediately', 'Stay there and protect your head with a pillow', 'Stand in the doorway', 'Get under the bed frame'],
    correct: 1,
    explain: 'If in bed, stay there and protect your head with a pillow.'
  }, {
    id: 'q4',
    prompt: "Why shouldn't you run outside during shaking?",
    options: ["It's against safety regulations", 'Most injuries come from falling debris', 'It wastes energy needed later', "It's always slower than staying put"],
    correct: 1,
    explain: 'Do not run outside during shaking - most injuries come from falling debris.'
  }, {
    id: 'q5',
    prompt: 'What should you check for once shaking stops?',
    options: ['Gas leaks and structural damage', 'Nothing, resume normal activity right away', 'Only whether the power is out', 'Whether the neighbours felt it'],
    correct: 0,
    explain: 'Check for gas leaks and structural damage before moving around, and expect aftershocks.'
  }]
}, {
  id: 'kc-fa-fire',
  group: 'First Aid: During a Disaster',
  sourceType: 'firstAid',
  sourceId: 'fire',
  title: 'During a Fire',
  icon: 'fire-alert',
  color: '#C2410C',
  questions: [{
    id: 'q1',
    prompt: 'Why should you stay low during a house fire?',
    options: ['Smoke rises, so the air is cleaner near the floor', "It's more comfortable", 'It helps you move faster', 'It keeps you hidden from flames'],
    correct: 0,
    explain: 'Smoke rises, so crawl low under it where the air is cleaner.'
  }, {
    id: 'q2',
    prompt: "How do you check if it's safe to open a door during a fire?",
    options: ['Open it quickly to look', 'Feel it with the back of your hand first', 'Listen for sounds behind it', 'Touch the handle with your palm'],
    correct: 1,
    explain: "Before opening a door, feel it with the back of your hand. If it's hot, use another route."
  }, {
    id: 'q3',
    prompt: 'What should you do after getting out of a burning building?',
    options: ['Go back in for anything you forgot', 'Stay out and call emergency services', 'Wait right by the door', 'Try to fight the fire from outside'],
    correct: 1,
    explain: 'Get out and stay out - call emergency services and never go back inside for anything.'
  }, {
    id: 'q4',
    prompt: 'Why should you close doors behind you while escaping a fire?',
    options: ["It's polite", "It slows the fire's spread", 'It keeps noise down', 'It stops smoke alarms triggering'],
    correct: 1,
    explain: "Closing doors behind you as you leave helps slow the spread of the fire."
  }, {
    id: 'q5',
    prompt: "What should you do if you're trapped by a fire?",
    options: ['Close the door, block gaps with cloth, and signal from a window', 'Hide in a cupboard and wait quietly', 'Break every window in the building', 'Run through the smoke as fast as possible'],
    correct: 0,
    explain: 'If trapped, close the door, block gaps with cloth, and signal for help from a window.'
  }]
}, {
  id: 'kc-flood-1',
  group: 'Flood',
  sourceType: 'article',
  sourceId: 'flood-1',
  title: 'Understanding Flood Risk',
  icon: 'waves',
  color: '#0EA5E9',
  questions: [{
    id: 'q1',
    prompt: 'What can cause a flood?',
    options: ['Heavy rainfall, an overflowing river, or storm surge', 'Only earthquakes', 'Cold weather alone', 'Wind alone'],
    correct: 0,
    explain: 'Floods come from heavy rainfall, a river overflowing its banks, storm surge, or overwhelmed drains.'
  }, {
    id: 'q2',
    prompt: 'What should you do with valuables and documents before a flood?',
    options: ['Bury them in the garden', 'Move them to higher floors or shelves', 'Leave them exactly where they are', 'Store them in the basement'],
    correct: 1,
    explain: 'Keep important documents and valuables on higher floors or shelves.'
  }, {
    id: 'q3',
    prompt: 'How much moving floodwater can knock an adult off their feet?',
    options: ['About 15 cm', 'About 5 metres', 'Floodwater cannot do this', 'Only fully submerging water'],
    correct: 0,
    explain: 'Just 15cm of moving water can knock an adult off their feet.'
  }, {
    id: 'q4',
    prompt: 'Before returning home after a flood, what should you wait for?',
    options: ['Official confirmation that it is safe', 'Nothing - return once the rain stops', "A neighbour's opinion", 'The water to look clear'],
    correct: 0,
    explain: "Don't return home until officials confirm it's safe."
  }, {
    id: 'q5',
    prompt: 'Why should you photograph flood damage before cleaning up?',
    options: ['For insurance purposes', 'To post on social media', "It's not necessary", 'To show the fire department'],
    correct: 0,
    explain: 'Photograph any damage for insurance before cleaning up.'
  }]
}, {
  id: 'kc-flood-2',
  group: 'Flood',
  sourceType: 'article',
  sourceId: 'flood-2',
  title: 'Flash Floods vs. River Floods',
  icon: 'waves',
  color: '#0EA5E9',
  questions: [{
    id: 'q1',
    prompt: 'How quickly can a flash flood develop?',
    options: ['Within minutes to hours after intense rainfall', 'Only after several weeks', 'Flash floods take longer than river floods', 'Only during winter'],
    correct: 0,
    explain: 'A flash flood develops within minutes to hours after intense rainfall.'
  }, {
    id: 'q2',
    prompt: 'What mainly drives coastal flooding?',
    options: ['Storm surge and high tides', 'Only earthquakes', 'Wildfires', 'Snowmelt'],
    correct: 0,
    explain: 'Coastal flooding is driven by storm surge and high tides.'
  }, {
    id: 'q3',
    prompt: 'In a flash flood, what should you do?',
    options: ['Act immediately - there may be no time to gather belongings', 'Wait to see how serious it gets', 'Take your time packing', 'Call friends before moving'],
    correct: 0,
    explain: 'In a flash flood, act immediately; there may be no time to gather belongings.'
  }, {
    id: 'q4',
    prompt: 'Why avoid parking near a dry creek bed during heavy rain?',
    options: ['It can fill rapidly in a flash flood', "It's illegal everywhere", 'It has no relevance to flooding', 'It attracts wildlife'],
    correct: 0,
    explain: 'Never camp or park near a dry creek bed during heavy rain - it can fill rapidly.'
  }]
}, {
  id: 'kc-flood-3',
  group: 'Flood',
  sourceType: 'article',
  sourceId: 'flood-3',
  title: 'Protecting Your Family During a Flood Evacuation',
  icon: 'waves',
  color: '#0EA5E9',
  questions: [{
    id: 'q1',
    prompt: 'What should your family agree on before a flood evacuation?',
    options: ['A meeting point outside the flood zone', "Plans aren't useful", 'To evacuate separately', 'A meeting point inside the flood zone'],
    correct: 0,
    explain: 'Agree on a family meeting point outside the flood zone.'
  }, {
    id: 'q2',
    prompt: 'When should you leave once an evacuation order is given?',
    options: ['As soon as possible', 'Only after packing everything you own', 'Once water is at your door', 'After checking with neighbours'],
    correct: 0,
    explain: "Leave as soon as an evacuation order is given - don't wait to see how bad it gets."
  }, {
    id: 'q3',
    prompt: 'Why follow official evacuation routes instead of shortcuts?',
    options: ['Shortcuts may be unsafe or blocked', 'Shortcuts are always faster', "It doesn't matter which route", 'Official routes are always longer'],
    correct: 0,
    explain: 'Follow official evacuation routes rather than shortcuts.'
  }, {
    id: 'q4',
    prompt: "What should you do once you're safe after evacuating?",
    options: ['Check in with your out-of-area contact', 'Immediately return home', 'Delete records of expenses', 'Wait for the water to look clear'],
    correct: 0,
    explain: 'Check in with your out-of-area contact so family know you are safe.'
  }]
}, {
  id: 'kc-earthquake-1',
  group: 'Earthquake',
  sourceType: 'article',
  sourceId: 'earthquake-1',
  title: 'How Earthquakes Happen',
  icon: 'home-alert',
  color: '#D97706',
  questions: [{
    id: 'q1',
    prompt: 'What causes an earthquake?',
    options: ['Sudden release of energy along a fault line', 'Ocean tides', 'Wind patterns', 'Changes in air pressure'],
    correct: 0,
    explain: "An earthquake is the sudden release of energy in the Earth's crust, usually along a fault line."
  }, {
    id: 'q2',
    prompt: 'What can continue for hours, days, or weeks after a major earthquake?',
    options: ['Aftershocks', 'Tsunamis only', 'Nothing else happens', 'Landslides only'],
    correct: 0,
    explain: 'Aftershocks - smaller quakes following the main one - can continue for hours, days, or weeks.'
  }, {
    id: 'q3',
    prompt: 'What is the three-step rule the instant shaking starts?',
    options: ['Drop, Cover, Hold On', 'Run, Hide, Fight', 'Sit, Wait, Call', 'Stop, Drop, Roll'],
    correct: 0,
    explain: 'The moment shaking starts: Drop, Cover, and Hold On.'
  }, {
    id: 'q4',
    prompt: 'Why stay indoors during shaking rather than run outside?',
    options: ['Most injuries happen from falling objects, not collapse', "It's against regulations to go outside", 'Outside is always more dangerous overall', 'Doors lock automatically'],
    correct: 0,
    explain: 'Most earthquake injuries happen from falling objects, not from collapsing buildings.'
  }, {
    id: 'q5',
    prompt: 'What should you check for once shaking stops?',
    options: ['Gas leaks, damaged wiring, or structural cracks', "Nothing, it's immediately safe", 'Only whether the power is out', 'Whether it was reported on the news yet'],
    correct: 0,
    explain: 'Check for gas leaks, damaged wiring, or structural cracks before re-entering a building.'
  }]
}, {
  id: 'kc-earthquake-2',
  group: 'Earthquake',
  sourceType: 'article',
  sourceId: 'earthquake-2',
  title: 'Earthquake-Proofing Your Home',
  icon: 'home-alert',
  color: '#D97706',
  questions: [{
    id: 'q1',
    prompt: 'What causes most earthquake injuries?',
    options: ['Falling or moving objects, not the shaking itself', 'Loud noise', 'Cold temperatures', 'Power outages'],
    correct: 0,
    explain: 'Most earthquake injuries come from falling or moving objects rather than the shaking itself.'
  }, {
    id: 'q2',
    prompt: 'How should heavy furniture be secured?',
    options: ['Anchored to wall studs', 'Left loose for flexibility', 'Placed only on upper shelves', 'Weighed down with books'],
    correct: 0,
    explain: 'Anchor tall furniture, bookshelves, and cabinets to wall studs.'
  }, {
    id: 'q3',
    prompt: "If sheltering under a table isn't possible, what should you do?",
    options: ['Crouch against an interior wall and cover head and neck', 'Stand near a window for visibility', 'Run to the nearest exit immediately', 'Stand in the centre of the room'],
    correct: 0,
    explain: 'If nothing is available, crouch against an interior wall and cover your head and neck.'
  }, {
    id: 'q4',
    prompt: 'Why avoid candles or open flames right after an earthquake?',
    options: ['In case of a gas leak', 'They use too much power', 'They are against fire code', 'They attract attention'],
    correct: 0,
    explain: "Don't use candles or open flames in case of a gas leak - use a torch instead."
  }]
}, {
  id: 'kc-earthquake-3',
  group: 'Earthquake',
  sourceType: 'article',
  sourceId: 'earthquake-3',
  title: "What To Do If You're Not At Home",
  icon: 'home-alert',
  color: '#D97706',
  questions: [{
    id: 'q1',
    prompt: "If you're driving during an earthquake, where should you pull over?",
    options: ['Away from bridges, overpasses, and power lines', 'Directly under an overpass for shelter', 'Anywhere at all', 'In the middle lane, and stop'],
    correct: 0,
    explain: 'Pull over away from bridges, overpasses, and power lines.'
  }, {
    id: 'q2',
    prompt: "If you're outdoors during an earthquake, what should you do?",
    options: ['Move away from buildings, trees, and power lines', 'Run inside the nearest building', 'Climb the nearest tree', 'Lie flat in the open immediately'],
    correct: 0,
    explain: 'If outdoors, move away from buildings, trees, and power lines to open ground.'
  }, {
    id: 'q3',
    prompt: 'In a crowded place during an earthquake, what should you avoid?',
    options: ['Rushing for exits', 'Dropping to the ground', 'Covering your head', 'Staying where you are'],
    correct: 0,
    explain: 'Avoid rushing for exits - Drop, Cover, and Hold On where you are.'
  }, {
    id: 'q4',
    prompt: 'After driving through an earthquake, what should you expect?',
    options: ['Traffic signals may be down and roads may be damaged', 'Everything returns to normal immediately', 'Roads are always unaffected', 'GPS will automatically reroute you'],
    correct: 0,
    explain: 'Check for road damage before continuing and expect traffic signals to be down.'
  }]
}, {
  id: 'kc-fire-1',
  group: 'Fire',
  sourceType: 'article',
  sourceId: 'fire-1',
  title: 'How Fast House Fires Really Spread',
  icon: 'fire',
  color: '#DC2626',
  questions: [{
    id: 'q1',
    prompt: 'What is mainly responsible for most fire deaths?',
    options: ['Smoke and toxic gases', 'Structural collapse alone', 'Loud alarms', 'Water damage'],
    correct: 0,
    explain: 'Smoke and toxic gases spread fastest and are responsible for most fire deaths.'
  }, {
    id: 'q2',
    prompt: 'How much does a working smoke alarm reduce your risk of dying in a house fire?',
    options: ['Roughly half', 'It has no effect', 'It doubles the risk', "It's only useful during the day"],
    correct: 0,
    explain: 'A working alarm roughly halves your risk of dying in a house fire.'
  }, {
    id: 'q3',
    prompt: 'If a smoke alarm sounds, what should you do?',
    options: ['Get out immediately without stopping to gather belongings', 'Look for the source of the alarm first', 'Open all the windows first', 'Wait a few minutes to be sure'],
    correct: 0,
    explain: "If a smoke alarm sounds, get out immediately - don't stop to gather belongings."
  }, {
    id: 'q4',
    prompt: 'How should you check a door for heat during a fire?',
    options: ['With the back of your hand', 'By opening it slightly to peek', 'By kicking it', 'By listening closely first'],
    correct: 0,
    explain: 'Check doors for heat with the back of your hand before opening them.'
  }, {
    id: 'q5',
    prompt: 'What should you do if your clothes catch fire?',
    options: ['Stop, Drop, and Roll', 'Run to find water', 'Wave your arms to put it out', 'Remove clothing while running'],
    correct: 0,
    explain: 'If your clothes catch fire, Stop, Drop, and Roll to smother the flames.'
  }]
}, {
  id: 'kc-fire-2',
  group: 'Fire',
  sourceType: 'article',
  sourceId: 'fire-2',
  title: 'Preventing Fires Before They Start',
  icon: 'fire',
  color: '#DC2626',
  questions: [{
    id: 'q1',
    prompt: 'What is a common cause of house fires?',
    options: ['Cooking left unattended', 'Rainy weather', 'Cold temperatures', 'Open windows'],
    correct: 0,
    explain: 'Most house fires start from cooking left unattended, faulty electrics, or open flames too close to something flammable.'
  }, {
    id: 'q2',
    prompt: 'What should you never use on an oil or fat pan fire?',
    options: ['Water', 'A lid', 'Turning off the heat', 'A fire blanket'],
    correct: 0,
    explain: 'Never use water on an oil or fat fire - cover it with a lid instead.'
  }, {
    id: 'q3',
    prompt: "If a fire is spreading and you're unsure you can control it, what should you do?",
    options: ['Leave immediately and close the door behind you', 'Try harder to put it out yourself', 'Open windows to let smoke out first', 'Search for the extinguisher first'],
    correct: 0,
    explain: "Leave immediately and close the door behind you to slow its spread, then call emergency services."
  }, {
    id: 'q4',
    prompt: "Why shouldn't you assume a fire is fully out?",
    options: ['Hidden embers can reignite it', 'Fires can never reignite', "It's always obviously fine", 'Smoke always clears instantly'],
    correct: 0,
    explain: 'Even a fire that seems fully out can reignite from hidden embers.'
  }]
}, {
  id: 'kc-fire-3',
  group: 'Fire',
  sourceType: 'article',
  sourceId: 'fire-3',
  title: 'Wildfire and Bushfire Safety',
  icon: 'fire',
  color: '#DC2626',
  questions: [{
    id: 'q1',
    prompt: 'What is defensible space?',
    options: ['A cleared area around your home free of dry vegetation', 'A fireproof shelter underground', 'A legal property boundary', 'A designated evacuation road'],
    correct: 0,
    explain: 'Create defensible space around your home by clearing dry leaves, brush, and dead vegetation.'
  }, {
    id: 'q2',
    prompt: 'Why is wildfire dangerous even for people who evacuate late?',
    options: ['It can move faster than people can run', 'It always gives days of warning', 'It never spreads quickly', 'It only threatens forests, not homes'],
    correct: 0,
    explain: 'Wildfires can move faster than people can run and threaten homes with little warning.'
  }, {
    id: 'q3',
    prompt: 'If trapped by a wildfire, what should you do?',
    options: ['Shelter in a cleared area away from vegetation and stay low', 'Run through the thickest brush to hide', 'Climb the nearest tree', 'Wrap yourself in dry leaves for cover'],
    correct: 0,
    explain: 'If trapped, shelter in a cleared area away from vegetation, cover exposed skin, and stay low.'
  }, {
    id: 'q4',
    prompt: "Why shouldn't you return home right after a wildfire passes?",
    options: ['Hot spots and unstable trees can remain dangerous for days', "It's always safe within minutes", 'There is never any risk once flames are gone', 'Insurance requires a waiting period'],
    correct: 0,
    explain: "Don't return until officials say it's safe - hot spots and unstable trees can remain dangerous for days."
  }]
}, {
  id: 'kc-severe-weather-1',
  group: 'Severe Weather',
  sourceType: 'article',
  sourceId: 'severe-weather-1',
  title: 'Understanding Storm Warnings',
  icon: 'weather-hurricane',
  color: '#7C3AED',
  questions: [{
    id: 'q1',
    prompt: "What does a weather 'warning' mean, compared to a 'watch'?",
    options: ['It is happening or imminent - act now', 'Conditions are merely possible in future', 'Warnings are less serious than watches', 'It means the storm has already ended'],
    correct: 0,
    explain: "A 'warning' means severe weather is happening or imminent and you should act now."
  }, {
    id: 'q2',
    prompt: 'Where is the safest room during severe weather?',
    options: ['An interior room away from windows', 'Right next to the largest window', 'Outside on a covered porch', 'The garage'],
    correct: 0,
    explain: 'Identify the safest room in your home - usually an interior room away from windows.'
  }, {
    id: 'q3',
    prompt: 'Why avoid corded electronics during lightning?',
    options: ['Lightning can travel through wiring', 'They use too much electricity', 'They interfere with weather radios', 'They overheat in storms'],
    correct: 0,
    explain: 'Avoid using corded electronics during lightning.'
  }, {
    id: 'q4',
    prompt: 'After a storm passes, why should you wait before going outside?',
    options: ['Storms can have multiple waves', "It's always fully over after the first calm moment", 'There is no reason to wait', 'To let the ground dry first'],
    correct: 0,
    explain: 'Wait for the all-clear before going outside, since storms can have multiple waves.'
  }, {
    id: 'q5',
    prompt: 'How should you treat a downed power line?',
    options: ['As if it is live, and stay away', 'As harmless once the storm passes', 'Safe to move if wearing gloves', 'Safe if it looks disconnected'],
    correct: 0,
    explain: 'Watch for downed power lines - treat every one as live.'
  }]
}, {
  id: 'kc-severe-weather-2',
  group: 'Severe Weather',
  sourceType: 'article',
  sourceId: 'severe-weather-2',
  title: 'Sheltering from Tornadoes and High Winds',
  icon: 'weather-hurricane',
  color: '#7C3AED',
  questions: [{
    id: 'q1',
    prompt: 'Where is the best place to shelter from a tornado?',
    options: ['A basement or interior room with no windows', 'Near a window for visibility', 'In a mobile home', 'On the top floor'],
    correct: 0,
    explain: 'Identify the lowest, most interior part of your home as your shelter spot.'
  }, {
    id: 'q2',
    prompt: 'What should you do with your head and neck during a tornado?',
    options: ['Cover them and get low', 'Keep them exposed for awareness', 'Point them toward the window', 'Wrap them in loose fabric only'],
    correct: 0,
    explain: 'Get low, cover your head and neck, and put as many walls as possible between you and the outside.'
  }, {
    id: 'q3',
    prompt: "If you're in a vehicle during a tornado warning, what should you do?",
    options: ['Seek a sturdy building instead of outrunning it', 'Try to drive faster than the tornado', 'Stay parked exactly where you are', 'Open all windows to equalise pressure'],
    correct: 0,
    explain: 'If in a vehicle, seek a sturdy building instead of trying to outrun the tornado.'
  }, {
    id: 'q4',
    prompt: 'Why is tornado damage often described as very localised?',
    options: ['Because nearby help and neighbours can matter a lot', 'Because tornadoes affect entire countries evenly', 'Because damage is always identical everywhere', 'Because tornadoes never repeat in the same area'],
    correct: 0,
    explain: 'Tornado damage is often very localised, so nearby help can matter.'
  }]
}, {
  id: 'kc-severe-weather-3',
  group: 'Severe Weather',
  sourceType: 'article',
  sourceId: 'severe-weather-3',
  title: 'Hurricane and Coastal Storm Preparedness',
  icon: 'weather-hurricane',
  color: '#7C3AED',
  questions: [{
    id: 'q1',
    prompt: 'How far in advance are hurricanes usually tracked, compared to tornadoes?',
    options: ['Usually days in advance', 'Never more than a few seconds', 'Exactly the same as tornadoes', 'Only after landfall'],
    correct: 0,
    explain: "Unlike tornadoes, hurricanes are usually tracked for days in advance."
  }, {
    id: 'q2',
    prompt: "When should you evacuate if you're in a storm surge zone?",
    options: ['Early, before roads flood or become gridlocked', 'Only after the storm has already hit', 'Storm surge zones never need evacuation', 'Only if told to by a neighbour'],
    correct: 0,
    explain: "Evacuate early if you're in a storm surge zone - don't wait until roads are flooded."
  }, {
    id: 'q3',
    prompt: "What is the 'eye' of a hurricane?",
    options: ['A temporary calm period before dangerous winds return', 'The most dangerous part of the storm', 'A sign the storm has completely ended', 'The point where it makes landfall'],
    correct: 0,
    explain: "The calm 'eye' of the storm is temporary and dangerous winds will return."
  }, {
    id: 'q4',
    prompt: "Why shouldn't you use a generator indoors after a hurricane?",
    options: ['Carbon monoxide risk', "It's too loud", 'It uses too much fuel', 'It can attract lightning'],
    correct: 0,
    explain: "Don't use generators indoors due to carbon monoxide risk."
  }]
}, {
  id: 'kc-general-1',
  group: 'General Emergency Planning',
  sourceType: 'article',
  sourceId: 'general-1',
  title: 'Building a Family Emergency Plan',
  icon: 'clipboard-text-outline',
  color: '#059669',
  questions: [{
    id: 'q1',
    prompt: 'How many meeting points should a family emergency plan include?',
    options: ['Two - one near home, one further away', "Zero, they aren't useful", 'Exactly one, always at home', 'As many as possible, with no limit'],
    correct: 0,
    explain: 'Agree on two meeting points - one near home, one further away.'
  }, {
    id: 'q2',
    prompt: 'Why choose an out-of-area contact?',
    options: ['Local phone lines may be jammed in a disaster', 'It is required by law', 'It has no real purpose', 'They can call emergency services for you'],
    correct: 0,
    explain: 'Choose an out-of-area contact everyone can call if local phone lines are jammed.'
  }, {
    id: 'q3',
    prompt: 'During an emergency, why might texts work better than calls?',
    options: ['Texts often get through when voice networks are overloaded', 'Calls are always faster', 'Texts require no signal at all', 'Calls are blocked during emergencies'],
    correct: 0,
    explain: 'Use text messages over calls where possible, since texts often get through when networks are overloaded.'
  }, {
    id: 'q4',
    prompt: 'What should you do with your plan after an emergency?',
    options: ['Review what worked and update it', 'Throw it away since it is no longer needed', 'Never look at it again', 'Keep it exactly the same forever'],
    correct: 0,
    explain: 'Review what worked and what did not in your plan, and update it.'
  }, {
    id: 'q5',
    prompt: "Who should you help first if you're together during an emergency?",
    options: ['Vulnerable family members', 'Whoever is closest to the exit', "It doesn't matter", 'Whoever asks first'],
    correct: 0,
    explain: 'Help vulnerable family members first if you are together.'
  }]
}, {
  id: 'kc-general-2',
  group: 'General Emergency Planning',
  sourceType: 'article',
  sourceId: 'general-2',
  title: 'What Belongs in Your Emergency Kit',
  icon: 'clipboard-text-outline',
  color: '#059669',
  questions: [{
    id: 'q1',
    prompt: 'How many hours is an emergency kit meant to cover without outside help?',
    options: ['The first 72 hours', 'Only 1 hour', 'Two full weeks', 'A full month'],
    correct: 0,
    explain: 'A go-bag lets you survive the first 72 hours after a disaster without outside help.'
  }, {
    id: 'q2',
    prompt: 'Besides water and food, what else should a kit include?',
    options: ['A torch, power bank, and first-aid kit', 'Only entertainment items', 'Nothing besides food', 'Only cash, nothing else'],
    correct: 0,
    explain: 'Pack water, food, a torch, a power bank, a first-aid kit, documents, and some cash.'
  }, {
    id: 'q3',
    prompt: 'How often should you check your kit?',
    options: ['Every few months', 'Once, and never again', 'Every single day', 'Only when a disaster is imminent'],
    correct: 0,
    explain: 'Set a reminder to check expiry dates and battery levels every few months.'
  }, {
    id: 'q4',
    prompt: 'What should you do with a kit after using items from it?',
    options: ['Restock it as soon as possible', 'Leave it empty until next time', 'Throw the whole kit away', 'Wait a year before restocking'],
    correct: 0,
    explain: 'Restock anything you used as soon as possible, since a second disaster can follow the first.'
  }]
}, {
  id: 'kc-general-3',
  group: 'General Emergency Planning',
  sourceType: 'article',
  sourceId: 'general-3',
  title: 'Staying Informed and Helping Others',
  icon: 'clipboard-text-outline',
  color: '#059669',
  questions: [{
    id: 'q1',
    prompt: 'What should you verify before sharing something you saw on social media during an emergency?',
    options: ['That it is accurate and from an official source', 'Nothing, share everything immediately', 'Only check if it is popular', 'Nothing needs checking if it sounds true'],
    correct: 0,
    explain: 'Verify anything you see on social media before acting on or sharing it.'
  }, {
    id: 'q2',
    prompt: 'Who might need extra support in a disaster?',
    options: ['Elderly neighbours or people living alone', 'Nobody needs extra support', 'Only people you already know well', 'Only children'],
    correct: 0,
    explain: 'Identify neighbours - elderly people, those with disabilities, or people living alone - who might need extra support.'
  }, {
    id: 'q3',
    prompt: 'What should you do instead of entering a dangerous building to help someone?',
    options: ['Call professional responders', 'Go in alone regardless of risk', 'Wait and do nothing at all', 'Ask a stranger to go in instead'],
    correct: 0,
    explain: 'Never enter a damaged building or dangerous area to help someone - call professional responders instead.'
  }, {
    id: 'q4',
    prompt: 'What is a core preparedness skill on its own?',
    options: ['Knowing where to get reliable information', 'Owning the most expensive gear', 'Avoiding all news sources', 'Relying only on rumours'],
    correct: 0,
    explain: 'Knowing where to get reliable updates is a core preparedness skill on its own.'
  }]
}];
export function getChapterById(chapterId) {
  return KNOWLEDGE_CHECK_CHAPTERS.find(c => c.id === chapterId);
}
export const TOTAL_KNOWLEDGE_CHECK_QUESTIONS = KNOWLEDGE_CHECK_CHAPTERS.reduce((sum, c) => sum + c.questions.length, 0);
