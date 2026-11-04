export type AgentId =
  | 'study'
  | 'doctor'
  | 'business'
  | 'career'
  | 'hacker'
  | 'creative'
  | 'office'
  | 'studio'
  | 'lock_in'
  | 'live';

export type AgentToolId =
  | 'pomodoro'
  | 'scratchpad'
  | 'reminders'
  | 'focus_mode'
  | 'weather'
  | 'live_time'
  | 'currency'
  | 'unit_converter'
  | 'text_diff'
  | 'json_formatter'
  | 'markdown_html'
  | 'network_speed'
  | 'wiki'
  | 'pubchem'
  | 'physics'
  | 'freelance_rate'
  | 'image_converter'
  | 'image_resizer'
  | 'color_palette'
  | 'regex_tester'
  | 'xml_formatter'
  | 'lesson_plan'
  | 'quiz'
  | 'roman_cleanup'
  | 'formal_email'
  | 'prompt_enhancer'
  | 'document_maker'
  | 'cv_cover_letter'
  | 'sql_formatter'
  | 'stock_search'
  | 'barcode'
  | 'qr_code'
  | 'pdf_merge'
  | 'scan_to_pdf'
  | 'qr_scanner'
  | 'pdf_split'
  | 'pdf_to_jpg'
  | 'markdown_pdf';

export interface AgentInterface {
  id: AgentId;
  name: string;
  persona: string;
  tools: AgentToolId[];
}

export const agents: AgentInterface[] = [
  {
    id: 'study',
    name: 'Study Agent',
    persona: 'Academic Assistant',
    tools: ['wiki', 'pubchem', 'physics', 'lesson_plan', 'quiz'],
  },
  { id: 'doctor', name: 'Doctor Agent', persona: 'Health Advisor', tools: [] },
  { id: 'business', name: 'Business Agent', persona: 'Finance Advisor', tools: ['freelance_rate', 'barcode', 'qr_code', 'qr_scanner'] },
  {
    id: 'career',
    name: 'Career Agent',
    persona: 'Career Coach',
    tools: ['roman_cleanup', 'formal_email', 'prompt_enhancer', 'cv_cover_letter'],
  },
  {
    id: 'hacker',
    name: 'Hacker Agent',
    persona: 'Dev Toolkit',
    tools: [
      'unit_converter',
      'text_diff',
      'json_formatter',
      'markdown_html',
      'network_speed',
      'regex_tester',
      'xml_formatter',
      'sql_formatter',
      'markdown_pdf',
    ],
  },
  {
    id: 'creative',
    name: 'Creative Agent',
    persona: 'Design Studio',
    tools: ['image_converter', 'image_resizer', 'color_palette', 'stock_search'],
  },
  {
    id: 'office',
    name: 'Office Agent',
    persona: 'Document Desk',
    tools: ['document_maker', 'pdf_merge', 'pdf_split', 'pdf_to_jpg', 'scan_to_pdf'],
  },
  {
    id: 'studio',
    name: 'Studio Agent',
    persona: 'Media Studio',
    tools: [],
  },
  {
    id: 'lock_in',
    name: 'Lock In Agent',
    persona: 'Productivity Coach',
    tools: ['pomodoro', 'scratchpad', 'reminders', 'focus_mode'],
  },
  {
    id: 'live',
    name: 'Live Agent',
    persona: 'Live Desk',
    tools: ['weather', 'live_time', 'currency'],
  },
];
