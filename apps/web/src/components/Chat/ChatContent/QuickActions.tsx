import React from 'react';
import useDraftStore from '@store/draft-store';
import { BulbIcon, CheckSquareIcon, LayersIcon } from '@icon/ui';

const actions = [
  {
    title: 'Synthesize Data',
    subtitle: 'Turn my meeting notes into 5 key bullet points for the team.',
    icon: <LayersIcon className='h-3 w-3' />,
    prompt: 'Turn my meeting notes into 5 key bullet points for the team.',
  },
  {
    title: 'Creative Brainstorm',
    subtitle: 'Generate 3 taglines for a new sustainable fashion brand.',
    icon: <BulbIcon className='h-3 w-3' />,
    prompt: 'Generate 3 taglines for a new sustainable fashion brand.',
  },
  {
    title: 'Check Facts',
    subtitle: 'Compare key differences between GDPR and CCPA.',
    icon: <CheckSquareIcon className='h-3 w-3' />,
    prompt: 'Compare key differences between GDPR and CCPA.',
  },
];

const QuickActions = () => {
  const setContent = useDraftStore((state) => state.setContent);

  return (
    <div className='mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-3'>
      {actions.map((a) => (
        <button
          key={a.title}
          className='group flex flex-col rounded-xl border border-surface-line bg-white p-2.5 text-left shadow-soft transition-all hover:border-brand-200 hover:shadow-card'
          onClick={() => setContent(a.prompt)}
        >
          <div className='mb-1.5 flex h-5 w-5 items-center justify-center rounded-md bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100'>
            {a.icon}
          </div>
          <div className='text-xs font-semibold text-ink'>{a.title}</div>
          <div className='mt-0.5 text-[11px] leading-4 text-ink-muted'>
            {a.subtitle}
          </div>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
