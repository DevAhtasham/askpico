const CHAT_PARAM = 'chat';

export const chatSearchFor = (chatId: string): string => `?${CHAT_PARAM}=${encodeURIComponent(chatId)}`;

export const chatIdFromSearch = (search: string): string | null =>
  new URLSearchParams(search).get(CHAT_PARAM) || null;
