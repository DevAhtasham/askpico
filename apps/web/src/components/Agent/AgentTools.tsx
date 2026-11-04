import React, { useState } from 'react';
import { agents, AgentToolId } from '@constants/agents';
import PomodoroTimer from './PomodoroTimer';
import Scratchpad from './Scratchpad';
import Reminders from './Reminders';
import FocusMode from './FocusMode';
import LiveWeather from './LiveWeather';
import LiveTime from './LiveTime';
import LiveCurrency from './LiveCurrency';
import UnitConverter from './UnitConverter';
import TextDiff from './TextDiff';
import JsonFormatter from './JsonFormatter';
import MarkdownToHtml from './MarkdownToHtml';
import NetworkSpeed from './NetworkSpeed';
import StudyLookup from './StudyLookup';
import Physics from './Physics';
import FreelanceRate from './FreelanceRate';
import ImageConverter from './ImageConverter';
import ImageResizer from './ImageResizer';
import ColorPalette from './ColorPalette';
import RegexTester from './RegexTester';
import XmlFormatter from './XmlFormatter';
import AgentTask, { AgentTaskProps } from './AgentTask';
import SqlFormatter from './SqlFormatter';
import StockSearch from './StockSearch';
import Barcode from './Barcode';
import QrGenerator from './QrGenerator';
import PdfMerge from './PdfMerge';
import ScanToPdf from './ScanToPdf';
import QrScanner from './QrScanner';
import PdfSplit from './PdfSplit';
import PdfToJpg from './PdfToJpg';
import MarkdownToPdf from './MarkdownToPdf';
import { routeToolQuery } from '@utils/toolRouter';

const agentTasks: Partial<Record<AgentToolId, AgentTaskProps>> = {
  lesson_plan: {
    placeholder: 'Topic, class level, aur time (e.g. Photosynthesis, Class 8, 40 min)',
    instruction:
      'Make a structured lesson plan: objectives, materials, step-by-step activities with timings, and a short assessment.',
    submitLabel: 'Generate lesson plan',
    downloadName: 'lesson-plan.txt',
  },
  quiz: {
    placeholder: 'Paste the text or notes to make a quiz from',
    instruction:
      'Create 5 multiple-choice questions from the text below with 4 options each, then list the correct answers at the end.',
    submitLabel: 'Generate quiz',
    downloadName: 'quiz.txt',
  },
  roman_cleanup: {
    placeholder: 'Roman Urdu text paste karein',
    instruction:
      'Rewrite this Roman Urdu text in clean, standard Roman Urdu. Expand chat shorthand (e.g. nhi -> nahi, kl -> kal, mjhe -> mujhe, sik -> sick), fix spelling and spacing, add proper punctuation and capitalization, and keep the same meaning. Return only the cleaned text, with no explanation.',
    submitLabel: 'Clean up',
    downloadName: 'cleaned.txt',
  },
  formal_email: {
    placeholder: 'Roman Urdu mein email ka mafhoom likhein',
    instruction:
      'Convert the following Roman Urdu message into a polite, formal English email with a subject line. Return only the email.',
    submitLabel: 'Write formal email',
    downloadName: 'email.txt',
  },
  prompt_enhancer: {
    placeholder: 'Ek sentence ka prompt likhein',
    instruction:
      'Rewrite this single-sentence request as a clear, detailed prompt with context, constraints, and expected output format. Return only the improved prompt.',
    submitLabel: 'Enhance prompt',
    downloadName: 'prompt.txt',
  },
  cv_cover_letter: {
    placeholder: 'Apna naam, experience, skills, aur job ki details likhein',
    instruction:
      'Create a professional CV summary and a cover letter from the details below. Use clear headings, bullet points for achievements, and a placeholder for missing information. Return the CV first, then the cover letter.',
    submitLabel: 'Create CV & cover letter',
    downloadName: 'cv-cover-letter.txt',
  },
  document_maker: {
    placeholder: 'Document ki type aur details likhein (e.g. leave application for 2 days fever)',
    instruction:
      'Write a complete, well-formatted formal document based on the request below, with a title, date placeholder, and signature block. Return only the document.',
    submitLabel: 'Create document',
    downloadName: 'document.txt',
  },
};

