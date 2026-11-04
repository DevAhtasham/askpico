import {
  llmConfig,
  chatConfig,
  allowedModels,
  fallbackModels,
  systemPrompt,
} from './config.js';
import { agentPersonas } from './personas.js';
import { findEmergency } from './emergency.js';
import { recentAgentMessages, saveAgentMessages } from './agentStore.js';
import { logger } from './logger.js';
import { externalTools, toolsForExtensions } from './toolRegistry.js';

const HISTORY_LIMIT = 10;

export const specialistDescriptions = {
  study: 'school or college topics, explanations, lesson plans, quizzes, science and chemistry facts',
  doctor: 'health symptoms, general medicine and wellbeing questions (not emergencies)',
  business: 'pricing, freelance rates, money and tax basics, invoices, barcodes, QR codes, small shop work',
  career: 'CV, cover letters, formal or job emails, interview prep, Roman Urdu text clean-up, writing prompts',
  hacker: 'programming, developer tools, JSON, regex, SQL, XML, debugging code, unit conversion',
  creative: 'design ideas, colors, logos, images, stock photos, creative writing',
  office: 'documents, letters, reports, PDF and office paperwork',
  lock_in: 'productivity, focus, study routine, motivation, time management, reminders',
  live: 'current weather, time zones, currency rates, latest live information',
};

const callLlm = async (messages, model, signal, overrides = {}) => {
  const models = [model, ...fallbackModels.filter((m) => m !== model)];
  let upstream;
  let lastError;
  for (const candidate of models) {
    try {
      upstream = await fetch(`${llmConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${llmConfig.apiKey}`,
        },
        body: JSON.stringify({ ...chatConfig, ...overrides, model: candidate, messages, stream: false }),
        signal,
      });
      if (upstream.status === 503) continue;
      if (!upstream.ok) {
        lastError = new Error(`LLM request failed (${upstream.status}): ${await upstream.text()}`);
        continue;
      }
      const data = await upstream.json();
      const firstChoice = data.choices?.[0];
      if (firstChoice?.error) {
        logger.warn(`model ${candidate} choice error: ${firstChoice.error.message}`);
        continue;
      }
      const content = firstChoice?.message?.content;
      if (typeof content === 'string' && content.trim() !== '') {
        return content;
      }
      const reasoning = firstChoice?.message?.reasoning;
      const jsonFromReasoning = typeof reasoning === 'string' ? reasoning.match(/\{[\s\S]*?\}/)?.[0] : null;
      if (jsonFromReasoning) {
        return jsonFromReasoning;
      }
    } catch (err) {
      lastError = err;
    }
  }
  if (lastError) throw lastError;
  return '';
};

const pickModel = (model) => (allowedModels.includes(model) ? model : chatConfig.model);

export const routeMessage = async (message, { model, signal }) => {
  const options = Object.keys(specialistDescriptions)
    .map((id) => `- ${id}: ${specialistDescriptions[id]}`)
    .join('\n');
  const routerPrompt =
    'You route messages for Pico. Choose the single best specialist for the user message, ' +
    'or "core" if general chat is enough. Choose a specialist only when it clearly fits. ' +
    `Specialists:\n${options}\n` +
    'Reply with only the id (for example: study, career, or core). No other text.';

  const reply = await callLlm(
    [
      { role: 'system', content: routerPrompt },
      { role: 'user', content: message },
    ],
    pickModel(model),
    signal
  );
  const id = reply.trim().toLowerCase().replace(/[^a-z_]/g, '');
  const selected = Object.hasOwn(specialistDescriptions, id) ? id : null;
  logger.debug(`router raw reply "${reply.trim()}" -> ${selected ?? 'core'}`);
  return selected;
};

const toolCatalog = externalTools
  .map((tool) => `- ${tool.id} ${tool.params}: ${tool.description}`)
  .join('\n');

export const planDataTool = async (message, { model, signal }) => {
  const prompt =
    `You classify queries for live data APIs:\n${toolCatalog}\n` +
    'When the user asks for real-time or factual data matching an API, pick that id and extract params.\n' +
    'If no API matches (general question, greeting, coding, chat), pick "none".\n' +
    'Output ONLY valid JSON: {"toolId":"<id or none>","params":{...}}';

  const reply = await callLlm(
    [
      { role: 'system', content: prompt },
      { role: 'user', content: message },
    ],
    pickModel(model),
    signal,
    { temperature: 0, top_p: 1 }
  );
  const json = reply.match(/\{[\s\S]*\}/)?.[0];
  if (!json) {
    logger.warn(`tool plan has no JSON, raw reply: "${reply.trim()}"`);
    return null;
  }
  const { toolId, params = {} } = JSON.parse(json);
  if (!externalTools.some((tool) => tool.id === toolId)) {
    logger.debug(`tool plan chose "${toolId}", no external tool matched`);
    return null;
  }
  logger.debug(`tool plan: ${toolId} ${JSON.stringify(params)}`);
  return { toolId, params };
};

export const routeAttachment = async (message, extensions, { model, signal }) => {
  const candidates = toolsForExtensions(extensions);
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const catalog = JSON.stringify(candidates.map(({ id, description }) => ({ id, description })));
  const reply = await callLlm(
    [
      {
        role: 'system',
        content:
          `Attached file types: ${extensions.join(', ')}. Pick the single tool that best matches the user request. ` +
          `Tools: ${catalog}. Reply with only JSON like {"toolId":"<id>"}.`,
      },
      { role: 'user', content: message },
    ],
    pickModel(model),
    signal
  );

  const match = reply.match(/"toolId"\s*:\s*"([a-z0-9-]+)"/i);
  const tool = candidates.find((candidate) => candidate.id === match?.[1]);
  logger.debug(`attachment router raw reply "${reply.trim()}" -> ${tool?.id ?? 'none'}`);
  if (!tool) throw new Error('Is file ke liye sahi tool tay nahi ho saka. Apni request thodi wazeh likhein.');
  return tool;
};

export const runSpecialist = async ({ anonId, agentId, chatId, turn, message, model, signal }) => {
  if (agentId === 'doctor') {
    const warning = findEmergency(message);
    if (warning) return warning;
  }

  const history = recentAgentMessages(anonId, agentId, chatId, HISTORY_LIMIT);
  logger.debug(`specialist "${agentId}" history=${history.length} messages, anon=${anonId.slice(0, 8)}`);
  const persona = agentPersonas[agentId];
  const reply = await callLlm(
    [
      { role: 'system', content: `${systemPrompt}\n\n${persona}` },
      ...history,
      { role: 'user', content: message },
    ],
    pickModel(model),
    signal
  );

  saveAgentMessages(anonId, agentId, chatId, turn, [
    { role: 'user', content: message },
    { role: 'assistant', content: reply },
  ]);
  return reply;
};
