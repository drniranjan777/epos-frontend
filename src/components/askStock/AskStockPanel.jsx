import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  AudioLines,
  Maximize2,
  Mic,
  Minimize2,
  MoreHorizontal,
  SendHorizontal,
  Sparkles,
  SquarePen,
  VolumeX,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PERMISSIONS as P } from '../../constants/permissions';
import {
  VOICE_LANGUAGES,
  languageCode,
  readVoiceLanguage,
  saveVoiceLanguage,
  shortLanguage,
} from '../../constants/voice';
import { useAskStock } from '../../hooks/useAskStock';
import { useAuth } from '../../hooks/useAuth';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { askStockService } from '../../services/askStockService';
import { cn } from '../../utils/cn';
import { Select, Switch } from '../forms/Field';
import { AskStockCards } from './AskStockCards';
import { askStockStrings, speechErrorText } from './askStockStrings';

const READ_ALOUD_KEY = 'jcb-inventory:ask-stock-read-aloud';

function readReadAloud() {
  try {
    return localStorage.getItem(READ_ALOUD_KEY) === '1';
  } catch {
    return false;
  }
}

function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const speechSynthesisAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * Reads an answer aloud in the given speech locale ('hi-IN'…), using a voice of that
 * language when the device has one. `onEnd` runs when done, stopped or unavailable.
 */
function speak(text, locale, onEnd) {
  if (!speechSynthesisAvailable) {
    onEnd();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/₹/g, ' ₹ '));
  utterance.lang = locale;
  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find((v) => v.lang === locale) ??
    voices.find((v) => v.lang.startsWith(locale.slice(0, 2)));
  if (voice) utterance.voice = voice;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
}

function MoreMenu({ strings, language, onLanguage, readAloud, onReadAloud, onNewChat, onClose }) {
  const selectId = useId();
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} aria-hidden />
      <div className="absolute bottom-full left-0 z-20 mb-2 w-72 rounded-xl bg-white p-1 shadow-lg ring-1 ring-slate-200">
        <div className="px-3 pt-2 pb-3">
          <p className="text-sm font-semibold text-slate-900">{strings.voice}</p>
          <label htmlFor={selectId} className="mt-2 block text-sm text-slate-600">
            {strings.iSpeak}
          </label>
          <Select
            id={selectId}
            value={language}
            onChange={(e) => onLanguage(e.target.value)}
            className="mt-1.5 w-full"
          >
            {VOICE_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} lang={l.code}>
                {l.label}
              </option>
            ))}
          </Select>
          <p className="mt-1.5 text-xs text-slate-500">{strings.languageHint}</p>
          {speechSynthesisAvailable && (
            <div className="mt-3">
              <Switch label={strings.readAloud} checked={readAloud} onChange={onReadAloud} />
            </div>
          )}
        </div>
        <div className="my-1 border-t border-slate-100" />
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100"
        >
          <SquarePen className="size-4" aria-hidden /> {strings.newChat}
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
 * prices, reorders, sales, slow-moving parts, customers, branches and today's figures, typed
 * or spoken in English, Hindi or Telugu. Read-only — answers come from the server's built-in
 * question rules and fixed queries; nothing is changed from here.
 */
