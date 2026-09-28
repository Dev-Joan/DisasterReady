import { useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
const KID_RATE = 0.88;
export default function useKidSpeech() {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      Speech.stop();
    };
  }, []);
  const speak = text => {
    if (!text) return;
    Speech.stop();
    Speech.speak(text, {
      rate: KID_RATE,
      pitch: 1.05
    });
  };
  const stop = () => Speech.stop();
  return {
    speak,
    stop
  };
}
