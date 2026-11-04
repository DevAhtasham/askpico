import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { nanobananaImageProvider } from '../src/imageProviders/nanobanana.js';
import { ImageProviderError } from '../src/imageProviders/gemini.js';
import { getImageProvider, listConfiguredImageProviders } from '../src/imageProviders/index.js';

const originalFetch = globalThis.fetch;
const originalKey = process.env.NANOBANANA_API_KEY;
const originalGeminiKey = process.env.GEMINI_API_KEY;

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const imageResponse = (bytes) =>
  new Response(bytes, { status: 200, headers: { 'Content-Type': 'image/png' } });

beforeEach(() => {
  process.env.NANOBANANA_API_KEY = 'test-nano-key';
  delete process.env.NANOBANANA_CALLBACK_URL;
  delete process.env.GEMINI_API_KEY;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.NANOBANANA_API_KEY;
  else process.env.NANOBANANA_API_KEY = originalKey;
  if (originalGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalGeminiKey;
});

test('nanobanana adapter submits, polls until success, and returns base64 image', async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).endsWith('/generate')) {
      return jsonResponse(200, { code: 200, msg: 'success', data: { taskId: 'task-1' } });
    }
    if (String(url).includes('/record-info')) {
      return jsonResponse(200, { code: 200, data: { successFlag: 1, response: { resultImageUrl: 'https://cdn.example/img.png' } } });
    }
    return imageResponse(Buffer.from('ABC'));
  };

  const result = await nanobananaImageProvider.generate({ prompt: 'a red apple' });

  assert.deepEqual(result, {
    mimeType: 'image/png',
    dataBase64: Buffer.from('ABC').toString('base64'),
    model: 'nanobanana',
  });
  assert.equal(calls[0].init.headers.Authorization, 'Bearer test-nano-key');
  assert.equal(JSON.parse(calls[0].init.body).prompt, 'a red apple');
  assert.equal(JSON.parse(calls[0].init.body).callBackUrl, undefined);
  assert.match(calls[1].url, /record-info\?taskId=task-1$/);
});

test('nanobanana adapter sends callBackUrl only when configured', async () => {
  process.env.NANOBANANA_CALLBACK_URL = 'https://hook.example/cb';
  let body;
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith('/generate')) {
      body = JSON.parse(init.body);
      return jsonResponse(200, { code: 200, data: { taskId: 't' } });
    }
    if (String(url).includes('/record-info')) {
      return jsonResponse(200, { code: 200, data: { successFlag: 1, response: { resultImageUrl: 'https://cdn.example/x' } } });
    }
    return imageResponse(Buffer.from('x'));
  };

  await nanobananaImageProvider.generate({ prompt: 'p' });
  assert.equal(body.callBackUrl, 'https://hook.example/cb');
});

test('nanobanana adapter fails when the task is rejected at submission', async () => {
  globalThis.fetch = async () => jsonResponse(402, { code: 402, msg: 'insufficient credits' });
  await assert.rejects(
    () => nanobananaImageProvider.generate({ prompt: 'p' }),
    (err) => err instanceof ImageProviderError && err.status === 402 && !err.message.includes('credits')
  );
});

test('nanobanana adapter fails when generation reports failure', async () => {
  globalThis.fetch = async (url) => {
    if (String(url).endsWith('/generate')) {
      return jsonResponse(200, { code: 200, data: { taskId: 't' } });
    }
    return jsonResponse(200, { code: 200, data: { successFlag: 3, errorMessage: 'blocked' } });
  };
  await assert.rejects(
    () => nanobananaImageProvider.generate({ prompt: 'p' }),
    (err) => err instanceof ImageProviderError && !err.message.includes('blocked')
  );
});

test('registry lists nanobanana only when its key is configured', () => {
  assert.deepEqual(listConfiguredImageProviders(), [{ id: 'nanobanana', label: 'NanoBanana' }]);
  assert.equal(getImageProvider('nanobanana').id, 'nanobanana');
  delete process.env.NANOBANANA_API_KEY;
  assert.equal(getImageProvider('nanobanana'), null);
});
