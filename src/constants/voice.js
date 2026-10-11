/**
 * Languages people can speak to voice search and Ask Stock. `code` is the browser speech
 * locale (recognition and read-aloud); `short` is the language sent to the server, which
 * answers Ask Stock questions in it. Add a language here, in askStockStrings.js and in the
 * server's askStock/messages.js.
 */
export const VOICE_LANGUAGES = [
  { code: 'en-IN', short: 'en', label: 'English' },
  { code: 'te-IN', short: 'te', label: 'తెలుగు' },
  { code: 'hi-IN', short: 'hi', label: 'हिन्दी' },
];

const STORAGE_KEY = 'jcb-inventory:voice-language';
const DEFAULT_LANGUAGE = 'en-IN';

/** 'te-IN' → 'te' */
export const shortLanguage = (code) => VOICE_LANGUAGES.find((l) => l.code === code)?.short ?? 'en';

/** 'te' → 'te-IN' (null if the language is not offered) */
export const languageCode = (short) => VOICE_LANGUAGES.find((l) => l.short === short)?.code ?? null;

/** The language chosen last time on this device (shared by every voice feature), or English. */
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
