const {
  computeAccessibilityProfile,
  explainProfile
} = require('./accessibilityEngine');
const SCENARIOS = [{
  name: 'No flags (baseline)',
  flags: []
}, {
  name: 'Visual only',
  flags: ['visual']
}, {
  name: 'Motor only',
  flags: ['motor']
}, {
  name: 'Cognitive only',
  flags: ['cognitive']
}, {
  name: 'Motion sensitivity only',
  flags: ['motion']
}, {
  name: 'Hearing only',
  flags: ['hearing']
}, {
  name: 'Visual + Motor (compounding, non-overlapping axes)',
  flags: ['visual', 'motor']
}, {
  name: 'Cognitive + Motion (overlapping axis: both push reducedMotion)',
  flags: ['cognitive', 'motion']
}, {
  name: 'All five flags active',
  flags: ['visual', 'hearing', 'motor', 'cognitive', 'motion']
}];
function main() {
  console.log('\nACCESSIBILITY ENGINE - RULE-BY-RULE DEMONSTRATION\n');
  SCENARIOS.forEach(scenario => {
    const profile = computeAccessibilityProfile(scenario.flags);
    console.log('='.repeat(78));
    console.log(scenario.name);
    console.log('-'.repeat(78));
    console.log(explainProfile(profile));
    console.log(`Result: textScale=${profile.textScale}x, touchTarget=${profile.touchTargetMinSize}px, ` + `nav=${profile.navigationDepth}, contrast=${profile.contrastMode}, ` + `reducedMotion=${profile.reducedMotion}, screenReader=${profile.screenReader.level}, ` + `captions=${profile.captionsPreferred}`);
    console.log('');
  });
}
main();
