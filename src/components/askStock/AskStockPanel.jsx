import {
  AudioLines,
  Check,
  Maximize2,
  Mic,
  Minimize2,
  MoreHorizontal,
  SendHorizontal,
  Sparkles,
  SquarePen,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PERMISSIONS as P } from '../../constants/permissions';
import { useAskStock } from '../../hooks/useAskStock';
import { useAuth } from '../../hooks/useAuth';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { cn } from '../../utils/cn';
import { AskStockCards } from './AskStockCards';

// Shared with voice search on the stock screens.
const LANGUAGE_KEY = 'jcb-inventory:voice-language';
const LANGUAGES = [
  { code: 'en-IN', label: 'English / Hinglish' },
  { code: 'hi-IN', label: 'हिन्दी' },
];
const MIC_BLOCKED = ['not-allowed', 'service-not-allowed'];

function readLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return LANGUAGES.some((l) => l.code === stored) ? stored : 'en-IN';
  } catch {
    return 'en-IN';
  }
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function suggestedQuestions(can, canAny) {
  const questions = [];
  if (canAny(P.PRODUCTS_VIEW, P.INVENTORY_VIEW)) {
    questions.push('PC200 track roller, how many in stock?');
  }
  if (can(P.INVENTORY_VIEW)) {
    questions.push('What should I reorder this week?', 'Which parts have not moved in two months?');
  }
  if (can(P.DASHBOARD_VIEW)) questions.push('Today’s sales and stock out?');
  return questions.slice(0, 4);
}

const speechSynthesisAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Reads an answer aloud; `onEnd` runs when done (or straight away if speech is unavailable). */
function speak(text, lang, onEnd) {
  if (!speechSynthesisAvailable) {
    onEnd();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/₹/g, 'rupees '));
  utterance.lang = lang;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang === lang);
  if (voice) utterance.voice = voice;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
}

function MoreMenu({ language, onLanguage, onNewChat, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} aria-hidden />
      <div
        role="menu"
        className="absolute bottom-full left-0 z-20 mb-2 w-56 rounded-xl bg-white p-1 shadow-lg ring-1 ring-slate-200"
      >
        <p className="px-3 pt-2 pb-1 text-xs font-semibold text-slate-500">Voice language</p>
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            role="menuitemradio"
            aria-checked={language === l.code}
            onClick={() => onLanguage(l.code)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-slate-100"
          >
            {l.label}
            {language === l.code && <Check className="size-4 text-slate-700" aria-hidden />}
          </button>
        ))}
        <div className="my-1 border-t border-slate-100" />
        <button
          type="button"
          role="menuitem"
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100"
        >
          <SquarePen className="size-4" aria-hidden /> New chat
        </button>
      </div>
    </>
  );
}

