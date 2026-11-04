import React from 'react';
import useStore from '@store/store';
import { useTranslation } from 'react-i18next';
import { ChatInterface, MessageInterface, StockPhoto } from '@type/chat';
import {
  askSpecialistAgent,
  getChatCompletion,
  getChatCompletionStream,
  RouteResult,
  routeToAgent,
  truncateAgentHistory,
} from '@api/api';
import { getAttachmentFile } from '@utils/attachmentStore';
import { convertPdfPages, pdfPageCount } from '@utils/pdfToPng';
import { parseEventSource } from '@api/helper';
import { limitMessageTokens, updateTotalTokenUsed } from '@utils/messageUtils';
import { _defaultChatConfig } from '@constants/chat';
import { extractArtifacts } from '@utils/artifactParser';
import { logger } from '@utils/logger';

const syncArtifacts = (
  chatId: string,
  messageIndex: number,
  content: string,
  final: boolean
) => {
  const detected = extractArtifacts(content, chatId, messageIndex);
  if (detected.length === 0) return;

  const state = useStore.getState();
  const prefix = `${chatId}-${messageIndex}-`;
  const previousCount = state.artifacts.filter((a) =>
    a.id.startsWith(prefix)
  ).length;
  state.setArtifacts([
    ...state.artifacts.filter((a) => !a.id.startsWith(prefix)),
    ...detected,
  ]);

  if (final) {
    state.setActiveArtifactTab(
      detected.length === 1 && detected[0].type !== 'code' ? 'preview' : 'code'
    );
    state.openArtifactPanel(detected[0].id);
  } else if (detected.length > previousCount) {
    state.setActiveArtifactTab('code');
    state.openArtifactPanel(detected[detected.length - 1].id);
  }
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const trace = (step: string, detail?: unknown) => {
  if (import.meta.env.DEV) console.info(`[Pico] ${step}`, detail ?? '');
};

const replaceLastAssistant = (chatIndex: number, patch: Partial<MessageInterface>) => {
  const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(useStore.getState().chats));
  const messages = updatedChats[chatIndex].messages;
  Object.assign(messages[messages.length - 1], patch);
  useStore.getState().setChats(updatedChats);
};

const runBrowserTool = async (chatIndex: number, toolId: string, userMessage?: MessageInterface) => {
  const attachment = userMessage?.attachments?.find((a) => a.ext === '.pdf');
  if (toolId !== 'pdf-to-png' || !attachment) {
    replaceLastAssistant(chatIndex, { content: 'Is tool ke liye sahi file nahi mili.' });
    return;
  }
  const file = getAttachmentFile(attachment.id);
  if (!file) {
    replaceLastAssistant(chatIndex, {
      content: 'Ye PDF ab available nahi hai (page refresh ho gaya). Please dobara attach karein.',
    });
    return;
  }

  try {
    const pageCount = await pdfPageCount(file);
    if (pageCount === 1) {
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const files = await convertPdfPages(file, [1], baseName);
      replaceLastAssistant(chatIndex, { content: 'Your PDF page has been converted to PNG.', files });
      return;
    }
    replaceLastAssistant(chatIndex, {
      content: `This PDF has ${pageCount} pages. Which pages should I convert?`,
      toolJob: { toolId, fileId: attachment.id, pageCount, status: 'awaiting' },
    });
  } catch (e: unknown) {
    replaceLastAssistant(chatIndex, { content: `PDF conversion failed: ${(e as Error).message}` });
  }
};

const describeNow = (locationTimeZone?: string): string => {
  const now = new Date();
  const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const deviceTime = now.toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: deviceZone,
  });
  const locationPart = locationTimeZone
    ? `\nCurrent time in the requested location (${locationTimeZone}): ${now.toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: locationTimeZone,
      })}`
    : '';
  return `Current time on the user's device (${deviceZone}): ${deviceTime}${locationPart}`;
};

const toModelMessage = (message: MessageInterface): MessageInterface => ({
  role: message.role,
  content: [message.content, message.fileContext, message.modelNote].filter(Boolean).join('\n\n'),
});

