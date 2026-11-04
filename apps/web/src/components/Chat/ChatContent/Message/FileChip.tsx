import React from 'react';

const FILE_STYLES: Record<string, { label: string; color: string }> = {
  '.pdf': { label: 'PDF', color: 'bg-red-500' },
  '.doc': { label: 'DOC', color: 'bg-blue-600' },
  '.docx': { label: 'DOCX', color: 'bg-blue-600' },
  '.xls': { label: 'XLS', color: 'bg-emerald-600' },
  '.xlsx': { label: 'XLSX', color: 'bg-emerald-600' },
  '.csv': { label: 'CSV', color: 'bg-emerald-600' },
  '.ppt': { label: 'PPT', color: 'bg-orange-500' },
  '.pptx': { label: 'PPTX', color: 'bg-orange-500' },
  '.txt': { label: 'TXT', color: 'bg-gray-500' },
  '.md': { label: 'MD', color: 'bg-gray-500' },
  '.json': { label: 'JSON', color: 'bg-amber-500' },
  '.zip': { label: 'ZIP', color: 'bg-yellow-600' },
};

const FileChip = ({ name, ext }: { name: string; ext: string }) => {
  const style = FILE_STYLES[ext] ?? {
    label: ext ? ext.slice(1).toUpperCase() : 'FILE',
    color: 'bg-ink-soft',
  };

  return (
    <div className='flex max-w-full items-center gap-3 rounded-xl border border-surface-line bg-white px-3 py-2 shadow-soft'>
      <span
        className={`flex h-10 min-w-[2.5rem] shrink-0 items-center justify-center rounded-md px-1 text-[10px] font-semibold text-white ${style.color}`}
      >
        {style.label}
      </span>
      <span className='min-w-0 truncate text-sm text-ink'>{name}</span>
    </div>
  );
};

export default FileChip;
