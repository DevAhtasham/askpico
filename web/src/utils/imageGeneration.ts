import { v4 as uuidv4 } from 'uuid';
import useStore from '@store/store';
import { generateImage } from '@api/api';
import { ChatInterface, ImageAspectRatio, ImageMessageInterface } from '@type/chat';
import { saveImage } from './imageStore';

const inFlight = new Set<string>();

export const imageRequestKey = (chatId: string, messageIndex: number) =>
  `${chatId}:${messageIndex}`;

export const isImageGenerating = (key: string) => inFlight.has(key);

export const base64ToBlob = (dataBase64: string, mimeType: string) => {
  const binary = atob(dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
};

export const updateImageMessage = (
  chatId: string,
  messageIndex: number,
  patch: Partial<ImageMessageInterface>
) => {
  const chats = useStore.getState().chats;
  if (!chats) return;
  const chatIndex = chats.findIndex((chat) => chat.id === chatId);
  if (chatIndex === -1) return;
  const current = chats[chatIndex].messages[messageIndex]?.image;
  if (!current) return;

  const updated: ChatInterface[] = JSON.parse(JSON.stringify(chats));
  updated[chatIndex].messages[messageIndex].image = { ...current, ...patch };
  useStore.getState().setChats(updated);
};

export const runImageGeneration = async (
  chatId: string,
  messageIndex: number,
  input: {
    provider: string;
    prompt: string;
    aspectRatio: ImageAspectRatio;
    imageId?: string;
  }
) => {
  const key = imageRequestKey(chatId, messageIndex);
  if (inFlight.has(key)) return;
  inFlight.add(key);

  const patch = (values: Partial<ImageMessageInterface>) =>
    updateImageMessage(chatId, messageIndex, values);

  patch({ status: 'loading', error: undefined });
  try {
    const result = await generateImage({
      provider: input.provider,
      prompt: input.prompt,
      aspectRatio: input.aspectRatio,
    });
    const imageId = input.imageId ?? uuidv4();
    await saveImage(imageId, base64ToBlob(result.dataBase64, result.mimeType));
    patch({ status: 'done', imageId, mimeType: result.mimeType, error: undefined });
  } catch (err) {
    patch({
      status: 'error',
      error: err instanceof Error ? err.message : 'Image generation failed. Please try again.',
    });
  } finally {
    inFlight.delete(key);
  }
};