const useSubmit = () => {
  const { i18n } = useTranslation('api');
  const error = useStore((state) => state.error);
  const setError = useStore((state) => state.setError);
  const setGenerating = useStore((state) => state.setGenerating);
  const generating = useStore((state) => state.generating);
  const setChats = useStore((state) => state.setChats);

  const generateTitle = async (
    message: MessageInterface[]
  ): Promise<string> => {
    let data;
    try {
      data = await getChatCompletion(message);
    } catch (error: unknown) {
      throw new Error(`Error generating title!\n${(error as Error).message}`);
    }
    return data.choices[0].message.content;
  };

  const handleSubmit = async () => {
    const chats = useStore.getState().chats;
    if (generating || !chats) return;
    const currentChatIndex = useStore.getState().currentChatIndex;

    const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(chats));

    updatedChats[currentChatIndex].updatedAt = Date.now();
    updatedChats[currentChatIndex].messages.push({
      role: 'assistant',
      content: '',
    });

    setChats(updatedChats);
    setGenerating(true);

    try {
      let stream;
      if (chats[currentChatIndex].messages.length === 0)
        throw new Error('No messages submitted!');

      const messages = limitMessageTokens(
        chats[currentChatIndex].messages
          .filter((message) => !message.image)
          .map(toModelMessage),
        chats[currentChatIndex].config.max_tokens,
        chats[currentChatIndex].config.model
      );
      if (messages.length === 0) throw new Error('Message exceed max token!');

      const model = chats[currentChatIndex].config.model;
      const lastUserMessage = [...chats[currentChatIndex].messages]
        .reverse()
        .find((m) => m.role === 'user');
      const lastUserText = lastUserMessage?.content;
      let agentReply: string | null = null;
      let toolHandled = false;
      const fileExtensions = [...new Set((lastUserMessage?.attachments ?? []).map((a) => a.ext))];
      if (typeof lastUserText === 'string' && lastUserText.trim() !== '') {
        const { setHandoff } = useStore.getState();
        const chatId = chats[currentChatIndex].id;
        const userTurn = chats[currentChatIndex].messages.map((m) => m.role).lastIndexOf('user');
        await truncateAgentHistory(chatId, userTurn).catch((err: unknown) =>
          trace('0. history: cleanup failed', (err as Error).message)
        );
        setHandoff({ agentId: null, stage: 'routing' });
        trace('1. routing: POST /api/agent/route', { chars: lastUserText.length, model });
        let route: RouteResult | null = null;
        try {
          route = await routeToAgent(lastUserText, model, fileExtensions);
        } catch (err) {
          if (fileExtensions.length === 0) {
            trace('1. routing: request threw, using core', (err as Error).message);
          } else {
            toolHandled = true;
            replaceLastAssistant(currentChatIndex, { content: (err as Error).message });
          }
        }
        const agentId = route?.agentId ?? null;
        if (route?.toolError) {
          toolHandled = true;
          trace(`2. routing: live tool "${route.toolId}" failed`, route.toolError);
          replaceLastAssistant(currentChatIndex, { content: route.toolError });
        } else if (route?.location === 'external' && route.toolId && route.data && agentId) {
          trace(`2. routing: live tool "${route.toolId}"`);
          if (route.toolId === 'stock') {
            toolHandled = true;
            const photos = (route.data as { photos: StockPhoto[] }).photos;
            replaceLastAssistant(currentChatIndex, {
              content:
                photos.length > 0
                  ? `${photos.length} photos mil gayi hain.`
                  : 'Is query ke liye photos nahi mili.',
              photos,
            });
          } else {
            const locationZone = (route.data as { timezone?: string }).timezone;
            agentReply = await askSpecialistAgent(
              agentId,
              `${lastUserText}\n\n${describeNow(locationZone)}\nLive data from the ${route.toolId} tool (answer only from this data, do not guess). The data's own datetime is the last observation time and may be older than the current time above; state it as the observation time and use the current time for "now":\n${JSON.stringify(route.data)}`,
              chatId,
              userTurn,
              model
            );
          }
        } else if (route?.location === 'browser' && route.toolId) {
          toolHandled = true;
          trace(`2. routing: browser tool "${route.toolId}"`);
          await runBrowserTool(currentChatIndex, route.toolId, lastUserMessage);
        } else if (agentId) {
          trace(`2. routing: selected specialist "${agentId}"`);
          setHandoff({ agentId, stage: 'delegating' });
          await wait(700);
          setHandoff({ agentId, stage: 'working' });
          const started = performance.now();
          agentReply = await askSpecialistAgent(agentId, lastUserText, chatId, userTurn, model);
          trace(`3. specialist "${agentId}" replied`, {
            ms: Math.round(performance.now() - started),
            chars: agentReply.length,
          });
          setHandoff({ agentId, stage: 'returning' });
          await wait(700);
        } else {
          trace('2. routing: no specialist (core chosen or route unavailable)');
        }
      }

      if (agentReply !== null) {
        const repliedChats: ChatInterface[] = JSON.parse(JSON.stringify(useStore.getState().chats));
        const repliedMessages = repliedChats[currentChatIndex].messages;
        repliedMessages[repliedMessages.length - 1].content = agentReply;
        setChats(repliedChats);
      } else if (!toolHandled) {
        trace('3. core: POST /api/chat (streaming)', { model, messages: messages.length });
        stream = await getChatCompletionStream(messages, model);
      }

      if (stream) {
        if (stream.locked)
          throw new Error(
            'Oops, the stream is locked right now. Please try again'
          );
        const reader = stream.getReader();
        let reading = true;
        let partial = '';
        while (reading && useStore.getState().generating) {
          const { done, value } = await reader.read();
          const result = parseEventSource(
            partial + new TextDecoder().decode(value)
          );
          partial = '';

          if (result === '[DONE]' || done) {
            reading = false;
          } else {
            const resultString = result.reduce((output: string, curr) => {
              if (typeof curr === 'string') {
                partial += curr;
              } else {
                const content = curr.choices[0]?.delta?.content ?? null;
                if (content) output += content;
              }
              return output;
            }, '');

            const updatedChats: ChatInterface[] = JSON.parse(
              JSON.stringify(useStore.getState().chats)
            );
            const updatedMessages = updatedChats[currentChatIndex].messages;
            updatedMessages[updatedMessages.length - 1].content += resultString;
            setChats(updatedChats);
            syncArtifacts(
              updatedChats[currentChatIndex].id,
              updatedMessages.length - 1,
              updatedMessages[updatedMessages.length - 1].content,
              false
            );
          }
        }
        if (useStore.getState().generating) {
          reader.cancel('Cancelled by user').catch(() => undefined);
        } else {
          reader.cancel('Generation completed').catch(() => undefined);
        }
        reader.releaseLock();
        stream.cancel().catch(() => undefined);
      }

      // finalize artifacts for the reply; the tab is only switched on completion
      const finishedNaturally = useStore.getState().generating;
      const finalChats = useStore.getState().chats;
      if (finalChats) {
        const chat = finalChats[currentChatIndex];
        const messageIndex = chat.messages.length - 1;
        syncArtifacts(
          chat.id,
          messageIndex,
          chat.messages[messageIndex].content,
          finishedNaturally
        );
      }

      // update tokens used in chatting
      const currChats = useStore.getState().chats;
      const countTotalTokens = useStore.getState().countTotalTokens;

      if (currChats && countTotalTokens) {
        const model = currChats[currentChatIndex].config.model;
        const messages = currChats[currentChatIndex].messages;
        updateTotalTokenUsed(
          model,
          messages.slice(0, -1),
          messages[messages.length - 1]
        );
      }

      // generate title for new chats
      if (
        useStore.getState().autoTitle &&
        currChats &&
        !currChats[currentChatIndex]?.titleSet
      ) {
        const messages_length = currChats[currentChatIndex].messages.length;
        const assistant_message =
          currChats[currentChatIndex].messages[messages_length - 1].content;
        const user_message =
          currChats[currentChatIndex].messages[messages_length - 2].content;

        const message: MessageInterface = {
          role: 'user',
          content: `Generate a title in less than 6 words for the following message (language: ${i18n.language}):\n"""\nUser: ${user_message}\nAssistant: ${assistant_message}\n"""`,
        };

        let title = (await generateTitle([message])).trim();
        if (title.startsWith('"') && title.endsWith('"')) {
          title = title.slice(1, -1);
        }
        const updatedChats: ChatInterface[] = JSON.parse(
          JSON.stringify(useStore.getState().chats)
        );
        updatedChats[currentChatIndex].title = title;
        updatedChats[currentChatIndex].titleSet = true;
        setChats(updatedChats);

        // update tokens used for generating title
        if (countTotalTokens) {
          const model = _defaultChatConfig.model;
          updateTotalTokenUsed(model, [message], {
            role: 'assistant',
            content: title,
          });
        }
      }
    } catch (e: unknown) {
      const err = (e as Error).message;
      if ((e as Error).name === 'AbortError') {
        logger.debug('generation aborted');
      } else {
        if (e instanceof TypeError) logger.warn('network error:', err);
        else logger.error('chat submit failed:', err);
        setError(err);
      }
    }
    useStore.getState().setHandoff(null);
    setGenerating(false);
  };

  return { handleSubmit, error };
};

export default useSubmit;
