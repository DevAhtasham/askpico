import express from 'express';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import {
  llmConfig,
  chatConfig,
  allowedModels,
  fallbackModels,
  serverConfig,
  systemPrompt,
} from './config.js';
import { logger } from './logger.js';
import { compileTailwind, validateSources } from './tailwind.js';
import {
  getImageProvider,
  listConfiguredImageProviders,
} from './imageProviders/index.js';

const app = express();

const defaultJson = express.json({ limit: '2mb' });
app.use((req, res, next) =>
  req.path === '/api/artifact/submission' ? next() : defaultJson(req, res, next)
);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', serverConfig.corsOrigin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.post('/api/chat', async (req, res) => {
  const { messages, stream = false, model } = req.body ?? {};

  const requestId = randomUUID().slice(0, 8);
  const startedAt = Date.now();
  const elapsed = () => `${Date.now() - startedAt}ms`;

  if (!Array.isArray(messages) || messages.length === 0) {
    console.warn(`[${requestId}] rejected: messages array missing or empty`);
    return res.status(400).json({ error: 'messages array is required' });
  }
  if (!llmConfig.apiKey) {
    console.error(`[${requestId}] rejected: GEMINI_API_KEY is not set`);
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set on the server' });
  }

  const primaryModel = allowedModels.includes(model) ? model : chatConfig.model;
  const models = [
    primaryModel,
    ...fallbackModels.filter((m) => m !== primaryModel),
  ];
  logger.debug(
    `[${requestId}] new request: stream=${stream}, messages=${messages.length}, model order=${models.join(' -> ')}`
  );

  const outgoingMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.filter((m) => m.role !== 'system'),
  ];

  const controller = new AbortController();
  res.on('close', () => controller.abort());

  try {
    let upstream;
    let usedModel;
    let unavailableText = '';
    for (const model of models) {
      logger.debug(`[${requestId}] sending to model "${model}"`);
      upstream = await fetch(`${llmConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${llmConfig.apiKey}`,
        },
        body: JSON.stringify({
          ...chatConfig,
          model,
          messages: outgoingMessages,
          stream,
        }),
        signal: controller.signal,
      });
      usedModel = model;
      if (upstream.status !== 503) break;
      unavailableText = await upstream.text();
      console.warn(
        `[${requestId}] model "${model}" unavailable (503) after ${elapsed()}: ${unavailableText}`
      );
    }

    if (!upstream.ok) {
      const text =
        upstream.status === 503 ? unavailableText : await upstream.text();
      console.error(
        `[${requestId}] failed on model "${usedModel}" with status ${upstream.status} after ${elapsed()}: ${text}`
      );
      return res.status(upstream.status).send(text);
    }
    logger.debug(
      `[${requestId}] response from model "${usedModel}" (status ${upstream.status}) after ${elapsed()}`
    );

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      Readable.fromWeb(upstream.body).pipe(res);
      return;
    }

    res.json(await upstream.json());
  } catch (err) {
    if (controller.signal.aborted) {
      logger.debug(`[${requestId}] client disconnected after ${elapsed()}`);
      return;
    }
    console.error(`[${requestId}] upstream fetch error after ${elapsed()}: ${err.message}`);
    res.status(502).json({ error: err.message });
  }
});

