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
import { agentPersonas } from './personas.js';
import { toolAdapters } from './toolAdapters.js';
import { findEmergency } from './emergency.js';
import {
  planDataTool,
  routeAttachment,
  routeMessage,
  runSpecialist,
  specialistDescriptions,
} from './orchestrator.js';
import { truncateAgentMessages } from './agentStore.js';
import { externalTools } from './toolRegistry.js';
import {
  ATTACHMENT_MAX_BYTES,
  extractAttachmentText,
  truncateForModel,
} from './attachments.js';

const app = express();

const defaultJson = express.json({ limit: '2mb' });
app.use((req, res, next) =>
  req.path === '/api/artifact/submission' || req.path === '/api/attachments/extract'
    ? next()
    : defaultJson(req, res, next)
);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', serverConfig.corsOrigin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.post('/api/chat', async (req, res) => {
  const { messages, stream = false, model, agentId } = req.body ?? {};

  const requestId = randomUUID().slice(0, 8);
  const startedAt = Date.now();
  const elapsed = () => `${Date.now() - startedAt}ms`;

  if (!Array.isArray(messages) || messages.length === 0) {
    console.warn(`[${requestId}] rejected: messages array missing or empty`);
    return res.status(400).json({ error: 'messages array is required' });
  }
  if (!llmConfig.apiKey) {
    console.error(`[${requestId}] rejected: ${llmConfig.keyName} is not set`);
    return res.status(500).json({ error: `${llmConfig.keyName} is not set on the server` });
  }

  const primaryModel = allowedModels.includes(model) ? model : chatConfig.model;
  const models = [
    primaryModel,
    ...fallbackModels.filter((m) => m !== primaryModel),
  ];
  logger.debug(
    `[${requestId}] new request: stream=${stream}, messages=${messages.length}, model order=${models.join(' -> ')}`
  );

  const persona = Object.hasOwn(agentPersonas, agentId) ? agentPersonas[agentId] : null;
  const outgoingMessages = [
    { role: 'system', content: persona ? `${systemPrompt}\n\n${persona}` : systemPrompt },
    ...messages.filter((m) => m.role !== 'system'),
  ];

  if (agentId === 'doctor') {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const warning = findEmergency(typeof lastUser?.content === 'string' ? lastUser.content : '');
    if (warning) {
      logger.warn(`[${requestId}] emergency keyword matched, LLM skipped`);
      if (stream) {
        const chunk = {
          id: `emergency-${requestId}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: 'emergency-filter',
          choices: [{ index: 0, delta: { role: 'assistant', content: warning }, finish_reason: 'stop' }],
        };
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        return res.end('data: [DONE]\n\n');
      }
      return res.json({
        id: `emergency-${requestId}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'emergency-filter',
        choices: [{ index: 0, message: { role: 'assistant', content: warning }, finish_reason: 'stop' }],
      });
    }
  }

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

app.get('/api/tools/:tool', async (req, res) => {
  const adapter = Object.hasOwn(toolAdapters, req.params.tool) ? toolAdapters[req.params.tool] : null;
  if (!adapter) return res.status(404).json({ error: 'unknown tool' });

  try {
    res.json(await adapter(req.query));
  } catch (err) {
    logger.warn(`[tool:${req.params.tool}] failed: ${err.message}`);
    res.status(502).json({ error: err.message });
  }
});

const ANON_ID_PATTERN = /^[\w-]{8,100}$/;
const AGENT_MESSAGE_MAX_LENGTH = 4000;
const CHAT_ID_PATTERN = /^[\w-]{1,100}$/;

const EXTENSION_PATTERN = /^\.[a-z0-9]{1,10}$/;

