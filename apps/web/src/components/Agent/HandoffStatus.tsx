import React from 'react';
import useStore from '@store/store';
import { agents } from '@constants/agents';
import type { HandoffStage } from '@store/agent-slice';

const STAGE_POSITION: Record<HandoffStage, number> = {
  routing: 0,
  delegating: 1,
  working: 1,
  returning: 2,
};

const STAGE_TEXT: Record<HandoffStage, (agentName: string) => string> = {
  routing: () => 'Pico sochta hai kis ko bhejna hai...',
  delegating: (name) => `${name} ke paas bheja ja raha hai...`,
  working: (name) => `${name} jawab tayyar kar raha hai...`,
  returning: () => 'Pico ke paas wapis aa raha hai...',
};

const HandoffStatus = () => {
  const handoff = useStore((state) => state.handoff);
  if (!handoff) return null;

  const agent = agents.find((a) => a.id === handoff.agentId);
  const agentName = agent?.name ?? 'Specialist';
  const position = STAGE_POSITION[handoff.stage];
  const nodes = ['Pico', agentName, 'Pico'];

  return (
    <div
      role='status'
      aria-live='polite'
      className='flex flex-col items-center gap-2 border-b border-surface-line bg-surface-muted px-4 py-3 text-xs text-ink-soft'
    >
      <div className='flex items-center gap-2'>
        {nodes.map((label, index) => {
          const reached = index <= position;
          const active = index === position;
          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <span
                  className={`h-0.5 w-8 rounded-full transition-colors duration-500 ${
                    reached ? 'bg-ink-soft' : 'bg-surface-line'
                  } ${active ? 'animate-pulse' : ''}`}
                />
              )}
              <span
                className={`rounded-full px-3 py-1 font-medium transition-all duration-500 ${
                  reached ? 'bg-white text-ink shadow-soft' : 'text-ink-muted'
                } ${active ? 'animate-pulse' : ''}`}
              >
                {label}
              </span>
            </React.Fragment>
          );
        })}
      </div>
      <p>{STAGE_TEXT[handoff.stage](agentName)}</p>
    </div>
  );
};

export default HandoffStatus;
