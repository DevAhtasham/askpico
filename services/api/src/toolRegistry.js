// Single source of truth for every tool the agents can use.
// location: 'backend' (server adapter), 'external' (3rd-party API via backend), 'browser' (runs in the user's browser).
// extensions: attachment types this tool accepts. Empty means the tool is chosen by text only.
export const toolRegistry = [
  {
    id: 'pdf-to-png',
    agent: 'office',
    location: 'browser',
    extensions: ['.pdf'],
    description: 'Convert PDF pages into PNG images (one file, or a ZIP for several pages).',
  },
  {
    id: 'weather',
    agent: 'live',
    location: 'external',
    extensions: [],
    params: '{"city": "city name in English"}',
    description: 'Current weather for a city.',
  },
  {
    id: 'currency',
    agent: 'live',
    location: 'external',
    extensions: [],
    params: '{"base": "3-letter ISO code, e.g. USD"}',
    description: 'Currency exchange rates for a base currency.',
  },
  {
    id: 'crypto',
    agent: 'live',
    location: 'external',
    extensions: [],
    params: '{}',
    description: 'Latest prices of bitcoin, ethereum and solana.',
  },
  {
    id: 'wiki',
    agent: 'study',
    location: 'external',
    extensions: [],
    params: '{"topic": "topic in English"}',
    description: 'Wikipedia summary for a topic.',
  },
  {
    id: 'pubchem',
    agent: 'study',
    location: 'external',
    extensions: [],
    params: '{"name": "compound name in English"}',
    description: 'Chemical compound formula and molecular weight from PubChem.',
  },
  {
    id: 'stock',
    agent: 'creative',
    location: 'external',
    extensions: [],
    params: '{"query": "search words in English"}',
    description: 'Stock photos from Pexels and Pixabay.',
  },
];

export const externalTools = toolRegistry.filter((tool) => tool.location === 'external');

export const toolsForExtensions = (extensions) =>
  toolRegistry.filter((tool) => tool.extensions.some((ext) => extensions.includes(ext)));
