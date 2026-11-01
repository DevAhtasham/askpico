import React from 'react';
import useStore from '@store/store';

import Avatar from './Avatar';
import MessageContent from './MessageContent';

import { Role } from '@type/chat';

const Message = React.memo(
  ({
    role,
    content,
    messageIndex,
    sticky = false,
  }: {
    role: Role;
    content: string;
    messageIndex: number;
    sticky?: boolean;
  }) => {
    const hideSideMenu = useStore((state) => state.hideSideMenu);

    if (sticky) {
      return (
        <div className='w-full'>
          <MessageContent
            role={role}
            content={content}
            messageIndex={messageIndex}
            sticky
          />
        </div>
      );
    }

    return (
      <div className='group w-full text-ink transition-colors'>
        <div
          className={`mx-auto flex w-full max-w-3xl gap-3 px-2 py-3 text-base ${
            role === 'user' ? 'flex-row-reverse' : ''
          }`}
        >
          <Avatar role={role} />
          <div
            className={`flex w-[calc(100%-50px)] flex-col gap-1 md:w-[calc(100%-80px)] ${
              role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <MessageContent
              role={role}
              content={content}
              messageIndex={messageIndex}
            />
          </div>
        </div>
      </div>
    );
  }
);

export default Message;
