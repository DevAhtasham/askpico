import { logger } from '@utils/logger';

const STORAGE_KEY = 'artifactState';
const INACTIVE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CHARS_PER_CHAT = 200_000;

type ChatState = { updatedAt: number; data: Record<string, string> };
type StateMap = Record<string, ChatState>;

const readMap = (): StateMap => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as StateMap;
  } catch {
    return {};
  }
};

const writeMap = (map: StateMap) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    logger.warn('artifact state write failed', err);
  }
};

export const pruneArtifactState = (now = Date.now()) => {
  const map = readMap();
  const expired = Object.keys(map).filter((id) => now - map[id].updatedAt > INACTIVE_TTL_MS);
  if (expired.length === 0) return;
  expired.forEach((id) => delete map[id]);
  writeMap(map);
};

export const loadArtifactState = (chatId: string): Record<string, string> => {
  pruneArtifactState();
  const map = readMap();
  const entry = map[chatId];
  if (!entry) return {};
  entry.updatedAt = Date.now();
  writeMap(map);
  return entry.data;
};

export const setArtifactStateItem = (chatId: string, key: string, value: string | null) => {
  const map = readMap();
  const entry = map[chatId] ?? { updatedAt: 0, data: {} };
  if (value === null) delete entry.data[key];
  else entry.data[key] = value;
  if (JSON.stringify(entry.data).length > MAX_CHARS_PER_CHAT) {
    logger.warn(`artifact state for chat ${chatId} exceeds ${MAX_CHARS_PER_CHAT} chars; write skipped`);
    return;
  }
  entry.updatedAt = Date.now();
  map[chatId] = entry;
  writeMap(map);
};

export const clearArtifactState = (chatId: string) => {
  const map = readMap();
  if (!(chatId in map)) return;
  delete map[chatId];
  writeMap(map);
};
