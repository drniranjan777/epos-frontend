import { Check, Mic, PackageSearch, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useProductSearch } from '../../hooks/useInventory';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/format';
import { stockStatus } from '../../utils/stock';
import { parseVoiceQuery } from '../../utils/voiceQuery';
import { SearchInput } from '../common/SearchInput';
import { Spinner } from '../common/Spinner';

const PILL_TONES = {
  ok: 'bg-emerald-50 text-emerald-700',
  low: 'bg-amber-50 text-amber-700',
  out: 'bg-red-50 text-red-700',
};

const LANGUAGES = [
  { code: 'en-IN', label: 'English / Hinglish' },
  { code: 'hi-IN', label: 'हिन्दी' },
];
const LANGUAGE_KEY = 'jcb-inventory:voice-language';

const EXAMPLES = {
  'en-IN': [
    'JCB 3DX hydraulic filter',
    '3DX ka fuel filter 10 piece',
    'Part number 320 slash 04133',
  ],
  'hi-IN': ['जेसीबी का हाइड्रोलिक फ़िल्टर', 'बकेट पिन दस पीस'],
};

function readLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return LANGUAGES.some((l) => l.code === stored) ? stored : 'en-IN';
  } catch {
    return 'en-IN';
  }
}

function LanguageToggle({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Voice language" className="flex gap-1.5">
      {LANGUAGES.map((language) => (
        <button
          key={language.code}
          type="button"
          role="radio"
          aria-checked={value === language.code}
          onClick={() => onChange(language.code)}
          className={cn(
            'h-8 rounded-full px-3 text-xs font-semibold ring-1',
            value === language.code
              ? 'bg-slate-900 text-white ring-slate-900'
              : 'bg-white text-slate-600 ring-slate-300',
          )}
        >
          {language.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Search box (typed or spoken) and a scrollable result list. Tapping a result adds it to
 * the cart; a quantity said aloud ("10 piece") is used for the next part tapped. With
 * `capped`, parts with no stock in the branch cannot be added.
 */
export function ProductResults({ branchName, capped, onAdd, cartQuantities }) {
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState(readLanguage);
  // What was heard and understood from the last voice search; cleared when typing.
  const [voice, setVoice] = useState(null);
  const term = useDebounce(search.trim(), 250);
  const results = useProductSearch(term);
  const products = term ? (results.data ?? []) : [];
  const onlySimilar = products.length > 0 && products.every((p) => p.matchType === 'similar');

  const speech = useSpeechRecognition({
    lang: language,
    onResult: (heard) => {
      const { query, quantity } = parseVoiceQuery(heard);
      setVoice({ heard, query, quantity });
      if (query) setSearch(query);
    },
  });

  function changeLanguage(code) {
    setLanguage(code);
    try {
      localStorage.setItem(LANGUAGE_KEY, code);
    } catch {
      // Remembering the language is a convenience only.
    }
  }

  function add(product) {
    onAdd(product, voice?.quantity ?? 1);
    // A spoken quantity applies to one part; later taps add 1 as usual.
    if (voice?.quantity) setVoice((v) => ({ ...v, quantity: null }));
  }

  return (
    <div>
      <SearchInput
        value={search}
        onChange={(value) => {
          setSearch(value);
          setVoice(null);
        }}
        placeholder="Search Product, Model, Parts"
        voice
        speech={speech}
        autoFocus
      />

      {speech.listening && (
        <div
          role="status"
          className="mt-2 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-200"
        >
          <span className="flex size-10 shrink-0 animate-pulse items-center justify-center rounded-full bg-red-600 text-white">
            <Mic className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-red-800">Listening… speak the part name</p>
            <p className="truncate text-sm text-red-700">
              {speech.interim || 'e.g. “JCB 3DX hydraulic filter 10 piece”'}
            </p>
          </div>
        </div>
      )}

      {voice && !speech.listening && (
        <div className="mt-2 rounded-xl bg-sky-50 px-4 py-3 text-sm ring-1 ring-sky-200">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sky-900">
                <span className="font-semibold">You said:</span> “{voice.heard}”
              </p>
              {voice.query ? (
                <p className="mt-0.5 text-sky-800">
                  Searching: <span className="font-semibold">{voice.query}</span>
                  {voice.quantity && (
                    <>
                      {' '}
                      · Quantity:{' '}
                      <span className="font-semibold">{formatNumber(voice.quantity)}</span>
                    </>
                  )}
                </p>
              ) : (
                <p className="mt-0.5 text-sky-800">
                  No part name heard. Tap the mic and say the part, e.g. “hydraulic filter”.
                </p>
              )}
              {voice.query && (
                <p className="mt-1 text-xs text-sky-700">Tap the right part below to add it.</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setVoice(null)}
              className="-mt-1 -mr-2 rounded-lg p-2 text-sky-700 hover:bg-sky-100"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div className="mt-2 max-h-72 overflow-y-auto rounded-xl bg-white ring-1 ring-slate-200">
        {!term && !speech.listening && (
          <div className="px-4 py-5">
            {speech.supported ? (
              <div className="flex flex-col items-center text-center">
                <button
                  type="button"
                  onClick={speech.start}
                  className="flex size-16 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg active:scale-95"
                  aria-label="Tap and speak the part name"
                >
                  <Mic className="size-7" aria-hidden />
                </button>
                <p className="mt-2 font-semibold text-slate-800">Tap and speak the part name</p>
                <p className="mt-1 text-sm text-slate-500">
                  Try: {EXAMPLES[language].map((e) => `“${e}”`).join(', ')}
                </p>
                <div className="mt-3">
                  <LanguageToggle value={language} onChange={changeLanguage} />
                </div>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <PackageSearch className="size-5 shrink-0 text-slate-400" aria-hidden />
                Search by part name, SKU, part number, brand, model or HSN.
              </p>
            )}
          </div>
        )}
        {term && results.isPending && (
          <div className="flex justify-center py-6 text-slate-400">
            <Spinner />
          </div>
        )}
        {term && results.isError && (
          <p className="px-4 py-6 text-sm text-red-600">Search failed. Check your connection.</p>
        )}
        {term && results.isSuccess && products.length === 0 && (
          <p className="px-4 py-6 text-sm text-slate-500">
            No parts match “{term}”. Try saying just the part name, e.g. “fuel filter”.
          </p>
        )}
        {onlySimilar && (
          <p className="border-b border-slate-100 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800">
            No exact match for “{term}”. Closest parts:
          </p>
        )}
        {products.length > 0 && (
          <ul className="divide-y divide-slate-100" aria-label="Search results">
            {products.map((product) => {
              const status = stockStatus(product);
              const disabled = capped && Number(product.stockQuantity) <= 0;
              const inCart = cartQuantities[product.id];
              return (
                <li key={product.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => add(product)}
                    aria-label={`${product.name}, ${product.sku}, ${formatNumber(product.stockQuantity)} in ${branchName}${inCart ? `, ${inCart} in entry` : ', add'}`}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{product.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {[product.sku, product.partNumber, product.machineModel]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap',
                        PILL_TONES[status],
                      )}
                    >
                      {formatNumber(product.stockQuantity)} in {branchName}
                    </span>
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full',
                        inCart ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600',
                      )}
                      aria-label={inCart ? `${inCart} in entry` : 'Add'}
                    >
                      {inCart ? <Check className="size-4" /> : <Plus className="size-4" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
