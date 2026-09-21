export const EMERGENCY_DISCLAIMER =
  'This is general guidance, not a substitute for professional medical training. In a real emergency, call your local emergency number immediately before or while giving aid.';

export const FIRST_AID_CATEGORIES = [
  { key: 'medical', label: 'Medical Emergencies', icon: { set: 'MaterialCommunityIcons', name: 'medical-bag' } },
  { key: 'disaster', label: 'During a Disaster', icon: { set: 'MaterialCommunityIcons', name: 'weather-hurricane' } }
];

export const FIRST_AID_GUIDES = [
  {
    id: 'cpr',
    category: 'medical',
    icon: { set: 'MaterialCommunityIcons', name: 'heart-pulse' },
    color: '#D32F2F',
    title: 'CPR (Adult)',
    summary: 'For an adult who is unresponsive and not breathing normally.',
    callFirst: 'Call emergency services immediately and ask for an ambulance before starting. Put the phone on speaker.',
    video: { label: 'Watch: How to do CPR (British Red Cross)', url: 'https://www.youtube.com/results?search_query=british+red+cross+how+to+do+cpr' },
    steps: [
      { title: 'Check response', text: 'Tap their shoulders and shout "Are you okay?" If there is no response, act quickly.' },
      { title: 'Check breathing', text: 'Look for normal breathing for no more than 10 seconds. Occasional gasps are NOT normal breathing.' },
      { title: 'Call for help', text: 'Call emergency services now and ask for an ambulance. Send someone for a defibrillator (AED) if one is nearby.' },
      { title: 'Position your hands', text: 'Place the heel of one hand in the centre of the chest, place your other hand on top and interlock fingers.' },
      { title: 'Give chest compressions', text: 'Push down hard and fast, about 5–6 cm deep, at a rate of 100–120 per minute. Let the chest come back up fully between pushes.' },
      { title: 'Keep going', text: 'Continue compressions without stopping until emergency help arrives or the person starts to show signs of life. Use an AED as soon as one is available and follow its spoken instructions.' }
    ]
  },
  {
    id: 'burns',
    category: 'medical',
    icon: { set: 'MaterialCommunityIcons', name: 'fire' },
    color: '#EA580C',
    title: 'Burns & Scalds',
    summary: 'For heat burns from fire, hot liquids, or hot surfaces.',
    callFirst: 'Call emergency services for large, deep, or facial burns, burns to a child, or any burn bigger than the person\'s hand.',
    video: { label: 'Watch: First aid for burns (St John Ambulance)', url: 'https://www.youtube.com/results?search_query=st+john+ambulance+first+aid+for+burns' },
    steps: [
      { title: 'Stop the burning', text: 'Move the person away from the heat source. Do not touch or peel away anything stuck to the skin.' },
      { title: 'Cool the burn', text: 'Cool it under cool or lukewarm running water for at least 20 minutes. Do not use ice, iced water, creams, or greasy substances like butter.' },
      { title: 'Remove tight items', text: 'Gently remove jewellery, watches or tight clothing near the burn before it starts to swell, unless it is stuck to the burn.' },
      { title: 'Cover it', text: 'Cover the burn loosely with cling film (a clean plastic bag works for hands or feet). This keeps it clean and reduces pain. Do not wrap tightly.' },
      { title: 'Keep them comfortable', text: 'Keep the person warm overall (but not the burn), and treat for shock if needed. Seek medical help for anything more than a small, minor burn.' }
    ]
  },
  {
    id: 'bleeding',
    category: 'medical',
    icon: { set: 'MaterialCommunityIcons', name: 'water-alert' },
    color: '#B91C1C',
    title: 'Severe Bleeding',
    summary: 'For a wound that is bleeding heavily.',
    callFirst: 'Call emergency services immediately for heavy bleeding that does not stop.',
    video: { label: 'Watch: How to treat severe bleeding (British Red Cross)', url: 'https://www.youtube.com/results?search_query=british+red+cross+severe+bleeding+first+aid' },
    steps: [
      { title: 'Protect yourself', text: 'If available, wear disposable gloves to avoid contact with blood.' },
      { title: 'Apply pressure', text: 'Press firmly on the wound with a clean pad or cloth (or the person\'s own hand) to stop the bleeding.' },
      { title: 'Keep pressing', text: 'Maintain firm, constant pressure. If blood soaks through, add another pad on top — do not remove the first one.' },
      { title: 'Raise the wound', text: 'If possible, raise the injured area above the level of the heart to help slow the bleeding.' },
      { title: 'Secure a dressing', text: 'Once bleeding is controlled, secure the pad with a bandage firmly enough to maintain pressure but not so tight it cuts off circulation.' },
      { title: 'Watch for shock', text: 'Keep the person lying down and warm while you wait for help. Reassure them and monitor their breathing.' }
    ]
  },
  {
    id: 'choking',
    category: 'medical',
    icon: { set: 'MaterialCommunityIcons', name: 'lungs' },
    color: '#7C3AED',
    title: 'Choking (Adult)',
    summary: 'For an adult who cannot breathe, speak, or cough because something is blocking their airway.',
    callFirst: 'If the blockage does not clear quickly, call emergency services immediately.',
    video: { label: 'Watch: How to help a choking adult (British Red Cross)', url: 'https://www.youtube.com/results?search_query=british+red+cross+choking+adult+first+aid' },
    steps: [
      { title: 'Encourage coughing', text: 'If they can still cough, encourage them to keep coughing to try to clear it themselves.' },
      { title: 'Give back blows', text: 'If they cannot clear it, lean them forwards and give up to 5 sharp blows between the shoulder blades with the heel of your hand.' },
      { title: 'Give abdominal thrusts', text: 'If back blows do not work, stand behind them, place a fist above the navel, grasp it with your other hand, and pull sharply inwards and upwards up to 5 times.' },
      { title: 'Repeat', text: 'Alternate 5 back blows and 5 abdominal thrusts until the blockage clears or help arrives.' },
      { title: 'If they collapse', text: 'If the person becomes unresponsive, call emergency services and begin CPR.' }
    ]
  },
  {
    id: 'flood',
    category: 'disaster',
    icon: { set: 'MaterialCommunityIcons', name: 'home-flood' },
    color: '#1E3A8A',
    title: 'During a Flood',
    summary: 'What to do as flood water rises.',
    callFirst: 'Follow official evacuation orders. Call emergency services if you or someone else is in danger from the water.',
    video: { label: 'Watch: Flood safety tips (FEMA)', url: 'https://www.youtube.com/results?search_query=fema+flood+safety+what+to+do' },
    steps: [
      { title: 'Move to higher ground', text: 'Get to the highest safe level you can. Never go into a basement or cellar as water rises.' },
      { title: 'Avoid the water', text: 'Never walk or drive through floodwater. Just 15 cm of moving water can knock you over and 60 cm can float a car. Hazards are hidden underneath.' },
      { title: 'Turn off utilities if safe', text: 'If it is safe to reach, turn off electricity and gas at the mains to reduce fire and electrocution risk.' },
      { title: 'Take your emergency kit', text: 'Bring your go-bag: water, medication, documents, phone and charger, and a torch.' },
      { title: 'Stay informed', text: 'Follow official alerts and instructions on a radio or phone. Do not rely on rumours.' }
    ]
  },
  {
    id: 'earthquake',
    category: 'disaster',
    icon: { set: 'MaterialCommunityIcons', name: 'home-alert' },
    color: '#B45309',
    title: 'During an Earthquake',
    summary: 'What to do when the ground shakes.',
    callFirst: 'After the shaking stops, call emergency services if anyone is injured or trapped.',
    video: { label: 'Watch: Drop, Cover and Hold On (Great ShakeOut)', url: 'https://www.youtube.com/results?search_query=drop+cover+hold+on+earthquake+shakeout' },
    steps: [
      { title: 'Drop', text: 'Drop down onto your hands and knees before the shaking knocks you down.' },
      { title: 'Cover', text: 'Take cover under sturdy furniture like a table. If there is none, protect your head and neck with your arms and move away from windows.' },
      { title: 'Hold on', text: 'Hold on to your shelter until the shaking stops. Be ready to move with it.' },
      { title: 'Stay put', text: 'Do not run outside during shaking — most injuries come from falling debris. If in bed, stay there and protect your head with a pillow.' },
      { title: 'After it stops', text: 'Check yourself and others for injuries. Expect aftershocks. Check for gas leaks and structural damage before moving around.' }
    ]
  },
  {
    id: 'fire',
    category: 'disaster',
    icon: { set: 'MaterialCommunityIcons', name: 'fire-alert' },
    color: '#C2410C',
    title: 'During a Fire',
    summary: 'What to do if there is a fire in your home.',
    callFirst: 'Get out, stay out, and call emergency services. Never go back inside for belongings.',
    video: { label: 'Watch: Home fire escape safety (NFPA)', url: 'https://www.youtube.com/results?search_query=nfpa+home+fire+escape+plan' },
    steps: [
      { title: 'Alert everyone', text: 'Shout to warn others and get everyone moving toward the nearest safe exit.' },
      { title: 'Stay low', text: 'Smoke rises, so crawl low under it where the air is cleaner. Cover your nose and mouth with a cloth if you can.' },
      { title: 'Check doors', text: 'Before opening a door, feel it with the back of your hand. If it is hot, do not open it — use another route.' },
      { title: 'Get out and stay out', text: 'Leave quickly, close doors behind you to slow the fire, and never go back inside for anything.' },
      { title: 'Call for help', text: 'Once safely outside, call emergency services. If trapped, close the door, block gaps with cloth, and signal from a window.' }
    ]
  }
];
