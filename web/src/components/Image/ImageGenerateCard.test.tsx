// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';

const getImageMock = vi.fn();
vi.mock('@utils/imageStore', () => ({
  getImage: (...args: unknown[]) => getImageMock(...args),
}));

import ImageGenerateCard from './ImageGenerateCard';

const baseProps = {
  prompt: 'a futuristic robot',
  provider: 'gemini',
  aspectRatio: '1:1' as const,
  onGenerate: vi.fn(),
};

beforeEach(() => {
  getImageMock.mockReset();
  baseProps.onGenerate.mockReset();
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
});

describe('ImageGenerateCard', () => {
  it('shows the loading skeleton while generating', () => {
    render(<ImageGenerateCard {...baseProps} state='loading' />);
    expect(screen.getByText('Generating image...')).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('renders the image with Download and Regenerate on success', async () => {
    getImageMock.mockResolvedValue(new Blob(['x'], { type: 'image/png' }));
    render(
      <ImageGenerateCard
        {...baseProps}
        state='success'
        imageId='img-1'
        mimeType='image/png'
        onGenerate={baseProps.onGenerate}
      />
    );

    const img = await screen.findByRole('img');
    expect(img.getAttribute('src')).toBe('blob:mock-url');
    expect(img.getAttribute('alt')).toBe('a futuristic robot');
    expect(getImageMock).toHaveBeenCalledWith('img-1');
    const download = screen.getByRole('link', { name: 'Download image' });
    expect(download.getAttribute('download')).toBe('fahmchat-image.png');
    expect(screen.queryByText('Regenerate')).toBeNull();
  });

  it('shows the missing-image message when IndexedDB has no blob', async () => {
    getImageMock.mockResolvedValue(undefined);
    render(<ImageGenerateCard {...baseProps} state='success' imageId='gone' />);

    await waitFor(() =>
      expect(screen.getByText('This image is no longer stored on this device.')).toBeTruthy()
    );
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('shows the server error message and retries on error', () => {
    render(
      <ImageGenerateCard
        {...baseProps}
        state='error'
        errorMessage='Image generation failed. Please try again.'
      />
    );
    expect(screen.getByText('Image generation failed. Please try again.')).toBeTruthy();

    fireEvent.click(screen.getByText('Try again'));
    expect(baseProps.onGenerate).toHaveBeenCalledTimes(1);
  });

  it('never renders the prompt as HTML', () => {
    const { container } = render(
      <ImageGenerateCard {...baseProps} prompt='<img src=x onerror=alert(1)>' state='idle' />
    );
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeTruthy();
  });
});
