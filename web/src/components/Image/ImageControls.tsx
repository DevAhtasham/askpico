import React, { useEffect, useState } from 'react';
import { fetchImageProviders, ImageProviderInterface } from '@api/api';
import { ImageAspectRatio } from '@type/chat';
import ImageDropdown from './ImageDropdown';

export const IMAGE_ASPECT_RATIOS: ImageAspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];

const ImageControls = ({
  provider,
  onProviderChange,
  aspectRatio,
  onAspectRatioChange,
}: {
  provider: string;
  onProviderChange: (provider: string) => void;
  aspectRatio: ImageAspectRatio;
  onAspectRatioChange: (aspectRatio: ImageAspectRatio) => void;
}) => {
  const [providers, setProviders] = useState<ImageProviderInterface[] | null>(null);
  const [loadFailed, setLoadFailed] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    fetchImageProviders()
      .then((list) => {
        if (cancelled) return;
        setProviders(list);
        if (!list.some((item) => item.id === provider) && list[0]) {
          onProviderChange(list[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadFailed) {
    return <span className='text-xs text-ink-muted'>No image provider configured</span>;
  }
  if (providers === null) {
    return <span className='text-xs text-ink-muted'>Loading providers...</span>;
  }
  if (providers.length === 0) {
    return <span className='text-xs text-ink-muted'>No image provider configured</span>;
  }

  return (
    <div className='flex items-center gap-1.5'>
      <ImageDropdown
        ariaLabel='image provider'
        value={provider}
        options={providers.map((item) => ({ value: item.id, label: item.label }))}
        onChange={onProviderChange}
      />
      <ImageDropdown<ImageAspectRatio>
        ariaLabel='aspect ratio'
        value={aspectRatio}
        options={IMAGE_ASPECT_RATIOS.map((ratio) => ({ value: ratio, label: ratio }))}
        onChange={onAspectRatioChange}
      />
    </div>
  );
};

export default ImageControls;
