import { v4 as uuidv4 } from 'uuid';
import useStore from '@store/store';
import { generateImage } from '@api/api';
import { ImageAspectRatio } from '@type/chat';
import { saveImage } from './imageStore';
import { base64ToBlob } from './imageGeneration';

const inFlight = new Set<string>();

export const isStudioItemGenerating = (id: string) => inFlight.has(id);

export const runStudioGeneration = async (
  id: string,
  input: {
    provider: string;
    prompt: string;
    aspectRatio: ImageAspectRatio;
  }
) => {
  if (inFlight.has(id)) return;
  inFlight.add(id);

  useStore.getState().updateStudioItem(id, { status: 'loading', error: undefined });
  try {
    const result = await generateImage({
      provider: input.provider,
      prompt: input.prompt,
      aspectRatio: input.aspectRatio,
    });
    const imageId = uuidv4();
    await saveImage(imageId, base64ToBlob(result.dataBase64, result.mimeType));
    useStore.getState().updateStudioItem(id, {
      status: 'done',
      imageId,
      mimeType: result.mimeType,
      error: undefined,
    });
  } catch (err) {
    useStore.getState().updateStudioItem(id, {
      status: 'error',
      error: err instanceof Error ? err.message : 'Image generation failed. Please try again.',
    });
  } finally {
    inFlight.delete(id);
  }
};