function IconButton({ label, onClick, active, className, children, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'flex size-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100',
        active && 'bg-red-50 text-red-600 hover:bg-red-100',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * "Ask Stock" assistant: a side panel (full screen on phones) for questions about stock,
 * prices, reorders, slow-moving parts, customers and today's figures. Read-only — answers
 * come from the server's built-in question rules; nothing is changed from here.
 */
export function AskStockPanel({ onClose }) {
  const { user, branch, can, canAny } = useAuth();
  const { messages, pending, ask, reset } = useAskStock(user.id);
  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState(readLanguage);
  const [voiceMode, setVoiceMode] = useState(false);
  const inputRef = useRef(null);
  const endRef = useRef(null);
  const voiceModeRef = useRef(false);
  const speechRef = useRef(null);

  const send = useCallback(
    async (message, options) => {
      const reply = await ask(message, options);
      if (reply && voiceModeRef.current) {
        // Voice mode: read the answer, then listen for the next question.
        speak(reply.text, language, () => voiceModeRef.current && speechRef.current.start());
      }
    },
    [ask, language],
  );

  const speech = useSpeechRecognition({
    lang: language,
    // A speech error (blocked mic, silence) ends voice mode.
    onError: () => voiceModeRef.current && setVoice(false),
    onResult: (text) => {
      if (voiceModeRef.current) {
        send(text);
      } else {
        setInput((current) => (current ? `${current} ${text}` : text));
        inputRef.current?.focus();
      }
    },
  });
  useEffect(() => {
    speechRef.current = speech;
  });

  const setVoice = useCallback((on) => {
    voiceModeRef.current = on;
    setVoiceMode(on);
    if (on) {
      speechRef.current.start();
    } else {
      speechRef.current.stop();
      if (speechSynthesisAvailable) window.speechSynthesis.cancel();
    }
  }, []);

  // Closing the panel stops reading answers aloud (the recogniser stops by itself).
  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      voiceModeRef.current = false;
      if (speechSynthesisAvailable) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, pending]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (menuOpen) setMenuOpen(false);
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen, onClose]);

  const submit = () => {
    if (!input.trim() || pending) return;
    send(input);
    setInput('');
  };

  const newChat = () => {
    setVoice(false);
    reset();
    setInput('');
    setMenuOpen(false);
    inputRef.current?.focus();
  };

  const changeLanguage = (code) => {
    setLanguage(code);
    setMenuOpen(false);
    try {
      localStorage.setItem(LANGUAGE_KEY, code);
    } catch {
      // The choice then lasts for this visit only.
    }
  };

  const toggleMic = () => {
    if (speech.listening) speech.stop();
    else speech.start();
  };

  const suggestions = suggestedQuestions(can, canAny);
  const lastMessage = messages[messages.length - 1];
  const followUps = !pending && lastMessage?.role === 'assistant' ? lastMessage.suggestions : null;
  const micBlocked = MIC_BLOCKED.includes(speech.errorCode);
  const firstName = user.name.split(/\s+/)[0];
  const closeOnPhone = () => {
    if (!window.matchMedia('(min-width: 640px)').matches) onClose();
  };

  return createPortal(
    <section
      role="dialog"
      aria-label="Ask Stock"
      className={cn(
        'pt-safe pb-safe fixed inset-0 z-50 flex flex-col bg-white',
        'sm:left-auto sm:w-[420px] sm:border-l sm:border-slate-200 sm:shadow-2xl',
        expanded && 'sm:w-[min(820px,100vw)]',
      )}
    >
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-100 px-3">
        <span className="bg-brand-100 text-brand-700 flex size-8 items-center justify-center rounded-lg">
          <Sparkles className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm leading-tight font-semibold text-slate-900">Ask Stock</h2>
          <p className="truncate text-xs text-slate-500">
            {messages.length ? branch?.name : 'New chat'}
          </p>
        </div>
        <IconButton label="New chat" onClick={newChat}>
          <SquarePen className="size-[18px]" />
        </IconButton>
        <IconButton
          label={expanded ? 'Narrow panel' : 'Expand panel'}
          onClick={() => setExpanded((v) => !v)}
          className="hidden sm:flex"
        >
          {expanded ? <Minimize2 className="size-[18px]" /> : <Maximize2 className="size-[18px]" />}
        </IconButton>
        <IconButton label="Close" onClick={onClose}>
          <X className="size-5" />
        </IconButton>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4" aria-live="polite">
        <div className={cn('mx-auto', expanded && 'max-w-3xl')}>
          {messages.length === 0 ? (
            <div className="pt-6">
              <p className="text-2xl font-semibold text-slate-900">
                {greeting()}, {firstName}
              </p>
              <p className="mt-1 text-slate-500">Ask about stock, reorders or customers.</p>
              <div className="mt-6 space-y-2">
                {suggestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ol className="space-y-4">
              {messages.map((m) =>
                m.role === 'user' ? (
                  <li key={m.id} className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-slate-900 px-3.5 py-2 text-sm whitespace-pre-wrap text-white">
                      {m.text}
                    </p>
                  </li>
                ) : (
                  <li key={m.id}>
                    <p
                      className={cn(
                        'text-sm whitespace-pre-wrap',
                        m.error ? 'text-red-600' : 'text-slate-800',
                      )}
                    >
                      {m.text}
                    </p>
                    <AskStockCards
                      cards={m.cards}
                      onAsk={send}
                      canOpenProducts={can(P.PRODUCTS_VIEW)}
                      onNavigate={closeOnPhone}
                    />
                  </li>
                ),
              )}
              {pending && (
                <li className="flex gap-1 py-2" aria-label="Answering">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="size-2 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </li>
              )}
            </ol>
          )}
          {followUps?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {followUps.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className={cn('shrink-0 px-3 pb-3', expanded && 'sm:mx-auto sm:w-full sm:max-w-3xl')}>
        {speech.error && (
          <p role="alert" className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {micBlocked
              ? 'The microphone is blocked. Allow it in the browser’s site settings, or type below.'
              : speech.error}
          </p>
        )}
        <div className="rounded-2xl border border-slate-300 bg-white focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200">
          <textarea
            ref={inputRef}
            rows={1}
            value={speech.listening && !voiceMode && speech.interim ? speech.interim : input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={
              voiceMode ? (speech.listening ? 'Listening…' : 'Voice mode on') : 'Ask about stock…'
            }
            maxLength={300}
            aria-label="Ask about stock"
            className="block field-sizing-content max-h-32 min-h-11 w-full resize-none bg-transparent px-4 pt-3 text-base outline-none placeholder:text-slate-400 sm:text-sm"
          />
          <div className="relative flex items-center gap-1 px-2 pb-2">
            <IconButton
              label="More options"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
            >
              <MoreHorizontal className="size-5" />
            </IconButton>
            {menuOpen && (
              <MoreMenu
                language={language}
                onLanguage={changeLanguage}
                onNewChat={newChat}
                onClose={() => setMenuOpen(false)}
              />
            )}
            <span className="flex-1" />
            {speech.supported && (
              <>
                <IconButton
                  label={speech.listening && !voiceMode ? 'Stop dictation' : 'Dictate'}
                  onClick={toggleMic}
                  active={speech.listening && !voiceMode}
                  disabled={voiceMode}
                  className="disabled:opacity-40"
                >
                  <Mic
                    className={cn('size-5', speech.listening && !voiceMode && 'animate-pulse')}
                  />
                </IconButton>
                <IconButton
                  label={voiceMode ? 'Turn voice mode off' : 'Voice mode: speak and hear answers'}
                  onClick={() => setVoice(!voiceMode)}
                  active={voiceMode}
                  aria-pressed={voiceMode}
                >
                  <AudioLines
                    className={cn('size-5', voiceMode && speech.listening && 'animate-pulse')}
                  />
                </IconButton>
              </>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={!input.trim() || pending}
              aria-label="Send"
              className="flex size-10 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400"
            >
              <SendHorizontal className="size-[18px]" />
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-center text-[11px] text-slate-400">
          Answers come from live stock data. Ask Stock never changes stock.
        </p>
      </div>
    </section>,
    document.body,
  );
}
