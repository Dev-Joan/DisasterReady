export const EMERGENCY_NUMBERS = {
  Lebanon: {
    mode: 'split',
    police: '160',
    fire: '175',
    ambulance: '140'
  },
  UAE: {
    mode: 'split',
    police: '999',
    fire: '997',
    ambulance: '998'
  },
  'Saudi Arabia': {
    mode: 'split',
    police: '999',
    fire: '998',
    ambulance: '997'
  },
  Egypt: {
    mode: 'split',
    police: '122',
    fire: '180',
    ambulance: '123'
  },
  'South Africa': {
    mode: 'split',
    police: '10111',
    fire: '10111',
    ambulance: '10177'
  },
  UK: {
    mode: 'unified',
    unified: '999'
  },
  France: {
    mode: 'split',
    police: '17',
    fire: '18',
    ambulance: '15'
  },
  Germany: {
    mode: 'split',
    police: '110',
    fire: '112',
    ambulance: '112'
  },
  Italy: {
    mode: 'unified',
    unified: '112'
  },
  Greece: {
    mode: 'split',
    police: '100',
    fire: '199',
    ambulance: '166'
  },
  Japan: {
    mode: 'split',
    police: '110',
    fire: '119',
    ambulance: '119'
  },
  India: {
    mode: 'split',
    police: '100',
    fire: '101',
    ambulance: '108'
  },
  Philippines: {
    mode: 'unified',
    unified: '911'
  },
  Indonesia: {
    mode: 'split',
    police: '110',
    fire: '113',
    ambulance: '118'
  },
  China: {
    mode: 'split',
    police: '110',
    fire: '119',
    ambulance: '120'
  },
  US: {
    mode: 'unified',
    unified: '911'
  },
  Canada: {
    mode: 'unified',
    unified: '911'
  },
  Mexico: {
    mode: 'unified',
    unified: '911'
  },
  Brazil: {
    mode: 'split',
    police: '190',
    fire: '193',
    ambulance: '192'
  },
  Argentina: {
    mode: 'unified',
    unified: '911'
  },
  default: {
    mode: 'unified',
    unified: '112'
  }
};
export function getEmergencyNumbers(country) {
  return EMERGENCY_NUMBERS[country] || EMERGENCY_NUMBERS.default;
}
