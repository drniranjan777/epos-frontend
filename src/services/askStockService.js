import { api, request } from './apiClient';

export const askStockService = {
  /**
   * Sends a question. `context` names the part discussed last (for follow-up questions);
   * `language` ('en' | 'hi' | 'te') is the language of the answer.
   */
  ask: (message, context, language) =>
    request(api.post('/ask-stock', { message, context, language })),
  suggestions: (language) => request(api.get('/ask-stock/suggestions', { params: { language } })),
  preferences: () => request(api.get('/ask-stock/preferences')),
  savePreferences: (preferences) => request(api.put('/ask-stock/preferences', preferences)),
};
