import { AgentToolId } from '@constants/agents';

export const toolKeywords: Partial<Record<AgentToolId, string[]>> = {
  pomodoro: ['pomodoro', 'timer', 'focus timer', 'break'],
  scratchpad: ['note', 'notes', 'scratchpad', 'clipboard'],
  reminders: ['reminder', 'alarm', 'remind'],
  focus_mode: ['focus', 'fullscreen', 'distraction'],
  weather: ['weather', 'mausam', 'temperature', 'rain'],
  live_time: ['time', 'clock', 'timezone', 'waqt'],
  currency: ['currency', 'rate', 'dollar', 'usd', 'pkr', 'crypto', 'bitcoin', 'gold'],
  unit_converter: ['convert', 'unit', 'kg', 'meter', 'celsius', 'fahrenheit'],
  text_diff: ['diff', 'compare', 'difference'],
  json_formatter: ['json'],
  markdown_html: ['markdown', 'html'],
  network_speed: ['speed', 'internet', 'mbps', 'wifi'],
  wiki: ['wiki', 'biology', 'gk', 'general knowledge', 'summary'],
  pubchem: ['chemistry', 'chemical', 'compound', 'molecule'],
  physics: ['physics', 'formula', 'constant', 'ohm', 'force', 'energy', 'velocity'],
  freelance_rate: ['freelance', 'hourly', 'upwork', 'fiverr'],
  image_converter: ['png', 'jpg', 'jpeg', 'webp', 'convert image'],
  image_resizer: ['resize', 'dimension', 'image size'],
  color_palette: ['color', 'colour', 'palette', 'rang'],
  regex_tester: ['regex', 'regular expression', 'pattern'],
  xml_formatter: ['xml'],
  sql_formatter: ['sql', 'query', 'select'],
  lesson_plan: ['lesson', 'teach', 'class plan'],
  quiz: ['quiz', 'mcq', 'questions'],
  roman_cleanup: ['roman', 'urdu', 'spelling', 'clean'],
  formal_email: ['email', 'mail', 'formal'],
  prompt_enhancer: ['prompt', 'enhance'],
  cv_cover_letter: ['cv', 'resume', 'cover letter', 'job'],
  document_maker: ['document', 'letter', 'application', 'leave'],
  stock_search: ['stock', 'photo', 'pexels', 'pixabay'],
  barcode: ['barcode', 'code128'],
  qr_code: ['qr', 'qr code'],
  qr_scanner: ['scan qr', 'qr scanner', 'read qr', 'camera'],
  pdf_merge: ['merge', 'combine pdf'],
  pdf_split: ['split', 'extract pages', 'page range'],
  pdf_to_jpg: ['pdf to jpg', 'pdf to image', 'pdf image'],
  scan_to_pdf: ['scan', 'images to pdf', 'jpg to pdf', 'png to pdf'],
  markdown_pdf: ['markdown pdf', 'md to pdf', 'export pdf'],
};

export const routeToolQuery = (query: string, candidates: AgentToolId[]): AgentToolId[] => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const scored = candidates
    .map((tool) => {
      const keywords = toolKeywords[tool] ?? [];
      const score = keywords.filter((keyword) => normalized.includes(keyword)).length;
      return { tool, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((item) => item.tool);
};
