import React from 'react';
import useStore from '@store/store';
import { ImageMessageInterface } from '@type/chat';
import { imageRequestKey, isImageGenerating, runImageGeneration } from '@utils/imageGeneration';
import ImageGenerateCard, { ImageCardState } from './ImageGenerateCard';

const ImageMessage = ({
  image,
  messageIndex,
}: {
  image: ImageMessageInterface;
  messageIndex: number;
}) => {
  const chatId = useStore((state) => state.chats?.[state.currentChatIndex]?.id);

  const inFlight = !!chatId && isImageGenerating(imageRequestKey(chatId, messageIndex));

  let state: ImageCardState;
  let errorMessage = image.error;
  if (image.status === 'done') {
    state = 'success';
  } else if (image.status === 'error') {
    state = 'error';
  } else if (inFlight) {
    state = 'loading';
  } else {
    state = 'error';
    errorMessage = 'Generation was interrupted. Please try again.';
  }

  const handleGenerate = () => {
    if (!chatId) return;
    runImageGeneration(chatId, messageIndex, {
      provider: image.provider,
      prompt: image.prompt,
      aspectRatio: image.aspectRatio,
      imageId: image.imageId,
    });
  };

  return (
    <ImageGenerateCard
      prompt={image.prompt}
      provider={image.provider}
      aspectRatio={image.aspectRatio}
      state={state}
      imageId={image.imageId}
      mimeType={image.mimeType}
      errorMessage={errorMessage}
      onGenerate={handleGenerate}
    />
  );
};

export default ImageMessage;
