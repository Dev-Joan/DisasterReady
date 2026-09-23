import { useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';

// A slower, friendlier rate than the adult narration in AudioPlayerScreen —
// these are short one-line prompts read to a 6-10 year old who may not be
// able to read the on-screen text at all, not a long-form article.
const KID_RATE = 0.88;

// Shared by DispatchHeroScreen and FamilyPlanBuilderScreen so every picture
// choice and step prompt can be spoken aloud instead of requiring reading.
// Always stops any utterance already in flight before starting a new one —
// without that, rapid tapping through picture choices queues up overlapping
// speech instead of replacing it.
export default function useKidSpeech() {
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; Speech.stop(); };
  }, []);

  const speak = (text) => {
    if (!text) return;
    Speech.stop();
    Speech.speak(text, { rate: KID_RATE, pitch: 1.05 });
  };

  const stop = () => Speech.stop();

  return { speak, stop };
}
