import { create } from 'zustand';

// Small store to push text into the sticky composer (quick actions,
// saved prompts, attachments) without wiring through the main store.
interface DraftState {
  content: string;
  setContent: (content: string) => void;
  appendContent: (content: string) => void;
}

const useDraftStore = create<DraftState>()((set) => ({
  content: '',
  setContent: (content: string) => set({ content }),
  appendContent: (content: string) =>
    set((state) => ({ content: state.content + content })),
}));

export default useDraftStore;
