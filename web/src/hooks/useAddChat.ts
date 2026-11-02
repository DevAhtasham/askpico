import React from 'react';
import useStore from '@store/store';
import { generateDefaultChat } from '@constants/chat';
import { ChatInterface } from '@type/chat';

export const isEmptyChat = (chat: ChatInterface) =>
  chat.messages.every((message) => message.role === 'system');

export const selectOrCreateChat = (folder?: string) => {
  const { chats, setChats, setCurrentChatIndex } = useStore.getState();
  const list = chats ?? [];

  if (!folder) {
    const emptyIndex = list.findIndex(isEmptyChat);
    if (emptyIndex !== -1) {
      setCurrentChatIndex(emptyIndex);
      return;
    }
  }

  const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(list));
  let titleIndex = 1;
  let title = `New Chat ${titleIndex}`;

  while (list.some((chat) => chat.title === title)) {
    titleIndex += 1;
    title = `New Chat ${titleIndex}`;
  }

  updatedChats.unshift(generateDefaultChat(title, folder));
  setChats(updatedChats);
  setCurrentChatIndex(0);
};

export const startNewChat = (folder?: string) => {
  if (folder) {
    selectOrCreateChat(folder);
    return;
  }
  useStore.getState().setCurrentChatIndex(-1);
};

const useAddChat = () => startNewChat;

export default useAddChat;
