import React, { useState } from 'react';
import { askAgent } from '@api/tools';
import { markdownToHtml, printHtmlAsPdf } from '@utils/printDocument';
import { markdownToDocxBlob } from '@utils/docx';

export interface AgentTaskProps {
  placeholder: string;
  instruction: string;
  submitLabel: string;
  downloadName?: string;
}

const AgentTask = ({
  placeholder,
  instruction,
  submitLabel,
  downloadName,
  agentId,
}: AgentTaskProps & { agentId: string }) => {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const downloadDocx = async () => {
    const blob = await markdownToDocxBlob(output);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(downloadName ?? 'document').replace(/\.[^.]+$/, '')}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const run = async () => {
    if (input.trim() === '') return;
    setBusy(true);
    setError('');
    try {
      setOutput(await askAgent(agentId, `${instruction}\n\n"""\n${input.trim()}\n"""`));
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName ?? 'output.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='flex flex-col gap-3 text-sm'>
      <textarea
        aria-label='task input'
        className='min-h-[120px] rounded-lg border border-surface-line px-3 py-2'
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className='flex gap-2'>
        <button className='btn btn-primary' onClick={run} disabled={busy || input.trim() === ''}>
          {busy ? 'Working...' : submitLabel}
        </button>
        {output && (
          <button className='btn btn-neutral' onClick={download}>
            Download
          </button>
        )}
        {output && (
          <button
            className='btn btn-neutral'
            onClick={() => {
              if (!printHtmlAsPdf(downloadName ?? 'document', markdownToHtml(output)))
                setError('Popup block hai. Is site ke liye popups allow karein.');
            }}
          >
            Export PDF
          </button>
        )}
        {output && (
          <button className='btn btn-neutral' onClick={() => downloadDocx().catch((e: Error) => setError(e.message))}>
            Download DOCX
          </button>
        )}
      </div>
      {error && <p className='text-red-600'>{error}</p>}
      {output && (
        <pre className='max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-surface-line bg-white p-3 font-sans text-sm'>
          {output}
        </pre>
      )}
    </div>
  );
};

export default AgentTask;
