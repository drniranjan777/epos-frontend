import { useCallback, useEffect, useRef, useState } from 'react';
import { askStockService } from '../services/askStockService';
import { getErrorMessage } from '../utils/apiError';

const STORAGE_PREFIX = 'jcb-inventory:ask-stock:';
const MAX_MESSAGES = 60;

function readChat(key) {
  try {
    const stored = JSON.parse(sessionStorage.getItem(key));
    if (Array.isArray(stored?.messages)) return stored;
  } catch {
    // Unreadable or blocked storage: start a new chat.
  }
  return { messages: [], context: null };
}

let nextId = Date.now();
const newId = () => (nextId += 1);

/**
 * Ask Stock conversation. Kept for this browser session only (sessionStorage), per user;
 * `context` is the part discussed last so "and its price?" works.
 *
 * Messages: { id, role: 'user'|'assistant', text, cards?, suggestions?, language?, error? }
 */
export function useAskStock(userId) {
  const key = `${STORAGE_PREFIX}${userId}`;
  const [chat, setChat] = useState(() => readChat(key));
  const [pending, setPending] = useState(false);
  const chatRef = useRef(chat);
  // Bumped by "New chat" so an answer still on its way is not added to the new chat.
  const chatNumber = useRef(0);

  useEffect(() => {
    chatRef.current = chat;
    try {
      sessionStorage.setItem(key, JSON.stringify(chat));
    } catch {
      // Storage full or blocked: the chat still works for this page view.
    }
  }, [key, chat]);

  /**
   * @param {string} message   question sent to the server
   * @param {{ display?: string, context?: object, language?: string }} [options]
   *   display: what the chat shows instead of `message`; context: overrides the last part;
   *   language: language of the answer ('en' | 'hi' | 'te').
   * @returns {Promise<object|null>} the assistant message, or null if nothing was added
   */
  const ask = useCallback(
    async (message, { display, context, language } = {}) => {
      const text = message.trim();
      if (!text || pending) return null;
      const asked = chatNumber.current;
      const userMessage = { id: newId(), role: 'user', text: display ?? text };
      setChat((c) => ({ ...c, messages: [...c.messages, userMessage].slice(-MAX_MESSAGES) }));
      setPending(true);

      let reply;
      let nextContext = context ?? chatRef.current.context;
      try {
        const data = await askStockService.ask(text, nextContext, language);
        reply = {
          id: newId(),
          role: 'assistant',
          text: data.reply,
          cards: data.cards,
          suggestions: data.suggestions,
          language: data.language,
        };
        if (data.context) nextContext = data.context;
      } catch (error) {
        reply = { id: newId(), role: 'assistant', text: getErrorMessage(error), error: true };
      } finally {
        setPending(false);
      }
      if (asked !== chatNumber.current) return null;
      setChat((c) => ({
        messages: [...c.messages, reply].slice(-MAX_MESSAGES),
        context: nextContext,
      }));
      return reply;
    },
    [pending],
  );

  const reset = useCallback(() => {
    chatNumber.current += 1;
    setPending(false);
    setChat({ messages: [], context: null });
  }, []);

  return { messages: chat.messages, pending, ask, reset };
}
