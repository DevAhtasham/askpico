import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { geminiImageProvider, ImageProviderError } from '../src/imageProviders/gemini.js';
import { getImageProvider, listConfiguredImageProviders } from '../src/imageProviders/index.js';

const originalFetch = globalThis.fetch;
const originalKey = process.env.GEMINI_API_KEY;

const mockFetch = (handler) => {
  globalThis.fetch = async (url, init) => handler(url, init);
};

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

beforeEach(() => {
  process.env.GEMINI_API_KEY = 'test-key';
  delete process.env.GEMINI_IMAGE_MODEL;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalKey;
});

test('gemini adapter returns the first inlineData part on success', async () => {
  let captured;
  mockFetch(async (url, init) => {
    captured = { url, init };
    return jsonResponse(200, {
      candidates: [
        {
          content: {
            parts: [
              { text: 'here you go' },
              { inlineData: { mimeType: 'image/png', data: 'QUJD' } },
            ],
          },
        },
      ],
    });
  });

  const result = await geminiImageProvider.generate({ prompt: 'robot', aspectRatio: '16:9' });

  assert.deepEqual(result, {
    mimeType: 'image/png',
    dataBase64: 'QUJD',
    model: 'gemini-3.1-flash-image',
  });
  assert.match(captured.url, /generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-3\.1-flash-image:generateContent$/);
  assert.equal(captured.init.headers['x-goog-api-key'], 'test-key');
  const body = JSON.parse(captured.init.body);
  assert.deepEqual(body.generationConfig.responseModalities, ['TEXT', 'IMAGE']);
  assert.equal(body.generationConfig.imageConfig.aspectRatio, '16:9');
});

test('gemini adapter honours GEMINI_IMAGE_MODEL', async () => {
  process.env.GEMINI_IMAGE_MODEL = 'custom-image-model';
  let url;
  mockFetch(async (u) => {
    url = u;
    return jsonResponse(200, { candidates: [{ content: { parts: [{ inlineData: { data: 'x' } }] } }] });
  });
  const result = await geminiImageProvider.generate({ prompt: 'p' });
  assert.equal(result.model, 'custom-image-model');
  assert.match(url, /models\/custom-image-model:generateContent/);
});

test('gemini adapter throws when response has no inlineData', async () => {
  mockFetch(async () => jsonResponse(200, { candidates: [{ content: { parts: [{ text: 'no image' }] } }] }));
  await assert.rejects(
    () => geminiImageProvider.generate({ prompt: 'p' }),
    (err) => err instanceof ImageProviderError && err.status === 502
  );
});

test('gemini adapter surfaces upstream 429 with its status', async () => {
  mockFetch(async () => jsonResponse(429, { error: { message: 'quota' } }));
  await assert.rejects(
    () => geminiImageProvider.generate({ prompt: 'p' }),
    (err) => err instanceof ImageProviderError && err.status === 429
  );
});

test('gemini adapter does not leak the upstream body into the error message', async () => {
  mockFetch(async () => jsonResponse(500, { error: { message: 'secret detail' } }));
  await assert.rejects(
    () => geminiImageProvider.generate({ prompt: 'p' }),
    (err) => !err.message.includes('secret detail')
  );
});

test('gemini adapter aborts the upstream request when the caller signal aborts', async () => {
  const controller = new AbortController();
  mockFetch(
    (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new Error('aborted')));
      })
  );
  const pending = geminiImageProvider.generate({ prompt: 'p', signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, /aborted/);
});

test('gemini adapter passes a live timeout signal to fetch', async () => {
  let signal;
  mockFetch(async (_url, init) => {
    signal = init.signal;
    return jsonResponse(200, { candidates: [{ content: { parts: [{ inlineData: { data: 'x' } }] } }] });
  });
  await geminiImageProvider.generate({ prompt: 'p' });
  assert.ok(signal instanceof AbortSignal);
  assert.equal(signal.aborted, false);
});

test('registry lists only providers whose key is configured', () => {
  assert.deepEqual(listConfiguredImageProviders(), [{ id: 'gemini', label: 'Gemini' }]);
  assert.equal(getImageProvider('gemini').id, 'gemini');

  delete process.env.GEMINI_API_KEY;
  assert.deepEqual(listConfiguredImageProviders(), []);
  assert.equal(getImageProvider('gemini'), null);
});

test('registry rejects unknown provider names', () => {
  assert.equal(getImageProvider('unknown'), null);
  assert.equal(getImageProvider('__proto__'), null);
  assert.equal(getImageProvider(undefined), null);
});
