import { ImageProviderError } from './gemini.js';

const NANOBANANA_BASE_URL = 'https://api.nanobananaapi.ai/api/v1/nanobanana';
const REQUEST_TIMEOUT_MS = 30000;
const POLL_INTERVAL_MS = 3000;
const MAX_WAIT_MS = 180000;

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    }, { once: true });
  });

const authHeaders = () => ({
  Authorization: `Bearer ${process.env.NANOBANANA_API_KEY}`,
  'Content-Type': 'application/json',
});

const requestSignal = (signal) =>
  signal
    ? AbortSignal.any([AbortSignal.timeout(REQUEST_TIMEOUT_MS), signal])
    : AbortSignal.timeout(REQUEST_TIMEOUT_MS);

const submitTask = async (prompt, signal) => {
  const body = {
    prompt,
    type: 'TEXTTOIAMGE',
    numImages: 1,
  };
  if (process.env.NANOBANANA_CALLBACK_URL) {
    body.callBackUrl = process.env.NANOBANANA_CALLBACK_URL;
  }

  const response = await fetch(`${NANOBANANA_BASE_URL}/generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
    signal: requestSignal(signal),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.code !== 200 || !result?.data?.taskId) {
    throw new ImageProviderError(
      `NanoBanana rejected the task (${response.status})`,
      response.status
    );
  }
  return result.data.taskId;
};

const fetchTaskResult = async (taskId, signal) => {
  const response = await fetch(
    `${NANOBANANA_BASE_URL}/record-info?taskId=${encodeURIComponent(taskId)}`,
    { headers: authHeaders(), signal: requestSignal(signal) }
  );
  if (!response.ok) {
    throw new ImageProviderError(`NanoBanana status check failed (${response.status})`, response.status);
  }
  const body = await response.json();
  return body.data;
};

const waitForResultUrl = async (taskId, signal) => {
  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    const task = await fetchTaskResult(taskId, signal);
    if (task.successFlag === 1) {
      const url = task.response?.resultImageUrl;
      if (!url) throw new ImageProviderError('NanoBanana returned no image URL', 502);
      return url;
    }
    if (task.successFlag === 2 || task.successFlag === 3) {
      throw new ImageProviderError('NanoBanana generation failed', 502);
    }
    await sleep(POLL_INTERVAL_MS, signal);
  }
  throw new ImageProviderError('NanoBanana generation timed out', 504);
};

const downloadAsBase64 = async (url, signal) => {
  const response = await fetch(url, { signal: requestSignal(signal) });
  if (!response.ok) {
    throw new ImageProviderError(`NanoBanana image download failed (${response.status})`, 502);
  }
  const mimeType = response.headers.get('content-type')?.split(';')[0] || 'image/png';
  const buffer = Buffer.from(await response.arrayBuffer());
  return { mimeType, dataBase64: buffer.toString('base64') };
};

export const nanobananaImageProvider = {
  id: 'nanobanana',
  label: 'NanoBanana',

  isConfigured: () => Boolean(process.env.NANOBANANA_API_KEY),

  async generate({ prompt, signal }) {
    const taskId = await submitTask(prompt, signal);
    const resultUrl = await waitForResultUrl(taskId, signal);
    const image = await downloadAsBase64(resultUrl, signal);
    return { ...image, model: 'nanobanana' };
  },
};
