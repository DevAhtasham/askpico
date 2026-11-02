import { geminiImageProvider } from './gemini.js';
import { nanobananaImageProvider } from './nanobanana.js';

const registry = {
  [geminiImageProvider.id]: geminiImageProvider,
  [nanobananaImageProvider.id]: nanobananaImageProvider,
};

export const getImageProvider = (name) => {
  if (typeof name !== 'string' || !Object.hasOwn(registry, name)) return null;
  const provider = registry[name];
  return provider.isConfigured() ? provider : null;
};

export const listConfiguredImageProviders = () =>
  Object.values(registry)
    .filter((provider) => provider.isConfigured())
    .map(({ id, label }) => ({ id, label }));
