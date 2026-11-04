import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const baseDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = join(baseDir, 'node_modules', '.cache', 'pico');
mkdirSync(cacheDir, { recursive: true });

const oldDbPath = join(baseDir, 'data', 'agents.db');
const newDbPath = join(cacheDir, 'agents.db');
if (existsSync(oldDbPath) && !existsSync(newDbPath)) {
  try {
    copyFileSync(oldDbPath, newDbPath);
  } catch {
    // ignore copy error
  }
}

const db = new DatabaseSync(newDbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS agent_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anon_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_agent_messages_lookup
    ON agent_messages (anon_id, agent_id, id);
`);

const agentColumns = db.prepare('PRAGMA table_info(agent_messages)').all().map((c) => c.name);
if (!agentColumns.includes('chat_id')) {
  db.exec("ALTER TABLE agent_messages ADD COLUMN chat_id TEXT NOT NULL DEFAULT ''");
}
if (!agentColumns.includes('turn')) {
  db.exec('ALTER TABLE agent_messages ADD COLUMN turn INTEGER NOT NULL DEFAULT -1');
}
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_agent_messages_chat
    ON agent_messages (anon_id, chat_id, turn);
`);

const insertStatement = db.prepare(
  'INSERT INTO agent_messages (anon_id, agent_id, chat_id, turn, role, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
);
const recentStatement = db.prepare(
  'SELECT role, content FROM agent_messages WHERE anon_id = ? AND agent_id = ? AND chat_id = ? ORDER BY id DESC LIMIT ?'
);
const truncateStatement = db.prepare(
  'DELETE FROM agent_messages WHERE anon_id = ? AND chat_id = ? AND turn >= ?'
);

export const saveAgentMessages = (anonId, agentId, chatId, turn, messages) => {
  const now = Date.now();
  for (const message of messages) {
    insertStatement.run(anonId, agentId, chatId, turn, message.role, message.content, now);
  }
};

export const recentAgentMessages = (anonId, agentId, chatId, limit) =>
  recentStatement.all(anonId, agentId, chatId, limit).reverse();

export const truncateAgentMessages = (anonId, chatId, fromTurn) => {
  truncateStatement.run(anonId, chatId, fromTurn);
};
