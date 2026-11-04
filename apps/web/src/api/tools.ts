import { fetchWithRetry } from './api';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const askAgent = async (
  agentId: string,
  userPrompt: string
): Promise<string> => {
  const response = await fetchWithRetry(`${backendUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: userPrompt }],
      agentId,
      stream: false,
    }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? `Request failed (${response.status})`);
  return data?.choices?.[0]?.message?.content ?? '';
};

export const fetchTool = async <T>(
  tool: string,
  params: Record<string, string> = {}
): Promise<T> => {
  const query = new URLSearchParams(params).toString();
  const response = await fetchWithRetry(
    `${backendUrl}/api/tools/${encodeURIComponent(tool)}${query ? `?${query}` : ''}`
  );
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? `Tool request failed (${response.status})`);
  return data as T;
};
