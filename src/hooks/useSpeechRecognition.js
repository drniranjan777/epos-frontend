import { useCallback, useEffect, useRef, useState } from 'react';

const SpeechRecognition =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

const ERROR_MESSAGES = {
  'not-allowed': 'Microphone access was blocked. Allow it in the browser settings.',
  'service-not-allowed': 'Microphone access was blocked. Allow it in the browser settings.',
  'no-speech': 'Didn’t catch that. Tap the mic and try again.',
  'audio-capture': 'No microphone found.',
  network: 'Voice search needs an internet connection.',
};

/**
 * Single-phrase speech recognition (Chrome, Edge, Android). `onResult` receives the
 * recognised text. `supported` is false in browsers without the Web Speech API.
 */
export function useSpeechRecognition({ onResult, lang = 'en-IN' }) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const start = useCallback(() => {
    if (!SpeechRecognition) return;
    recognitionRef.current?.abort();
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      // Spoken part numbers often come out with spaces ("JCB HF 001"); keep them, search
      // matches on each word.
      const text = event.results[0]?.[0]?.transcript?.trim() ?? '';
      if (text) onResultRef.current(text.replace(/\.$/, ''));
    };
    recognition.onerror = (event) => {
      if (event.error !== 'aborted') {
        setError(ERROR_MESSAGES[event.error] ?? 'Voice search failed.');
      }
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setError(null);
    setListening(true);
    recognition.start();
  }, [lang]);

  const stop = useCallback(() => recognitionRef.current?.stop(), []);

  return { supported: Boolean(SpeechRecognition), listening, error, start, stop };
}
