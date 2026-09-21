export const HAZARD_CATEGORIES = [
  { key: 'flood', label: 'Flood', icon: 'waves', color: '#0EA5E9' },
  { key: 'earthquake', label: 'Earthquake', icon: 'home-alert', color: '#D97706' },
  { key: 'fire', label: 'Fire', icon: 'fire', color: '#DC2626' },
  { key: 'severe_weather', label: 'Severe Weather', icon: 'weather-hurricane', color: '#7C3AED' },
  { key: 'general', label: 'General Emergency Planning', icon: 'clipboard-text-outline', color: '#059669' }
];

export const ARTICLES = [
  // ---- FLOOD ----
  {
    id: 'flood-1',
    hazard: 'flood',
    title: 'Understanding Flood Risk',
    mins: 4,
    sections: {
      whatItIs: "A flood occurs when water covers land that is normally dry — from heavy or prolonged rainfall, a river overflowing its banks, storm surge along the coast, or drains unable to cope with sudden downpours. Floods can develop over days (river flooding) or within minutes (flash flooding), and they are one of the most common and costly natural disasters worldwide.",
      before: "Find out if your home is in a flood-risk area using your local authority's flood maps. Keep important documents and valuables on higher floors or shelves, know your nearest higher ground, and keep a stocked go-bag by the door. If you own flood barriers or sandbags, know where they're stored and how to use them quickly.",
      during: "If a flood warning is issued, move to higher ground immediately — don't wait for water to reach your door. Never walk or drive through floodwater: just 15cm can knock an adult off their feet, and 60cm can float a car, and you can't see what's underneath. If it's safe to reach, turn off electricity and gas at the mains.",
      after: "Don't return home until officials confirm it's safe — floodwater can hide structural damage, contamination, or live electrical hazards. Avoid contact with floodwater, as it may carry sewage or chemicals. Photograph any damage for insurance before cleaning up, and have your electrics checked by a professional before switching them back on."
    }
  },
  {
    id: 'flood-2',
    hazard: 'flood',
    title: 'Flash Floods vs. River Floods',
    mins: 4,
    sections: {
      whatItIs: "Not all floods behave the same way. A flash flood develops within minutes to hours after intense rainfall, often in urban areas or narrow valleys with little warning. A river (or fluvial) flood builds up gradually over days as a river's water level rises past its banks, usually after prolonged or widespread rain. Coastal flooding adds a third pattern, driven by storm surge and high tides.",
      before: "Learn which type of flooding is most likely where you live — flash floods demand a plan you can execute in minutes, while river floods usually give more warning time. Sign up for local flood alerts, and identify at least two routes to higher ground that don't cross low bridges or underpasses.",
      during: "In a flash flood, act immediately — there may be no time to gather belongings. Move away from rivers, streams, and storm drains, and never camp or park near a dry creek bed during heavy rain. In a slower river flood, follow official guidance on when to evacuate and don't wait until the last moment.",
      after: "Flash-flooded areas can leave debris, unstable ground, and downed power lines with little visible warning — inspect surroundings carefully before moving through them. For river floods, water may take days to recede; monitor official updates before assuming an area is safe to return to."
    }
  },
  {
    id: 'flood-3',
    hazard: 'flood',
    title: 'Protecting Your Family During a Flood Evacuation',
    mins: 5,
    sections: {
      whatItIs: "An evacuation is the planned movement of people away from a flood-risk area to safety. Knowing how to evacuate calmly and quickly — rather than deciding under pressure — is often what determines whether a flood is a disruption or a tragedy.",
      before: "Agree on a family meeting point outside the flood zone and make sure everyone, including children, knows it. Keep your go-bag, medication, and pet supplies together and ready. Practice your evacuation route as a family at least once so it's familiar under stress.",
      during: "Leave as soon as an evacuation order is given — don't wait to see how bad it gets. Take your go-bag, follow official evacuation routes rather than shortcuts, and help elderly or disabled neighbours if it's safe to do so. Keep a battery radio or charged phone to follow updates.",
      after: "Check in with your out-of-area contact so family know you're safe. Wait for official confirmation before returning home, and be prepared for temporary shelter arrangements if your home isn't yet safe to enter. Keep receipts for any emergency expenses — they may be needed for insurance or aid claims."
    }
  },

  // ---- EARTHQUAKE ----
  {
    id: 'earthquake-1',
    hazard: 'earthquake',
    title: 'How Earthquakes Happen',
    mins: 4,
    sections: {
      whatItIs: "An earthquake is the sudden release of energy in the Earth's crust, usually along a fault line, causing the ground to shake. The shaking itself rarely lasts more than a minute, but it can trigger landslides, fires, and building collapse, and aftershocks — smaller quakes following the main one — can continue for hours, days, or even weeks.",
      before: "Secure heavy furniture, shelves, and water heaters to walls so they can't tip over. Know the sturdy furniture in every room you could shelter under, and keep your go-bag and a torch within reach of your bed. If you're in an earthquake-prone area, consider how your building would perform structurally.",
      during: "The instant shaking starts: Drop to the ground, take Cover under sturdy furniture, and Hold On until it stops. Stay indoors — most earthquake injuries happen from falling objects, not from collapsing buildings, and running outside puts you directly under falling debris and glass.",
      after: "Expect aftershocks and be ready to Drop, Cover, and Hold On again. Check yourself and others for injuries, and check for gas leaks, damaged wiring, or structural cracks before re-entering a building. If you smell gas, leave immediately and shut off the supply from outside if it's safe."
    }
  },
  {
    id: 'earthquake-2',
    hazard: 'earthquake',
    title: 'Earthquake-Proofing Your Home',
    mins: 4,
    sections: {
      whatItIs: "Most earthquake injuries come from falling or moving objects rather than the shaking itself, which means the way your home is arranged has a direct effect on your safety. Earthquake-proofing is about reducing hazards before the ground ever moves.",
      before: "Anchor tall furniture, bookshelves, and cabinets to wall studs. Store heavy items on lower shelves, and use latches on cabinet doors so contents don't fly out. Know where your gas, water, and electricity shut-off points are, and keep a wrench near the gas shut-off if it requires one.",
      during: "If you're at home when shaking starts, get away from windows, mirrors, and unsecured furniture and get under something sturdy nearby, like a table or desk. If nothing is available, crouch against an interior wall and cover your head and neck with your arms.",
      after: "Walk through your home carefully once shaking stops, watching for broken glass and unstable items. Don't use candles or open flames in case of a gas leak — use a torch instead. If your home is structurally damaged, don't stay inside until it's been inspected."
    }
  },
  {
    id: 'earthquake-3',
    hazard: 'earthquake',
    title: "What To Do If You're Not At Home",
    mins: 4,
    sections: {
      whatItIs: "Earthquakes don't wait for a convenient moment — knowing how to respond in a car, outdoors, or in a crowded building is just as important as knowing what to do at home.",
      before: "Think through your earthquake response for the places you spend the most time: work, school, your commute. Know your workplace's evacuation plan and where the nearest sturdy cover is at your desk or on your usual route.",
      during: "If you're driving, pull over away from bridges, overpasses, and power lines, and stay in the car with your seatbelt on until shaking stops. If you're outdoors, move away from buildings, trees, and power lines to open ground. If you're in a crowded place, avoid rushing for exits — Drop, Cover, and Hold On where you are.",
      after: "If driving, check for road damage before continuing and expect traffic signals to be down. If outdoors, watch for falling debris from buildings as you move to safety. Wherever you are, check in with your family's out-of-area contact as soon as it's safe to do so."
    }
  },

  // ---- FIRE ----
  {
    id: 'fire-1',
    hazard: 'fire',
    title: 'How Fast House Fires Really Spread',
    mins: 4,
    sections: {
      whatItIs: "A house fire needs only fuel, oxygen, and heat to grow, and modern homes — full of synthetic materials — can go from a small flame to a fully involved room in just a few minutes. Smoke and toxic gases spread even faster than flames and are responsible for most fire deaths, often while people are still asleep.",
      before: "Fit smoke alarms on every level of your home and test them monthly — a working alarm roughly halves your risk of dying in a house fire. Plan two escape routes from every room, agree a family meeting point outside, and keep escape routes clear of clutter.",
      during: "If a smoke alarm sounds, get out immediately — don't stop to gather belongings. Get low and go, since smoke and heat rise, and check doors for heat with the back of your hand before opening them. If a door is hot, use your second escape route instead.",
      after: "Once out, stay out and call emergency services from a safe distance — never go back inside for pets or possessions. If your clothes catch fire, Stop, Drop, and Roll to smother the flames. Wait for firefighters to confirm the building is safe before anyone re-enters."
    }
  },
  {
    id: 'fire-2',
    hazard: 'fire',
    title: 'Preventing Fires Before They Start',
    mins: 4,
    sections: {
      whatItIs: "Most house fires are preventable — they typically start from cooking left unattended, faulty electrics, or open flames left too close to something flammable, not from unavoidable accidents.",
      before: "Never leave cooking unattended, keep flammable items away from stoves and heaters, and don't overload electrical sockets. Have wiring and appliances checked if they're old or show signs of wear, and keep candles and open flames away from curtains, paper, and furniture.",
      during: "If a small pan fire starts, turn off the heat and cover it with a lid — never use water on an oil or fat fire. If a fire is spreading or you're unsure you can control it, leave immediately and close the door behind you to slow its spread, then call emergency services.",
      after: "Even a fire that seems fully out can reignite from hidden embers — don't assume it's safe without checking. Ventilate the area once it's confirmed safe, and have any fire-damaged electrics or gas appliances inspected before using them again."
    }
  },
  {
    id: 'fire-3',
    hazard: 'fire',
    title: 'Wildfire and Bushfire Safety',
    mins: 5,
    sections: {
      whatItIs: "A wildfire is an uncontrolled fire spreading through vegetation such as grass, brush, or forest. Driven by wind and dry conditions, wildfires can move faster than people can run and can threaten homes on the edge of urban areas with little warning.",
      before: "Create defensible space around your home by clearing dry leaves, brush, and dead vegetation for several metres. Keep gutters clear of debris, know your community's evacuation routes, and pack your go-bag with a mask for smoke before wildfire season begins.",
      during: "Evacuate early if advised — don't wait to see the fire before leaving, as roads can become impassable quickly. If trapped, shelter in a cleared area away from vegetation, cover exposed skin, and stay low to avoid smoke inhalation. Keep windows and doors closed while driving through smoke.",
      after: "Don't return until officials say it's safe — hot spots and unstable trees can remain dangerous for days. Watch for smouldering embers, and check your roof and gutters for hidden sparks that could reignite once you're allowed back."
    }
  },

  // ---- SEVERE WEATHER ----
  {
    id: 'severe-weather-1',
    hazard: 'severe_weather',
    title: 'Understanding Storm Warnings',
    mins: 4,
    sections: {
      whatItIs: "Severe weather covers a range of dangerous conditions — high winds, thunderstorms, hail, hurricanes, and tornadoes — that can develop quickly and cause damage over a wide area. A 'watch' means conditions are favourable for severe weather to develop; a 'warning' means it's happening or imminent and you should act now.",
      before: "Know the difference between a watch and a warning for your area, and sign up for official weather alerts. Secure or store loose outdoor items like furniture and bins that could become dangerous in high wind, and identify the safest room in your home — usually an interior room away from windows.",
      during: "When a warning is issued, move to your safest room immediately and stay away from windows, which can shatter under wind pressure. Avoid using corded electronics during lightning, and don't go outside to 'check on things' until the warning has passed.",
      after: "Wait for the all-clear before going outside, since storms can have multiple waves. Watch for downed power lines — treat every one as live — and avoid driving through standing water on roads, which can hide damage or be deeper than it looks."
    }
  },
  {
    id: 'severe-weather-2',
    hazard: 'severe_weather',
    title: 'Sheltering from Tornadoes and High Winds',
    mins: 4,
    sections: {
      whatItIs: "Tornadoes are rapidly rotating columns of air that can produce the most violent winds on Earth, capable of destroying buildings in seconds. Even without a tornado, straight-line winds from severe storms can down trees and power lines and cause serious damage.",
      before: "Identify the lowest, most interior part of your home — a basement or an inner room with no windows — as your shelter spot. Keep a helmet or heavy blanket nearby to protect your head, and know your local tornado siren or alert system.",
      during: "Get to your shelter spot immediately when a tornado warning is issued. Get low, cover your head and neck, and put as many walls as possible between you and the outside. If you're in a vehicle or mobile home, seek a sturdy building instead of trying to outrun the tornado.",
      after: "Watch for broken glass, exposed nails, and unstable structures when you emerge. Stay away from damaged buildings and downed lines, and check on neighbours if it's safe to do so — tornado damage is often very localised, so nearby help can matter."
    }
  },
  {
    id: 'severe-weather-3',
    hazard: 'severe_weather',
    title: 'Hurricane and Coastal Storm Preparedness',
    mins: 5,
    sections: {
      whatItIs: "Hurricanes (also called cyclones or typhoons depending on the region) are large rotating storm systems that bring destructive winds, heavy rain, and dangerous storm surge to coastal areas. Unlike tornadoes, they're usually tracked for days in advance, giving valuable time to prepare.",
      before: "Know your evacuation zone and route well before hurricane season. Stock several days of water, food, and medication, and have a plan for pets. Board up or protect windows if advised, and fully charge phones and power banks as the storm approaches.",
      during: "Evacuate early if you're in a storm surge zone — don't wait until roads are flooded or gridlocked. If sheltering in place, stay in an interior room away from windows, and be aware that the calm 'eye' of the storm is temporary and dangerous winds will return.",
      after: "Avoid floodwater and downed lines, and don't use generators indoors due to carbon monoxide risk. Document damage for insurance before cleanup, and be cautious of contaminated water supplies until authorities confirm it's safe to drink tap water again."
    }
  },

  // ---- GENERAL EMERGENCY PLANNING ----
  {
    id: 'general-1',
    hazard: 'general',
    title: 'Building a Family Emergency Plan',
    mins: 5,
    sections: {
      whatItIs: "A family emergency plan is a simple, agreed set of steps everyone in your household knows in advance, so that a disaster is met with action instead of panic. It covers how you'll communicate, where you'll meet, and what you'll take with you.",
      before: "Agree on two meeting points — one near home, one further away — and choose an out-of-area contact everyone can call if local phone lines are jammed. Make sure children and older relatives know the plan in language they understand, and write it down somewhere everyone can find it.",
      during: "Follow the plan you've practised rather than improvising — this is exactly why you made one. Use text messages over calls where possible, since texts often get through when voice networks are overloaded. Help vulnerable family members first if you're together.",
      after: "Check in with your out-of-area contact so they can relay your status to others. Review what worked and what didn't in your plan, and update it — plans that are tested and refined save more lives than plans that are only written once and forgotten."
    }
  },
  {
    id: 'general-2',
    hazard: 'general',
    title: 'What Belongs in Your Emergency Kit',
    mins: 5,
    sections: {
      whatItIs: "An emergency kit (or go-bag) is a ready supply of essentials that lets you survive the first 72 hours after a disaster without outside help, whether you shelter in place or need to leave quickly.",
      before: "Pack water, non-perishable food, a torch, a power bank, a first-aid kit, any essential medication, copies of important documents, and some cash. Store it somewhere accessible, and set a reminder to check expiry dates and battery levels every few months.",
      during: "Grab your kit as soon as you need to evacuate or shelter — don't waste time deciding what to take once an emergency is already underway. If sheltering in place, keep your kit and a charged phone within reach.",
      after: "Restock anything you used as soon as possible, since a second disaster or aftershock can follow the first. Note what you wished you'd packed and add it for next time — your kit should improve after every real use."
    }
  },
  {
    id: 'general-3',
    hazard: 'general',
    title: 'Staying Informed and Helping Others',
    mins: 5,
    sections: {
      whatItIs: "In any emergency, accurate information and community support are what separate a manageable situation from a dangerous one. Knowing where to get reliable updates — and how to help without putting yourself at risk — is a core preparedness skill on its own.",
      before: "Follow official emergency services and government alert accounts before a disaster happens, and keep a battery or hand-crank radio in case networks go down. Learn basic first aid, and identify neighbours — elderly people, those with disabilities, or people living alone — who might need extra support.",
      during: "Act on official guidance rather than rumours, and verify anything you see on social media before acting on or sharing it. Check on nearby neighbours if it's safe to do so, but never enter a damaged building or dangerous area to help someone — call professional responders instead.",
      after: "Continue following official channels, since guidance can change quickly as a situation develops. Support neighbours with information, supplies, or a listening ear, and look after your own wellbeing too — recovering from a disaster is a process, not a single event."
    }
  }
];

export function getArticlesByHazard(hazardKey) {
  return ARTICLES.filter(a => a.hazard === hazardKey);
}

export function getArticleById(articleId) {
  return ARTICLES.find(a => a.id === articleId);
}
