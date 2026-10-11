import { describe, expect, it } from 'vitest';
import { VOICE_LANGUAGES, languageCode, shortLanguage } from '../../constants/voice';
import { ASK_STOCK_STRINGS, askStockStrings, speechErrorText } from './askStockStrings';

describe('Ask Stock panel text', () => {
  it('has every string in every voice language', () => {
    const keys = Object.keys(ASK_STOCK_STRINGS.en).sort();
    for (const { short } of VOICE_LANGUAGES) {
      expect(Object.keys(ASK_STOCK_STRINGS[short]).sort()).toEqual(keys);
    }
  });

  it('falls back to English for an unknown language', () => {
    expect(askStockStrings('xx')).toBe(ASK_STOCK_STRINGS.en);
    expect(askStockStrings(undefined).send).toBe('Send');
  });

  it('explains speech errors in the chosen language', () => {
    const telugu = askStockStrings('te');
    expect(speechErrorText(telugu, 'not-allowed')).toBe(telugu.micBlocked);
    expect(speechErrorText(telugu, 'no-speech')).toBe(telugu.noSpeech);
    expect(speechErrorText(telugu, 'something-else')).toBe(telugu.voiceFailed);
  });

  it('maps speech locales to server languages and back', () => {
    expect(shortLanguage('te-IN')).toBe('te');
    expect(shortLanguage('unknown')).toBe('en');
    expect(languageCode('hi')).toBe('hi-IN');
    expect(languageCode(null)).toBeNull();
  });
});