app.post('/api/agent/route', async (req, res) => {
  const requestId = randomUUID().slice(0, 8);
  const { anonId, message, model, fileExtensions = [] } = req.body ?? {};

  if (typeof anonId !== 'string' || !ANON_ID_PATTERN.test(anonId)) {
    return res.status(400).json({ error: 'anonId is required' });
  }
  if (typeof message !== 'string' || message.trim() === '' || message.length > AGENT_MESSAGE_MAX_LENGTH) {
    return res.status(400).json({ error: 'message is required' });
  }
  if (!Array.isArray(fileExtensions) || !fileExtensions.every((ext) => EXTENSION_PATTERN.test(ext))) {
    return res.status(400).json({ error: 'fileExtensions is invalid' });
  }
  if (!llmConfig.apiKey) {
    return res.status(500).json({ error: `${llmConfig.keyName} is not set on the server` });
  }

  const signal = AbortSignal.timeout(20000);
  if (fileExtensions.length > 0) {
    try {
      const tool = await routeAttachment(message, fileExtensions, { model, signal });
      if (tool) {
        logger.debug(`[${requestId}] attachment routed to tool ${tool.id} (${tool.location})`);
        return res.json({ agentId: tool.agent, toolId: tool.id, location: tool.location });
      }
    } catch (err) {
      logger.warn(`[${requestId}] attachment routing failed: ${err.message}`);
      return res.status(422).json({ error: err.message });
    }
  }

  try {
    const call = await planDataTool(message, { model, signal: AbortSignal.timeout(20000) }).catch(
      (err) => {
        logger.warn(`[${requestId}] tool planning failed: ${err.message}`);
        return null;
      }
    );
    if (call) {
      const tool = externalTools.find((candidate) => candidate.id === call.toolId);
      try {
        const data = await toolAdapters[call.toolId](call.params);
        logger.debug(`[${requestId}] tool ${call.toolId} ok`);
        return res.json({ agentId: tool.agent, toolId: call.toolId, location: 'external', data });
      } catch (err) {
        logger.warn(`[${requestId}] tool ${call.toolId} failed: ${err.message}`);
        return res.json({
          agentId: tool.agent,
          toolId: call.toolId,
          location: 'external',
          toolError: `Live data nahi mil saka (${err.message}). Server ki API key ya connection check karein.`,
        });
      }
    }
    const agentId = await routeMessage(message, { model, signal: AbortSignal.timeout(20000) });
    logger.debug(`[${requestId}] routed to ${agentId ?? 'core'}`);
    res.json({ agentId });
  } catch (err) {
    logger.warn(`[${requestId}] routing failed, using core: ${err.message}`);
    res.json({ agentId: null });
  }
});

app.post('/api/agent/chat', async (req, res) => {
  const requestId = randomUUID().slice(0, 8);
  const { anonId, agentId, chatId, turn, message, model } = req.body ?? {};

  if (typeof anonId !== 'string' || !ANON_ID_PATTERN.test(anonId)) {
    return res.status(400).json({ error: 'anonId is required' });
  }
  if (typeof chatId !== 'string' || !CHAT_ID_PATTERN.test(chatId)) {
    return res.status(400).json({ error: 'chatId is required' });
  }
  if (!Number.isInteger(turn) || turn < 0) {
    return res.status(400).json({ error: 'turn is required' });
  }
  if (!Object.hasOwn(specialistDescriptions, agentId)) {
    return res.status(400).json({ error: 'unknown agentId' });
  }
  if (typeof message !== 'string' || message.trim() === '' || message.length > AGENT_MESSAGE_MAX_LENGTH) {
    return res.status(400).json({ error: 'message is required' });
  }
  if (!llmConfig.apiKey) {
    return res.status(500).json({ error: `${llmConfig.keyName} is not set on the server` });
  }

  try {
    const reply = await runSpecialist({
      anonId,
      agentId,
      chatId,
      turn,
      message,
      model,
      signal: AbortSignal.timeout(60000),
    });
    res.json({ agentId, reply });
  } catch (err) {
    console.error(`[${requestId}] specialist ${agentId} failed: ${err.message}`);
    res.status(502).json({ error: err.message });
  }
});

app.post('/api/agent/truncate', (req, res) => {
  const { anonId, chatId, fromTurn } = req.body ?? {};

  if (typeof anonId !== 'string' || !ANON_ID_PATTERN.test(anonId)) {
    return res.status(400).json({ error: 'anonId is required' });
  }
  if (typeof chatId !== 'string' || !CHAT_ID_PATTERN.test(chatId)) {
    return res.status(400).json({ error: 'chatId is required' });
  }
  if (!Number.isInteger(fromTurn) || fromTurn < 0) {
    return res.status(400).json({ error: 'fromTurn is required' });
  }

  truncateAgentMessages(anonId, chatId, fromTurn);
  res.json({ ok: true });
});

app.post(
  '/api/attachments/extract',
  express.json({ limit: '15mb' }),
  async (req, res) => {
    const requestId = randomUUID().slice(0, 8);
    const { name, dataBase64 } = req.body ?? {};

    if (typeof name !== 'string' || name.trim() === '' || name.length > 255) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (typeof dataBase64 !== 'string' || dataBase64 === '') {
      return res.status(400).json({ error: 'dataBase64 is required' });
    }

    const buffer = Buffer.from(dataBase64, 'base64');
    if (buffer.length === 0 || buffer.length > ATTACHMENT_MAX_BYTES) {
      return res.status(400).json({ error: 'file size must be between 1 byte and 10 MB' });
    }

    try {
      const text = truncateForModel(await extractAttachmentText(name, buffer));
      res.json({ text });
    } catch (err) {
      logger.warn(`[${requestId}] attachment extract failed: ${err.message}`);
      res.status(422).json({ error: err.message });
    }
  }
);

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

process.on('unhandledRejection', (reason) => {
  logger.error('unhandled rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('uncaught exception:', err);
});

app.listen(serverConfig.port, () => {
  logger.info(`Backend running on http://localhost:${serverConfig.port}`);
});
