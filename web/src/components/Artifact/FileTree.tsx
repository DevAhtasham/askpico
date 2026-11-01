import React, { useState } from 'react';

import { TreeNode } from '@utils/artifactTree';

const BADGES: Record<string, { label: string; className: string }> = {
  tsx: { label: 'TSX', className: 'text-sky-600' },
  ts: { label: 'TS', className: 'text-blue-600' },
  jsx: { label: 'JSX', className: 'text-cyan-600' },
  js: { label: 'JS', className: 'text-amber-600' },
  css: { label: 'CSS', className: 'text-pink-600' },
  json: { label: '{}', className: 'text-yellow-600' },
  html: { label: '<>', className: 'text-orange-600' },
  md: { label: 'MD', className: 'text-ink-muted' },
};

const FileBadge = ({ name }: { name: string }) => {
  const ext = name.includes('.') ? (name.split('.').pop() ?? '').toLowerCase() : '';
  const badge = BADGES[ext] ?? {
    label: ext.slice(0, 3).toUpperCase() || 'FILE',
    className: 'text-ink-muted',
  };
  return (
    <span
      className={`w-7 shrink-0 text-center font-mono text-[9px] font-bold ${badge.className}`}
    >
      {badge.label}
    </span>
  );
};

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    className={`h-3 w-3 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
  >
    <path d='M9 6l6 6-6 6' />
  </svg>
);

const FolderIcon = () => (
  <svg
    viewBox='0 0 24 24'
    fill='currentColor'
    className='h-3.5 w-3.5 shrink-0 text-amber-500'
  >
    <path d='M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' />
  </svg>
);

const FileTree = ({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: TreeNode[];
  selectedId: string;
  onSelect: (artifactId: string) => void;
}) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const renderNodes = (list: TreeNode[], depth: number): React.ReactNode =>
    list.map((node) => {
      const indent = { paddingLeft: `${8 + depth * 14}px` };

      if (node.children.length > 0) {
        const open = !collapsed[node.path];
        return (
          <div key={node.path}>
            <button
              type='button'
              style={indent}
              onClick={() =>
                setCollapsed((prev) => ({ ...prev, [node.path]: open }))
              }
              className='flex w-full items-center gap-1.5 py-1 pr-2 text-left text-xs text-ink-soft hover:bg-white'
            >
              <Chevron open={open} />
              <FolderIcon />
              <span className='truncate'>{node.name}</span>
            </button>
            {open && renderNodes(node.children, depth + 1)}
          </div>
        );
      }

      const active = node.file?.id === selectedId;
      return (
        <button
          key={node.path}
          type='button'
          style={indent}
          disabled={!node.file}
          onClick={() => node.file && onSelect(node.file.id)}
          className={`flex w-full items-center gap-1.5 py-1 pr-2 text-left text-xs transition-colors ${
            active ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-white'
          }`}
        >
          <span className='w-3 shrink-0' />
          <FileBadge name={node.name} />
          <span className='truncate font-mono'>{node.name}</span>
        </button>
      );
    });

  return <div className='py-1'>{renderNodes(nodes, 0)}</div>;
};

export default FileTree;
