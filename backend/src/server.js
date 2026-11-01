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

const app = express();

app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', serverConfig.corsOrigin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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

app.listen(serverConfig.port, () => {
  logger.info(`Backend running on http://localhost:${serverConfig.port}`);
});