export function AskStockPanel({ onClose }) {
  const { user, branch, can } = useAuth();
  const { messages, pending, ask, reset } = useAskStock(user.id);
  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [readAloud, setReadAloud] = useState(readReadAloud);
  // Language picked in this panel; until then the one saved for the user (server), else
  // the one last used on this device.
  const [chosenLanguage, setChosenLanguage] = useState(null);
  const preferences = useQuery({
    queryKey: ['ask-stock', 'preferences'],
    queryFn: askStockService.preferences,
    staleTime: Infinity,
  });
  const language =
    chosenLanguage ?? languageCode(preferences.data?.language) ?? readVoiceLanguage();
  const lang = shortLanguage(language);
  const strings = askStockStrings(lang);

  const starters = useQuery({
    queryKey: ['ask-stock', 'suggestions', lang],
    queryFn: () => askStockService.suggestions(lang),
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });

  const inputRef = useRef(null);
  const endRef = useRef(null);
  const speechRef = useRef(null);
  // Latest values for callbacks that outlive a render (speech results, end of read-aloud).
  const live = useRef({ voiceMode: false, readAloud, language, lang });
  useEffect(() => {
    Object.assign(live.current, { readAloud, language, lang });
    // Voice search on the stock screens follows the same language.
    saveVoiceLanguage(language);
  }, [readAloud, language, lang]);

  const stopSpeaking = useCallback(() => {
    if (speechSynthesisAvailable) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const send = useCallback(
    async (message, options) => {
      stopSpeaking();
      const reply = await ask(message, { ...options, language: live.current.lang });
      if (!reply) return;
      const { voiceMode: handsFree, readAloud: aloud, language: locale } = live.current;
      const listenAgain = () => {
        setSpeaking(false);
        if (live.current.voiceMode) speechRef.current.start();
      };
      if ((handsFree || aloud) && !reply.error) {
        setSpeaking(true);
        speak(reply.text, locale, listenAgain);
      } else if (handsFree) {
        listenAgain();
      }
    },
    [ask, stopSpeaking],
  );

  const speech = useSpeechRecognition({
    lang: language,
    // A speech error (blocked mic, silence) ends voice mode.
    onError: () => live.current.voiceMode && setVoice(false),
    onResult: (text) => {
      if (live.current.voiceMode) {
        send(text);
      } else {
        // Dictation: the words go in the box so they can be corrected before sending.
        setInput((current) => (current ? `${current} ${text}` : text));
        inputRef.current?.focus();
      }
    },
  });
  useEffect(() => {
    speechRef.current = speech;
  });

  const setVoice = useCallback(
    (on) => {
      live.current.voiceMode = on;
      setVoiceMode(on);
      if (on) {
        speechRef.current.start();
      } else {
        speechRef.current.stop();
        stopSpeaking();
      }
    },
    [stopSpeaking],
  );

  // Closing the panel stops reading answers aloud (the recogniser stops by itself).
  useEffect(() => {
    inputRef.current?.focus();
    const state = live.current;
    return () => {
      state.voiceMode = false;
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
    setChosenLanguage(code);
    // Listening continues in the old language until restarted; stop to avoid confusion.
    if (speech.listening) speech.stop();
    // Saved for the user so it follows them to other devices; failing to save is harmless.
    askStockService.savePreferences({ language: shortLanguage(code) }).catch(() => {});
  };

  const changeReadAloud = (on) => {
    setReadAloud(on);
    if (!on) stopSpeaking();
    try {
      localStorage.setItem(READ_ALOUD_KEY, on ? '1' : '0');
    } catch {
      // The choice then lasts for this visit only.
    }
  };

  const toggleMic = () => {
    if (speech.listening) speech.stop();
    else speech.start();
  };

  const dictating = speech.listening && !voiceMode;
  const lastMessage = messages[messages.length - 1];
  const followUps = !pending && lastMessage?.role === 'assistant' ? lastMessage.suggestions : null;
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
            {messages.length ? branch?.name : strings.newChat}
          </p>
        </div>
        <IconButton label={strings.newChat} onClick={newChat}>
          <SquarePen className="size-[18px]" />
        </IconButton>
        <IconButton
          label={expanded ? strings.narrow : strings.expand}
          onClick={() => setExpanded((v) => !v)}
          className="hidden sm:flex"
        >
          {expanded ? <Minimize2 className="size-[18px]" /> : <Maximize2 className="size-[18px]" />}
        </IconButton>
        <IconButton label={strings.close} onClick={onClose}>
          <X className="size-5" />
        </IconButton>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4" aria-live="polite">
        <div className={cn('mx-auto', expanded && 'max-w-3xl')}>
          {messages.length === 0 ? (
            <div className="pt-6" lang={language}>
              <p className="text-2xl font-semibold text-slate-900">
                {strings[greetingKey()]}, {firstName}
              </p>
              <p className="mt-1 text-slate-500">{strings.subtitle}</p>
              <div className="mt-6 space-y-2">
                {(starters.data ?? []).map((q) => (
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
                  <li key={m.id} lang={m.language}>
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
                      strings={askStockStrings(m.language)}
                      onAsk={send}
                      canOpenProducts={can(P.PRODUCTS_VIEW)}
                      onNavigate={closeOnPhone}
                    />
                  </li>
                ),
              )}
              {pending && (
                <li className="flex items-center gap-2 py-2 text-xs text-slate-500">
                  <span className="flex gap-1" aria-hidden>
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="size-2 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </span>
                  {strings.answering}
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
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
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
            {speechErrorText(strings, speech.errorCode)}
          </p>
        )}
        {!speech.supported && (
          <p className="mb-2 px-1 text-xs text-slate-500">{strings.micUnsupported}</p>
        )}
        {speaking && (
          <button
            type="button"
            onClick={stopSpeaking}
            className="mb-2 flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            <VolumeX className="size-4" aria-hidden /> {strings.stopSpeaking}
          </button>
        )}
        <div className="rounded-2xl border border-slate-300 bg-white focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200">
          <textarea
            ref={inputRef}
            rows={1}
            value={dictating && speech.interim ? speech.interim : input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={
              speech.listening
                ? strings.listening
                : voiceMode
                  ? strings.voiceModeOn
                  : strings.placeholder
            }
            maxLength={300}
            lang={language}
            aria-label={strings.placeholder}
            className="block field-sizing-content max-h-32 min-h-11 w-full resize-none bg-transparent px-4 pt-3 text-base outline-none placeholder:text-slate-400 sm:text-sm"
          />
          <div className="relative flex items-center gap-1 px-2 pb-2">
            <IconButton
              label={strings.moreOptions}
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
            >
              <MoreHorizontal className="size-5" />
            </IconButton>
            {menuOpen && (
              <MoreMenu
                strings={strings}
                language={language}
                onLanguage={changeLanguage}
                readAloud={readAloud}
                onReadAloud={changeReadAloud}
                onNewChat={newChat}
                onClose={() => setMenuOpen(false)}
              />
            )}
            <span className="flex-1" />
            {speech.supported && (
              <>
                <IconButton
                  label={dictating ? strings.stopDictation : strings.dictate}
                  onClick={toggleMic}
                  active={dictating}
                  disabled={voiceMode}
                  className="disabled:opacity-40"
                >
                  <Mic className={cn('size-5', dictating && 'animate-pulse')} />
                </IconButton>
                <IconButton
                  label={voiceMode ? strings.voiceModeOff : strings.voiceMode}
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
              aria-label={strings.send}
              className="flex size-10 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400"
            >
              <SendHorizontal className="size-[18px]" />
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-center text-[11px] text-slate-500">{strings.footer}</p>
      </div>
    </section>,
    document.body,
  );
}
