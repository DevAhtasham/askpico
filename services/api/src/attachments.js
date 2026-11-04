import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
const EXTRACT_TEXT_CHAR_LIMIT = 60000;

const PDF_EXT = '.pdf';
const DOCX_EXT = '.docx';

const extensionOf = (name) => {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
};

const looksBinary = (buffer) => buffer.subarray(0, 8000).includes(0);

export const extractAttachmentText = async (name, buffer) => {
  const ext = extensionOf(name);

  if (ext === PDF_EXT) {
    const data = await pdfParse(buffer);
    return data.text.trim();
  }

  if (ext === DOCX_EXT) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (looksBinary(buffer)) {
    throw new Error(`${name} is a binary file type that cannot be read as text yet`);
  }
  return buffer.toString('utf8').trim();
};

export const truncateForModel = (text) =>
  text.length > EXTRACT_TEXT_CHAR_LIMIT
    ? `${text.slice(0, EXTRACT_TEXT_CHAR_LIMIT)}\n...[truncated]`
    : text;
