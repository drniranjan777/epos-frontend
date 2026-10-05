import { api, request } from './apiClient';

export const askStockService = {
  /** Sends a question; `context` names the part discussed last, for follow-up questions. */
  ask: (message, context) => request(api.post('/ask-stock', { message, context })),
};
