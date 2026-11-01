import { ShareGPTSubmitBodyInterface } from '@type/api';
import { MessageInterface, ModelOptions } from '@type/chat';

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