const toolLabels: Record<AgentToolId, string> = {
  pomodoro: 'Pomodoro',
  scratchpad: 'Scratchpad',
  reminders: 'Reminders',
  focus_mode: 'Focus Mode',
  weather: 'Weather',
  live_time: 'Live Time',
  currency: 'Currency & Crypto',
  unit_converter: 'Unit Converter',
  text_diff: 'Text Diff',
  json_formatter: 'JSON Formatter',
  markdown_html: 'Markdown to HTML',
  network_speed: 'Network Speed',
  wiki: 'Biology & GK',
  pubchem: 'Chemistry',
  physics: 'Physics',
  freelance_rate: 'Freelance Rate',
  image_converter: 'Image Converter',
  image_resizer: 'Image Resizer',
  color_palette: 'Color Palette',
  regex_tester: 'Regex Tester',
  xml_formatter: 'XML Formatter',
  lesson_plan: 'Lesson Plan',
  quiz: 'Quiz',
  roman_cleanup: 'Roman Urdu Clean-up',
  formal_email: 'Formal Email',
  prompt_enhancer: 'Prompt Enhancer',
  document_maker: 'Document Maker',
  cv_cover_letter: 'CV & Cover Letter',
  sql_formatter: 'SQL Formatter',
  stock_search: 'Stock Photos',
  barcode: 'Barcode Generator',
  qr_code: 'QR Generator',
  pdf_merge: 'PDF Merge',
  scan_to_pdf: 'Images to PDF',
  qr_scanner: 'QR Scanner',
  pdf_split: 'PDF Split',
  pdf_to_jpg: 'PDF to JPG',
  markdown_pdf: 'Markdown to PDF',
};

const AgentTools = () => {
  const [activeTool, setActiveTool] = useState<AgentToolId | null>(null);
  const [query, setQuery] = useState<string>('');

  const allTools = [...new Set(agents.flatMap((a) => a.tools))];
  const current = activeTool ?? allTools[0];
  const owner = current ? agents.find((a) => a.tools.includes(current)) : undefined;
  const matches = routeToolQuery(query, allTools);
  const ownerOf = (tool: AgentToolId) => agents.find((a) => a.tools.includes(tool));

  const openTool = (tool: AgentToolId) => {
    setActiveTool(tool);
    setQuery('');
  };

  if (!current || !owner) return null;

  return (
    <div className='flex max-h-[45%] flex-col gap-2 overflow-y-auto border-b border-surface-line bg-surface-muted px-4 py-3'>
      <input
        aria-label='tool search'
        className='rounded-lg border border-surface-line bg-white px-3 py-1.5 text-sm'
        placeholder='Tool dhoondein (e.g. pdf merge, qr, sql)'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query.trim() !== '' && (
        <div className='flex flex-wrap gap-2'>
          {matches.slice(0, 6).map((tool) => (
            <button
              key={tool}
              className='rounded-full bg-white px-3 py-1 text-xs shadow-soft'
              onClick={() => openTool(tool)}
            >
              {toolLabels[tool]}
            </button>
          ))}
          {matches.length === 0 && <span className='text-xs text-gray-500'>Koi tool nahi mila.</span>}
        </div>
      )}
      <div className='flex flex-wrap gap-2'>
        {allTools.map((tool) => (
          <button
            key={tool}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              tool === current ? 'bg-white text-ink shadow-soft' : 'text-ink-soft hover:text-ink'
            }`}
            onClick={() => setActiveTool(tool)}
          >
            {toolLabels[tool]}
          </button>
        ))}
      </div>
      {current === 'pomodoro' && <PomodoroTimer />}
      {current === 'scratchpad' && <Scratchpad />}
      {current === 'reminders' && <Reminders />}
      {current === 'focus_mode' && <FocusMode />}
      {current === 'weather' && <LiveWeather />}
      {current === 'live_time' && <LiveTime />}
      {current === 'currency' && <LiveCurrency />}
      {current === 'unit_converter' && <UnitConverter />}
      {current === 'text_diff' && <TextDiff />}
      {current === 'json_formatter' && <JsonFormatter />}
      {current === 'markdown_html' && <MarkdownToHtml />}
      {current === 'network_speed' && <NetworkSpeed />}
      {current === 'wiki' && <StudyLookup mode='wiki' />}
      {current === 'pubchem' && <StudyLookup mode='pubchem' />}
      {current === 'physics' && <Physics />}
      {current === 'freelance_rate' && <FreelanceRate />}
      {current === 'image_converter' && <ImageConverter />}
      {current === 'image_resizer' && <ImageResizer />}
      {current === 'color_palette' && <ColorPalette />}
      {current === 'regex_tester' && <RegexTester />}
      {current === 'xml_formatter' && <XmlFormatter />}
      {current === 'sql_formatter' && <SqlFormatter />}
      {current === 'stock_search' && <StockSearch />}
      {current === 'barcode' && <Barcode />}
      {current === 'qr_code' && <QrGenerator />}
      {current === 'pdf_merge' && <PdfMerge />}
      {current === 'scan_to_pdf' && <ScanToPdf />}
      {current === 'qr_scanner' && <QrScanner />}
      {current === 'pdf_split' && <PdfSplit />}
      {current === 'pdf_to_jpg' && <PdfToJpg />}
      {current === 'markdown_pdf' && <MarkdownToPdf />}
      {agentTasks[current] && <AgentTask {...agentTasks[current]!} agentId={owner.id} />}
    </div>
  );
};

export default AgentTools;
