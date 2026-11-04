const KEYWORDS = [
  'SELECT', 'DISTINCT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
  'UNION ALL', 'UNION', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
  'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN', 'LEFT JOIN', 'RIGHT JOIN',
  'INNER JOIN', 'CROSS JOIN', 'JOIN', 'ON', 'AND', 'OR', 'AS', 'IN', 'NOT', 'NULL', 'IS',
  'LIKE', 'BETWEEN', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'WITH', 'CREATE TABLE',
  'ALTER TABLE', 'DROP TABLE', 'EXISTS', 'DESC', 'ASC',
];

const LINE_BREAK_BEFORE = new Set([
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
  'UNION', 'UNION ALL', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
  'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN', 'LEFT JOIN', 'RIGHT JOIN',
  'INNER JOIN', 'CROSS JOIN', 'JOIN',
]);

const keywordPattern = new RegExp(
  `\\b(${[...KEYWORDS]
    .sort((a, b) => b.length - a.length)
    .map((k) => k.split(' ').join('\\s+'))
    .join('|')})\\b`,
  'gi'
);

const normalizeKeyword = (match: string) => match.replace(/\s+/g, ' ').toUpperCase();

// Splits on quoted string literals so their content is never altered.
const mapOutsideStrings = (sql: string, fn: (segment: string) => string) =>
  sql
    .split(/('(?:[^']|'')*')/)
    .map((part, i) => (i % 2 === 1 ? part : fn(part)))
    .join('');

// Splits on commas that are outside parentheses and string literals.
const splitTopLevelCommas = (text: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let inString = false;
  let current = '';
  for (const ch of text) {
    if (ch === "'") inString = !inString;
    if (!inString && ch === '(') depth += 1;
    if (!inString && ch === ')') depth -= 1;
    if (!inString && depth === 0 && ch === ',') {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current.trim());
  return parts;
};

const breakSelectColumns = (sql: string, indent: string): string =>
  sql
    .split('\n')
    .map((line) => {
      const match = line.trim().match(/^(SELECT(?:\s+DISTINCT)?)\s+(.*)$/i);
      if (!match) return line;
      const columns = splitTopLevelCommas(match[2]);
      if (columns.length < 2) return line;
      return [
        match[1].toUpperCase(),
        ...columns.map((column, i) => `${indent}${column}${i < columns.length - 1 ? ',' : ''}`),
      ].join('\n');
    })
    .join('\n');

export const formatSql = (sql: string, indent = '  '): string => {
  const formatted = mapOutsideStrings(sql, (segment) =>
    segment
      .replace(/\s+/g, ' ')
      .replace(keywordPattern, (match) => {
        const keyword = normalizeKeyword(match);
        if (LINE_BREAK_BEFORE.has(keyword)) return `\n${keyword}`;
        if (keyword === 'AND' || keyword === 'OR') return `\n${indent}${keyword}`;
        return keyword;
      })
  );
  return breakSelectColumns(formatted.replace(/\n\s*\n/g, '\n').trim(), indent);
};

export const minifySql = (sql: string): string =>
  mapOutsideStrings(sql, (segment) => segment.replace(/\s+/g, ' ')).trim();
