import React, { useRef } from 'react';
import useStore from '@store/store';

import Avatar from './Avatar';
import MessageContent from './MessageContent';

import {
  ImageMessageInterface,
  MessageAttachmentInterface,
  MessageFileInterface,
  Role,
  StockPhoto,
  ToolJobInterface,
} from '@type/chat';
import ImageMessage from '@components/Image/ImageMessage';
import DownloadCard from './DownloadCard';
import FileChip from './FileChip';
import PdfPageSelector from './PdfPageSelector';
import PhotoGallery from './PhotoGallery';
import { useLineFollow } from './useLineFollow';

const Message = React.memo(
  ({
    role,
    content,
    messageIndex,
    sticky = false,
    image,
    images,
    attachments,
    toolJob,
    photos,
    replyFiles,
  }: {
    role: Role;
    content: string;
    messageIndex: number;
    sticky?: boolean;
    image?: ImageMessageInterface;
    images?: MessageFileInterface[];
    attachments?: MessageAttachmentInterface[];
    toolJob?: ToolJobInterface;
    photos?: StockPhoto[];
    replyFiles?: MessageFileInterface[];
  }) => {
    const hideSideMenu = useStore((state) => state.hideSideMenu);
    const contentRef = useRef<HTMLDivElement>(null);
    const avatarRef = useRef<HTMLDivElement>(null);
    const lineFollow = useLineFollow(contentRef, avatarRef);

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
          {role === 'assistant' ? (
            <div
              ref={avatarRef}
              className={`flex shrink-0 items-center transition-transform duration-150 ${
                replyFiles && replyFiles.length > 0 ? 'h-14' : 'h-6'
              }`}
            >
              <Avatar role={role} />
            </div>
          ) : (
            <Avatar role={role} />
          )}
          <div
            className={`flex w-[calc(100%-50px)] flex-col gap-1 md:w-[calc(100%-80px)] ${
              role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            {images && images.length > 0 && (
              <div className='flex flex-wrap justify-end gap-2'>
                {images.map((img) => (
                  <div
                    key={img.name}
                    className='overflow-hidden rounded-xl border border-surface-line bg-white p-1 shadow-soft'
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      className='h-24 w-24 rounded-lg object-cover'
                    />
                  </div>
                ))}
              </div>
            )}
            {attachments && attachments.length > 0 && (
              <div className='flex flex-wrap justify-end gap-2'>
                {attachments.map((file) => (
                  <FileChip key={file.id} name={file.name} ext={file.ext} />
                ))}
              </div>
            )}
            {image ? (
              <ImageMessage image={image} messageIndex={messageIndex} />
            ) : replyFiles && replyFiles.length > 0 ? (
              replyFiles.map((file, fileIndex) => (
                <DownloadCard key={file.name} file={file}>
                  {fileIndex === 0 ? content.split(/\s+/).slice(0, 8).join(' ') : null}
                </DownloadCard>
              ))
            ) : (
              <div ref={contentRef} className='w-full' onMouseMove={lineFollow.onMouseMove}>
                <MessageContent
                  role={role}
                  content={content}
                  messageIndex={messageIndex}
                />
              </div>
            )}
            {toolJob?.status === 'awaiting' && (
              <PdfPageSelector toolJob={toolJob} messageIndex={messageIndex} />
            )}
            {photos && photos.length > 0 && <PhotoGallery photos={photos} />}
          </div>
        </div>
      </div>
    );
  }
);

export default Message;
