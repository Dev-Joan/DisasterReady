export const AUDIO_EPISODES = [
  {
    id: 'e1',
    title: 'What to Put in Your Emergency Kit',
    desc: 'A calm guide to the essentials every home needs.',
    source: 'DisasterReady Audio',
    file: require('../assets/sounds/audio_kit.wav'),
    hazards: ['flood', 'earthquake', 'fire', 'severe_weather', 'general'],
    transcript: "Your emergency kit should let you survive the first 72 hours after a disaster without outside help. Pack water, non-perishable food, a torch, a power bank, a small first-aid kit, any essential medication, copies of important documents, and some cash. Store it somewhere accessible, not buried in a cupboard. Check it every few months — batteries lose charge, food expires, and needs change over time. If you ever use items from your kit, restock them as soon as possible, since a second emergency can follow the first."
  },
  {
    id: 'e2',
    title: 'Planning Your Evacuation Route',
    desc: 'How to plan where to go before an emergency happens.',
    source: 'DisasterReady Audio',
    file: require('../assets/sounds/audio_evac.wav'),
    hazards: ['flood', 'earthquake', 'fire', 'severe_weather', 'general'],
    transcript: "Agree on two meeting points with your household: one near home, and one further away in case your neighbourhood isn't safe to return to. Choose an out-of-area contact everyone can call if local phone lines are jammed. Know at least two routes out of your area that avoid low bridges and underpasses, which can flood or become blocked. Practice the route as a family so it's familiar under stress, and leave as soon as an evacuation order is given — don't wait to see how bad it gets."
  }
];

export function getAudioByHazard(hazardKey) {
  return AUDIO_EPISODES.filter(e => e.hazards.includes(hazardKey));
}

export function getEpisodeById(episodeId) {
  return AUDIO_EPISODES.find(e => e.id === episodeId);
}
