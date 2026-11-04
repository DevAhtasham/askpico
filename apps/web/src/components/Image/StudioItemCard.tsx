import React from 'react';
import { StudioItemInterface } from '@store/image-slice';
import { isStudioItemGenerating, runStudioGeneration } from '@utils/studioGeneration';
import ImageGenerateCard, { ImageCardState } from './ImageGenerateCard';

const StudioItemCard = ({ item }: { item: StudioItemInterface }) => {
  let state: ImageCardState;
  let errorMessage = item.error;
  if (item.status === 'done') {
    state = 'success';
  } else if (item.status === 'error') {
    state = 'error';
  } else if (isStudioItemGenerating(item.id)) {
    state = 'loading';
  } else {
    state = 'error';
    errorMessage = 'Generation was interrupted. Please try again.';
  }

  const handleGenerate = () => {
    void runStudioGeneration(item.id, {
      provider: item.provider,
      prompt: item.prompt,
      aspectRatio: item.aspectRatio,
    });
  };

  return (
    <ImageGenerateCard
      prompt={item.prompt}
      provider={item.provider}
      aspectRatio={item.aspectRatio}
      state={state}
      imageId={item.imageId}
      mimeType={item.mimeType}
      errorMessage={errorMessage}
      onGenerate={handleGenerate}
    />
  );
};

export default StudioItemCard;
