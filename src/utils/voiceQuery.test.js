import { describe, expect, it } from 'vitest';
import { parseVoiceQuery } from './voiceQuery';

describe('parseVoiceQuery', () => {
  it.each([
    ['JCB 3DX hydraulic pump', 'jcb 3dx hydraulic pump'],
    ['Show JCB 3DX hydraulic pump', 'jcb 3dx hydraulic pump'],
    ['JCB 3DX ka hydraulic pump dikhao', 'jcb 3dx hydraulic pump'],
    ['JCB filter chahiye', 'jcb filter'],
    ['Engine oil filter for 3DX', 'engine oil filter 3dx'],
    ['Hydraulic hose for JCB', 'hydraulic hose jcb'],
    ['JCB 3DX ka bucket pin hai?', 'jcb 3dx bucket pin'],
    ['3DX mein jo fuel filter lagta hai', '3dx fuel filter'],
    ['JCB ka oil filter', 'jcb oil filter'],
  ])('English / Hinglish: "%s"', (spoken, query) => {
    expect(parseVoiceQuery(spoken)).toEqual({ query, quantity: null });
  });

  it('understands Hindi (Devanagari) part words', () => {
    expect(parseVoiceQuery('जेसीबी का हाइड्रोलिक फ़िल्टर चाहिए').query).toBe(
      'jcb hydraulic filter',
    );
    expect(parseVoiceQuery('३डीएक्स का फ्यूल फिल्टर दिखाओ').query).toBe('3dx fuel filter');
    expect(parseVoiceQuery('जे सी बी बकेट पिन').query).toBe('jcb bucket pin');
  });

  it('does not break longer Hindi words that contain a shorter known word', () => {
    // "अल्टरनेटर" contains "नट" (nut) but must map to alternator only.
    expect(parseVoiceQuery('अल्टरनेटर').query).toBe('alternator');
  });

  it('picks up a quantity only when a unit follows the number', () => {
    expect(parseVoiceQuery('3DX oil filter 50 piece add karo')).toEqual({
      query: '3dx oil filter',
      quantity: 50,
    });
    expect(parseVoiceQuery('JCB hydraulic filter ke 20 piece stock mein add karo')).toEqual({
      query: 'jcb hydraulic filter',
      quantity: 20,
    });
    expect(parseVoiceQuery('bucket tooth bees pcs')).toEqual({
      query: 'bucket tooth',
      quantity: 20,
    });
    expect(parseVoiceQuery('हाइड्रोलिक ऑयल दस लीटर')).toEqual({
      query: 'hydraulic oil',
      quantity: 10,
    });
    expect(parseVoiceQuery('fuel filter quantity 5')).toEqual({
      query: 'fuel filter',
      quantity: 5,
    });
    // A bare number is part of the search, not a quantity.
    expect(parseVoiceQuery('track roller 200').quantity).toBeNull();
  });

  it('rebuilds spoken part numbers', () => {
    expect(parseVoiceQuery('JCB part number 320 slash 04133').query).toBe('jcb 320/04133');
    expect(parseVoiceQuery('Part number 320-04133').query).toBe('320-04133');
    expect(parseVoiceQuery('Show 32004133').query).toBe('32004133');
    expect(parseVoiceQuery('Part number 3 2 0 0 4 1 3 3').query).toBe('32004133');
    expect(parseVoiceQuery('३२० स्लैश ०४१३३').query).toBe('320/04133');
  });

  it('joins machine models said in two parts', () => {
    expect(parseVoiceQuery('3 dx hydraulic filter').query).toBe('3dx hydraulic filter');
    expect(parseVoiceQuery('komatsu pc 200 track roller').query).toBe('komatsu pc200 track roller');
  });

  it('returns an empty query for pure filler', () => {
    expect(parseVoiceQuery('kya hai bhai')).toEqual({ query: '', quantity: null });
    expect(parseVoiceQuery('')).toEqual({ query: '', quantity: null });
  });
});
