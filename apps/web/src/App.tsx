import React, { useEffect } from 'react';
import useStore from '@store/store';
import i18n from './i18n';

import Chat from '@components/Chat';
import Menu from '@components/Menu';
import ErrorBoundary from '@components/ErrorBoundary';

import { prefetchEsbuildWasm } from '@utils/esbuildPrefetch';
import { pruneArtifactState } from '@utils/artifactState';
import { logger } from '@utils/logger';
import { chatIdFromSearch, chatSearchFor } from '@utils/chatRoute';
import { ChatInterface } from '@type/chat';
import { Theme } from '@type/theme';
import { defaultModel, modelOptions } from '@constants/chat';
import Toast from '@components/Toast';

function App() {
  const setChats = useStore((state) => state.setChats);
  const setTheme = useStore((state) => state.setTheme);
  const setApiKey = useStore((state) => state.setApiKey);
  const setCurrentChatIndex = useStore((state) => state.setCurrentChatIndex);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    i18n.on('languageChanged', (lng) => {
      document.documentElement.lang = lng;
    });
  }, []);

  useEffect(() => prefetchEsbuildWasm(), []);

  useEffect(() => pruneArtifactState(), []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === 'free-chat-gpt' &&
        event.newValue !== null &&
        !useStore.getState().generating
      ) {
        useStore.persist.rehydrate();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    // legacy local storage
    const oldChats = localStorage.getItem('chats');
    const apiKey = localStorage.getItem('apiKey');
    const theme = localStorage.getItem('theme');

    if (apiKey) {
      // legacy local storage
      setApiKey(apiKey);
      localStorage.removeItem('apiKey');
    }

    if (theme) {
      // legacy local storage
      setTheme(theme as Theme);
      localStorage.removeItem('theme');
    }

    if (oldChats) {
      // legacy local storage
      try {
        const chats: ChatInterface[] = JSON.parse(oldChats);
        if (chats.length > 0) {
          setChats(chats);
          setCurrentChatIndex(0);
        }
      } catch (e: unknown) {
        logger.warn('legacy chat migration failed:', e);
      }
      localStorage.removeItem('chats');
    } else {
      // existing local storage
      const chats = useStore.getState().chats;
      const defaultChatConfig = useStore.getState().defaultChatConfig;
      if (!modelOptions.includes(defaultChatConfig.model)) {
        useStore.getState().setDefaultChatConfig({
          ...defaultChatConfig,
          model: defaultModel,
        });
      }
      const list = chats ?? [];
      setChats(
        list.map((chat) =>
          modelOptions.includes(chat.config.model)
            ? chat
            : { ...chat, config: { ...chat.config, model: defaultModel } }
        )
      );
    }
  }, []);

  useEffect(() => {
    const indexForSearch = (search: string) => {
      const routedId = chatIdFromSearch(search);
      const chats = useStore.getState().chats ?? [];
      return routedId ? chats.findIndex((chat) => chat.id === routedId) : -1;
    };

    const routedId = chatIdFromSearch(window.location.search);
    const index = indexForSearch(window.location.search);
    setCurrentChatIndex(index);
    if (routedId && index === -1) window.history.replaceState(null, '', '/');

    const onPopState = () => setCurrentChatIndex(indexForSearch(window.location.search));
    window.addEventListener('popstate', onPopState);

    const unsubscribe = useStore.subscribe((state, prev) => {
      if (state.currentChatIndex === prev.currentChatIndex) return;
      const chat = state.chats?.[state.currentChatIndex];
      const search = state.currentChatIndex >= 0 && chat ? chatSearchFor(chat.id) : '';
      if (window.location.search !== search) window.history.pushState(null, '', `/${search}`);
    });

    return () => {
      window.removeEventListener('popstate', onPopState);
      unsubscribe();
    };
  }, []);

  return (
    <div className='overflow-hidden w-full h-full relative'>
      <Menu />
      <ErrorBoundary>
        <Chat />
      </ErrorBoundary>
      <Toast />
    </div>
  );
}

export default App;
