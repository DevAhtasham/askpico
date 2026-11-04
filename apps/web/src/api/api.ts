import { ShareGPTSubmitBodyInterface } from '@type/api';
import { ImageAspectRatio, MessageInterface, ModelOptions } from '@type/chat';
import { getAnonId } from '@utils/anonId';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const fetchWithRetry = async (
  input: string,
  init?: RequestInit,
  attempts = 6,
  baseDelayMs = 500
): Promise<Response> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(input, init);
    } catch (err) {
      if (init?.signal?.aborted || attempt >= attempts || !(err instanceof TypeError)) throw err;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** (attempt - 1)));
    }
  }
};

export const compileArtifactTailwind = async (sources: string[]): Promise<string> => {
  const response = await fetchWithRetry(`${backendUrl}/api/artifact/css`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sources }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? `Tailwind compile failed (${response.status})`);
  return (data as { css: string }).css;
};

export const submitArtifactForm = async (body: {
  artifactId: string;
  formId: string | null;
  submittedAt: string;
  fields: Record<string, string>;
}): Promise<boolean> => {
  const response = await fetchWithRetry(`${backendUrl}/api/artifact/submission`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.ok;
};

export const getChatCompletion = async (messages: MessageInterface[]) => {
  const response = await fetchWithRetry(`${backendUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  if (!response.ok) throw new Error(await response.text());

  const data = await response.json();
  return data;
};

export interface RouteResult {
  agentId: string | null;
  toolId?: string;
  location?: 'backend' | 'external' | 'browser';
  data?: unknown;
  toolError?: string;
}

export const routeToAgent = async (
  message: string,
  model?: ModelOptions,
  fileExtensions: string[] = []
): Promise<RouteResult | null> => {
  const response = await fetchWithRetry(`${backendUrl}/api/agent/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anonId: getAnonId(), message, model, fileExtensions }),
  });
  const data = await response.json().catch(() => null);
  if (response.status === 422) throw new Error(data?.error ?? 'Tool routing failed');
  if (!response.ok) return null;
  return data ?? null;
};

export const truncateAgentHistory = async (chatId: string, fromTurn: number): Promise<void> => {
  const response = await fetchWithRetry(`${backendUrl}/api/agent/truncate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anonId: getAnonId(), chatId, fromTurn }),
  });
  if (!response.ok) throw new Error(`History cleanup failed (${response.status})`);
};

export const askSpecialistAgent = async (
  agentId: string,
  message: string,
  chatId: string,
  turn: number,
  model?: ModelOptions
): Promise<string> => {
  const response = await fetchWithRetry(`${backendUrl}/api/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anonId: getAnonId(), agentId, chatId, turn, message, model }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? `Agent request failed (${response.status})`);
  return data.reply as string;
};

export const extractAttachmentText = async (name: string, dataBase64: string): Promise<string> => {
  const response = await fetch(`${backendUrl}/api/attachments/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, dataBase64 }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? `Attachment failed (${response.status})`);
  return data.text as string;
};

export const getChatCompletionStream = async (
  messages: MessageInterface[],
  model?: ModelOptions
) => {
  const response = await fetchWithRetry(`${backendUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model, stream: true }),
  });

  if (!response.ok) {
    const text = await response.text();
    let error = text;
    if (response.status === 429) error += '\nRate limited!';
    throw new Error(error);
  }

  const stream = response.body;
  return stream;
};

export interface ImageProviderInterface {
  id: string;
  label: string;
}

export interface GeneratedImageInterface {
  mimeType: string;
  dataBase64: string;
  provider: string;
  model: string;
}

export const fetchImageProviders = async (): Promise<ImageProviderInterface[]> => {
  const response = await fetchWithRetry(`${backendUrl}/api/image/providers`);
  if (!response.ok) throw new Error(`Failed to load image providers (${response.status})`);
  const data = await response.json();
  return data.providers as ImageProviderInterface[];
};

// Not retried automatically: each call may be billed by the provider.
export const generateImage = async (body: {
  provider: string;
  prompt: string;
  aspectRatio: ImageAspectRatio;
}): Promise<GeneratedImageInterface> => {
  const response = await fetch(`${backendUrl}/api/image/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? `Image generation failed (${response.status})`);
  return data as GeneratedImageInterface;
};

export const submitShareGPT = async (body: ShareGPTSubmitBodyInterface) => {
  const request = await fetch('https://sharegpt.com/api/conversations', {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  const response = await request.json();
  const { id } = response;
  const url = `https://shareg.pt/${id}`;
  window.open(url, '_blank');
};
