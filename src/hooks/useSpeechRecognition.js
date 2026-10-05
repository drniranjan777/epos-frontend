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
 * Single-phrase speech recognition (Chrome, Edge, Android). `onResult` receives the final
 * recognised text; `interim` holds what is being heard while the user is still speaking.
 * `supported` is false in browsers without the Web Speech API. `errorCode` is the browser's
 * error name (e.g. 'not-allowed' when the microphone is blocked).
 *
 * @param {{ onResult: (text: string) => void, onError?: (code: string) => void, lang?: string }} options
 *   lang e.g. 'en-IN', 'hi-IN'
 */
export function useSpeechRecognition({ onResult, onError, lang = 'en-IN' }) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  });

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const start = useCallback(() => {
    if (!SpeechRecognition) return;
    recognitionRef.current?.abort();
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const result = event.results[0];
      const text = result?.[0]?.transcript?.trim() ?? '';
      if (!result?.isFinal) {
        setInterim(text);
        return;
      }
      setInterim('');
      if (text) onResultRef.current(text.replace(/[.।]$/, ''));
    };
    recognition.onerror = (event) => {
      if (event.error !== 'aborted') {
        setError(ERROR_MESSAGES[event.error] ?? 'Voice search failed.');
        setErrorCode(event.error);
        onErrorRef.current?.(event.error);
      }
    };
    recognition.onend = () => {
      setListening(false);
      setInterim('');
    };
    recognitionRef.current = recognition;
    setError(null);
    setErrorCode(null);
    setListening(true);
    recognition.start();
  }, [lang]);

  const stop = useCallback(() => recognitionRef.current?.stop(), []);

  return {
    supported: Boolean(SpeechRecognition),
    listening,
    interim,
    error,
    errorCode,
    start,
    stop,
  };
}
