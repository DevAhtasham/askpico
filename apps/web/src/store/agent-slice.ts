import { StoreSlice } from './store';

export type HandoffStage = 'routing' | 'delegating' | 'working' | 'returning';

export interface HandoffInterface {
  agentId: string | null;
  stage: HandoffStage;
}

export interface ScratchpadItemInterface {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: number;
}

export interface ReminderInterface {
  id: string;
  text: string;
  remindAt: number;
  done: boolean;
}

export interface AgentSlice {
  handoff: HandoffInterface | null;
  scratchpadItems: ScratchpadItemInterface[];
  reminders: ReminderInterface[];
  setHandoff: (handoff: HandoffInterface | null) => void;
  addScratchpadItem: (item: ScratchpadItemInterface) => void;
  updateScratchpadItem: (id: string, patch: Partial<ScratchpadItemInterface>) => void;
  deleteScratchpadItem: (id: string) => void;
  addReminder: (reminder: ReminderInterface) => void;
  updateReminder: (id: string, patch: Partial<ReminderInterface>) => void;
  deleteReminder: (id: string) => void;
}

export const createAgentSlice: StoreSlice<AgentSlice> = (set) => ({
  handoff: null,
  scratchpadItems: [],
  reminders: [],
  addReminder: (reminder: ReminderInterface) =>
    set((state) => ({ reminders: [...state.reminders, reminder] })),
  updateReminder: (id: string, patch: Partial<ReminderInterface>) =>
    set((state) => ({
      reminders: state.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),
  deleteReminder: (id: string) =>
    set((state) => ({ reminders: state.reminders.filter((r) => r.id !== id) })),
  setHandoff: (handoff: HandoffInterface | null) => set({ handoff }),
  addScratchpadItem: (item: ScratchpadItemInterface) =>
    set((state) => ({ scratchpadItems: [item, ...state.scratchpadItems] })),
  updateScratchpadItem: (id: string, patch: Partial<ScratchpadItemInterface>) =>
    set((state) => ({
      scratchpadItems: state.scratchpadItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    })),
  deleteScratchpadItem: (id: string) =>
    set((state) => ({
      scratchpadItems: state.scratchpadItems.filter((item) => item.id !== id),
    })),
});
