/**
 * Languages people can speak to voice search and Ask Stock. `code` is the browser speech
 * recognition language; the parser understands part words, numbers and questions in each.
 * Answers are written (and read aloud) in English.
 */
export const VOICE_LANGUAGES = [
  { code: 'en-IN', label: 'English', hint: 'English or Hinglish' },
  { code: 'te-IN', label: 'తెలుగు', hint: 'Telugu' },
  { code: 'hi-IN', label: 'हिन्दी', hint: 'Hindi' },
];

const STORAGE_KEY = 'jcb-inventory:voice-language';
const DEFAULT_LANGUAGE = 'en-IN';

/** The language chosen last time (shared by every voice feature), or English. */
export function readVoiceLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return VOICE_LANGUAGES.some((l) => l.code === stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function saveVoiceLanguage(code) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Remembering the language is a convenience only.
  }
}
