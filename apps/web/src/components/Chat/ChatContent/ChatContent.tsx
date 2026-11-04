import React, { useEffect, useRef } from 'react';
import ScrollToBottom from 'react-scroll-to-bottom';
import useStore from '@store/store';

import ScrollToBottomButton from './ScrollToBottomButton';
import Message from './Message';
import EmptyState from './EmptyState';

import { shallow } from 'zustand/shallow';

const ChatContent = ({
  saveRef,
}: {
  saveRef: React.RefObject<HTMLDivElement>;
}) => {
  const error = useStore((state) => state.error);
  const currentChatIndex = useStore((state) => state.currentChatIndex);
  const advancedMode = useStore((state) => state.advancedMode);

  const chats = useStore(
    (state) =>
      state.chats &&
      state.chats.length > 0 &&
      state.currentChatIndex >= 0 &&
      state.currentChatIndex < state.chats.length
        ? state.chats
        : null,
    shallow
  );

  const messages =
    chats && currentChatIndex >= 0 && currentChatIndex < chats.length
      ? chats[currentChatIndex].messages
      : null;

  const hasMessages =
    messages?.some((message, index) => index !== 0 || message.role !== 'system') ??
    false;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (!hasMessages) {
    return (
      <div className='flex h-full min-h-0 flex-1 flex-col overflow-y-auto'>
        <div
          ref={saveRef}
          className='fade-in mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-2'
        >
          <EmptyState />
          <div className='mt-6 w-full max-w-2xl'>
            <Message
              role='user'
              content=''
              messageIndex={messages ? messages.length : 0}
              sticky
            />
          </div>
        </div>
        {error && (
          <div className='mx-auto mb-2 max-w-3xl rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600'>
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='flex h-full min-h-0 flex-1 flex-col'>
      <div className='relative flex-1 min-h-0 overflow-hidden'>
        <ScrollToBottom
          className='h-full w-full'
          followButtonClassName='hidden'
          initialScrollBehavior='auto'
        >
          <div ref={saveRef} className='flex min-h-full w-full flex-col'>
            <div className='fade-in mx-auto w-full max-w-3xl px-4 pt-4 pb-6'>
              {messages?.map((message, index) =>
                !message.image && (advancedMode || index !== 0 || message.role !== 'system') ? (
                  <Message
                    role={message.role}
                    content={message.content}
                    messageIndex={index}
                    image={message.image}
                    images={message.images}
                    attachments={message.attachments}
                    toolJob={message.toolJob}
                    photos={message.photos}
                    replyFiles={
                      message.role === 'assistant'
                        ? message.files ?? messages?.[index - 1]?.files
                        : undefined
                    }
                    key={index}
                  />
                ) : null
              )}
            </div>
          </div>
        </ScrollToBottom>
        <ScrollToBottomButton />
      </div>

      <div className='relative z-10 px-4 pb-2 pt-2'>
        <div className='mx-auto w-full max-w-3xl'>
          <Message
            role='user'
            content=''
            messageIndex={messages ? messages.length : 0}
            sticky
          />
        </div>
        {error && (
          <div className='mx-auto mt-2 max-w-3xl rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600'>
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatContent;
