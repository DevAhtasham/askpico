import React, { useState } from 'react';
import useStore from '@store/store';

const parseTags = (value: string): string[] =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const Scratchpad = () => {
  const items = useStore((state) => state.scratchpadItems);
  const addScratchpadItem = useStore((state) => state.addScratchpadItem);
  const deleteScratchpadItem = useStore((state) => state.deleteScratchpadItem);

  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [filter, setFilter] = useState<string>('');

  const save = () => {
    if (title.trim() === '' && body.trim() === '') return;
    addScratchpadItem({
      id: crypto.randomUUID(),
      title: title.trim() || 'Untitled',
      body: body.trim(),
      tags: parseTags(tagInput),
      createdAt: Date.now(),
    });
    setTitle('');
    setBody('');
    setTagInput('');
  };

  const query = filter.trim().toLowerCase();
  const visible = query
    ? items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.body.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    : items;

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-col gap-2 rounded-2xl border border-surface-line bg-white p-4'>
        <input
          className='rounded-lg border border-surface-line px-3 py-2 text-sm'
          placeholder='Title'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className='min-h-[100px] rounded-lg border border-surface-line px-3 py-2 text-sm'
          placeholder='Notes, links, ya clipboard text'
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <input
          className='rounded-lg border border-surface-line px-3 py-2 text-sm'
          placeholder='Tags (comma separated)'
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
        />
        <button className='btn btn-primary self-end' onClick={save}>
          Save
        </button>
      </div>

      <input
        className='rounded-lg border border-surface-line px-3 py-2 text-sm'
        placeholder='Search title, notes, tags'
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <ul className='flex flex-col gap-2'>
        {visible.map((item) => (
          <li key={item.id} className='rounded-xl border border-surface-line bg-white p-3'>
            <div className='flex items-start justify-between gap-2'>
              <span className='font-medium text-ink'>{item.title}</span>
              <button
                className='text-xs text-ink-muted hover:text-red-600'
                onClick={() => deleteScratchpadItem(item.id)}
                aria-label={`delete ${item.title}`}
              >
                Delete
              </button>
            </div>
            {item.body && (
              <p className='mt-1 whitespace-pre-wrap text-sm text-ink-soft'>{item.body}</p>
            )}
            {item.tags.length > 0 && (
              <div className='mt-2 flex flex-wrap gap-1'>
                {item.tags.map((tag) => (
                  <span key={tag} className='rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700'>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Scratchpad;
