import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProfileState {
  name: string;
  email: string;
  setProfile: (profile: { name?: string; email?: string }) => void;
}

const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      name: '',
      email: '',
      setProfile: (profile) => set((state) => ({ ...state, ...profile })),
    }),
    { name: 'fahmchat-profile' }
  )
);

export const profileDisplayName = (name: string): string =>
  name.trim() === '' ? 'Guest' : name.trim();

export default useProfileStore;
