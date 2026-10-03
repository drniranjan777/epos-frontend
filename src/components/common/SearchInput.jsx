import { Mic, Search, X } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { cn } from '../../utils/cn';

/**
 * Search box with a clear button and, with `voice`, a microphone button that fills the
 * box from speech. The mic only appears where the browser supports speech recognition.
 * Pass `speech` (from useSpeechRecognition) to handle the recognised text yourself.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  autoFocus,
  className,
  voice = false,
  speech: externalSpeech,
  ...props
}) {
  const ownSpeech = useSpeechRecognition({ onResult: onChange });
  const speech = externalSpeech ?? ownSpeech;
  const showMic = voice && speech.supported;

  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <input
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={speech.listening ? 'Listening…' : placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'focus:ring-brand-500 block h-12 w-full rounded-xl border-0 bg-white pl-10 text-slate-900 shadow-sm ring-1 ring-slate-300 ring-inset placeholder:text-slate-400 focus:ring-2 focus:outline-none [&::-webkit-search-cancel-button]:hidden',
          showMic ? 'pr-20' : 'pr-11',
        )}
        {...props}
      />
      <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center">
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="rounded-lg p-2.5 text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X className="size-5" />
          </button>
        )}
        {showMic && (
          <button
            type="button"
            onClick={speech.listening ? speech.stop : speech.start}
            className={cn(
              'rounded-lg p-2.5 transition',
              speech.listening
                ? 'animate-pulse bg-red-50 text-red-600'
                : 'text-slate-500 hover:text-slate-700',
            )}
            aria-label={speech.listening ? 'Stop voice search' : 'Search by voice'}
            aria-pressed={speech.listening}
          >
            <Mic className="size-5" />
          </button>
        )}
      </div>
      {speech.error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {speech.error}
        </p>
      )}
    </div>
  );
}
