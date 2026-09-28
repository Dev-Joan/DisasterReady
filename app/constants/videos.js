export const VIDEOS_BY_HAZARD = {
  flood: [{
    id: 'flood-v1',
    title: 'Flood Safety: Before, During and After',
    source: 'American Red Cross',
    url: 'https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/flood.html'
  }, {
    id: 'flood-v2',
    title: 'Flood Preparedness Guide',
    source: 'FEMA / Ready.gov',
    url: 'https://www.ready.gov/floods'
  }, {
    id: 'flood-v3',
    title: 'Flood Safety Tips',
    source: 'National Weather Service · YouTube',
    url: 'https://www.youtube.com/results?search_query=national+weather+service+flood+safety'
  }],
  earthquake: [{
    id: 'eq-v1',
    title: 'Earthquake Safety at Home',
    source: 'FEMA / Ready.gov',
    url: 'https://www.ready.gov/earthquakes'
  }, {
    id: 'eq-v2',
    title: 'Earthquake Preparedness',
    source: 'American Red Cross',
    url: 'https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/earthquake.html'
  }, {
    id: 'eq-v3',
    title: 'Drop, Cover, and Hold On',
    source: 'Great ShakeOut · YouTube',
    url: 'https://www.youtube.com/results?search_query=drop+cover+hold+on+earthquake+safety'
  }],
  fire: [{
    id: 'fire-v1',
    title: 'Home Fire Safety Guide',
    source: 'FEMA / Ready.gov',
    url: 'https://www.ready.gov/home-fires'
  }, {
    id: 'fire-v2',
    title: 'Home Fire Preparedness',
    source: 'American Red Cross',
    url: 'https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/home-fire.html'
  }, {
    id: 'fire-v3',
    title: 'Home Fire Escape Planning',
    source: 'NFPA · YouTube',
    url: 'https://www.youtube.com/results?search_query=NFPA+home+fire+escape+plan'
  }],
  severe_weather: [{
    id: 'sw-v1',
    title: 'Tornado Preparedness',
    source: 'FEMA / Ready.gov',
    url: 'https://www.ready.gov/tornadoes'
  }, {
    id: 'sw-v2',
    title: 'Hurricane Preparedness',
    source: 'FEMA / Ready.gov',
    url: 'https://www.ready.gov/hurricanes'
  }, {
    id: 'sw-v3',
    title: 'Severe Weather Safety',
    source: 'National Weather Service · YouTube',
    url: 'https://www.youtube.com/results?search_query=national+weather+service+severe+weather+safety'
  }],
  general: [{
    id: 'gen-v1',
    title: 'Make a Family Emergency Plan',
    source: 'FEMA / Ready.gov',
    url: 'https://www.ready.gov/plan'
  }, {
    id: 'gen-v2',
    title: 'Build an Emergency Kit',
    source: 'FEMA / Ready.gov',
    url: 'https://www.ready.gov/kit'
  }, {
    id: 'gen-v3',
    title: 'Emergency Kit Essentials',
    source: 'American Red Cross',
    url: 'https://www.redcross.org/get-help/how-to-prepare-for-emergencies/survival-kit-supplies.html'
  }]
};
export function getVideosByHazard(hazardKey) {
  return VIDEOS_BY_HAZARD[hazardKey] || [];
}