app.post('/api/artifact/css', async (req, res) => {
  const sources = req.body?.sources;
  const invalid = validateSources(sources);
  if (invalid) return res.status(400).json({ error: invalid });

  try {
    const css = await compileTailwind(sources);
    res.json({ css });
  } catch (err) {
    console.error(`[artifact-css] compile failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

const SUSPICIOUS_PATTERNS = ['<script', '</script', 'onerror=', 'onload=', 'javascript:', 'document.cookie', 'localstorage', 'sessionstorage', 'eval(', 'fetch(', 'new function', '<iframe'];
const SUBMISSION_MAX_KEYS = 50;
const SUBMISSION_MAX_VALUE_LENGTH = 2000;
const ARTIFACT_ID_PATTERN = /^[\w.-]{1,200}$/;

app.post('/api/artifact/submission', express.json({ limit: '16kb' }), (req, res) => {
  const requestId = randomUUID().slice(0, 8);
  const { artifactId, formId, submittedAt, fields } = req.body ?? {};

  if (typeof artifactId !== 'string' || !ARTIFACT_ID_PATTERN.test(artifactId)) {
    return res.status(400).json({ error: 'artifactId is required' });
  }
  const isObject = fields !== null && typeof fields === 'object' && !Array.isArray(fields);
  if (!isObject || Object.keys(fields).length > SUBMISSION_MAX_KEYS) {
    return res.status(400).json({ error: 'fields must be an object with at most 50 keys' });
  }
  const values = Object.values(fields);
  if (values.some((value) => typeof value !== 'string' || value.length > SUBMISSION_MAX_VALUE_LENGTH)) {
    return res.status(400).json({ error: 'each field must be a string of at most 2000 characters' });
  }

  const payload = {
    artifactId,
    formId: typeof formId === 'string' ? formId.slice(0, 200) : null,
    submittedAt: typeof submittedAt === 'string' ? submittedAt.slice(0, 64) : null,
    fields,
  };
  const lowered = values.map((value) => value.toLowerCase());
  const flags = SUSPICIOUS_PATTERNS.filter((pattern) => lowered.some((value) => value.includes(pattern)));

  if (flags.length > 0) {
    logger.warn(
      `[${requestId}] SUSPICIOUS submission from ${req.ip} artifact=${artifactId} flags=${flags.join(',')} payload=${JSON.stringify(payload)}`
    );
    return res.status(422).json({ error: 'rejected' });
  }

  logger.warn(
    `[${requestId}] submission from ${req.ip} artifact=${artifactId} fields=${JSON.stringify(Object.keys(fields))} payload=${JSON.stringify(payload)}`
  );
  res.json({ ok: true });
});

const IMAGE_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4'];
const IMAGE_PROMPT_MAX_LENGTH = 1000;
const IMAGE_RATE_WINDOW_MS = 60000;
const IMAGE_RATE_MAX_REQUESTS = 10;

// In-memory limiter: per process only. Use a shared store (e.g. Redis) when running multiple instances.
const imageRequestLog = new Map();

const allowImageRequest = (ip) => {
  const now = Date.now();
  const recent = (imageRequestLog.get(ip) ?? []).filter((t) => now - t < IMAGE_RATE_WINDOW_MS);
  if (recent.length >= IMAGE_RATE_MAX_REQUESTS) {
    imageRequestLog.set(ip, recent);
    return false;
  }
  recent.push(now);
  imageRequestLog.set(ip, recent);
  return true;
};

setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of imageRequestLog) {
    if (times.every((t) => now - t >= IMAGE_RATE_WINDOW_MS)) imageRequestLog.delete(ip);
  }
}, IMAGE_RATE_WINDOW_MS).unref();

app.get('/api/image/providers', (req, res) => {
  res.json({ providers: listConfiguredImageProviders() });
});

app.post('/api/image/generate', async (req, res) => {
  const requestId = randomUUID().slice(0, 8);
  const startedAt = Date.now();
  const elapsed = () => `${Date.now() - startedAt}ms`;
  const { provider: providerId, prompt, aspectRatio = '1:1' } = req.body ?? {};

  const provider = getImageProvider(providerId);
  if (!provider) {
    return res.status(400).json({ error: 'Image provider is not available' });
  }
  if (
    typeof prompt !== 'string' ||
    prompt.trim().length === 0 ||
    prompt.length > IMAGE_PROMPT_MAX_LENGTH
  ) {
    return res.status(400).json({ error: `prompt must be 1 to ${IMAGE_PROMPT_MAX_LENGTH} characters` });
  }
  if (!IMAGE_ASPECT_RATIOS.includes(aspectRatio)) {
    return res.status(400).json({ error: 'aspectRatio is not supported' });
  }
  if (!allowImageRequest(req.ip)) {
    logger.warn(`[${requestId}] image rate limit hit for ${req.ip}`);
    return res.status(429).json({ error: 'Too many image requests. Please wait a minute and try again.' });
  }

  logger.info(`[${requestId}] image request provider=${provider.id} aspectRatio=${aspectRatio}`);
  const controller = new AbortController();
  res.on('close', () => controller.abort());

  try {
    const result = await provider.generate({ prompt, aspectRatio, signal: controller.signal });
    logger.debug(`[${requestId}] image generated provider=${provider.id} model=${result.model} after ${elapsed()}`);
    res.json({
      mimeType: result.mimeType,
      dataBase64: result.dataBase64,
      provider: provider.id,
      model: result.model,
    });
  } catch (err) {
    if (controller.signal.aborted) {
      logger.debug(`[${requestId}] image client disconnected after ${elapsed()}`);
      return;
    }
    logger.warn(`[${requestId}] image failed provider=${provider.id} status=${err.status ?? 'n/a'} after ${elapsed()}: ${err.message}`);
    res.status(502).json({ error: 'Image generation failed. Please try again.' });
  }
});

app.listen(serverConfig.port, () => {
  logger.info(`Backend running on http://localhost:${serverConfig.port}`);
});
