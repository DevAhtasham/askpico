import { StoreSlice } from './store';
import { ImageAspectRatio } from '@type/chat';

export interface StudioItemInterface {
  id: string;
  prompt: string;
  provider: string;
  aspectRatio: ImageAspectRatio;
  status: 'loading' | 'done' | 'error';
  imageId?: string;
  mimeType?: string;
  error?: string;
}

export interface ImageSlice {
  imageMode: boolean;
  projectMode: boolean;
  imageProvider: string;
  imageAspectRatio: ImageAspectRatio;
  studioItems: StudioItemInterface[];
  setImageMode: (imageMode: boolean) => void;
  setProjectMode: (projectMode: boolean) => void;
  setImageProvider: (imageProvider: string) => void;
  setImageAspectRatio: (imageAspectRatio: ImageAspectRatio) => void;
  addStudioItem: (item: StudioItemInterface) => void;
  updateStudioItem: (id: string, patch: Partial<StudioItemInterface>) => void;
}

export const createImageSlice: StoreSlice<ImageSlice> = (set) => ({
  imageMode: false,
  projectMode: false,
  imageProvider: '',
  imageAspectRatio: '1:1',
  studioItems: [],
  addStudioItem: (item: StudioItemInterface) =>
    set((state) => ({ studioItems: [...state.studioItems, item] })),
  updateStudioItem: (id: string, patch: Partial<StudioItemInterface>) =>
    set((state) => ({
      studioItems: state.studioItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    })),
  setImageMode: (imageMode: boolean) =>
    set(imageMode ? { imageMode, projectMode: false } : { imageMode }),
  setProjectMode: (projectMode: boolean) => set({ projectMode }),
  setImageProvider: (imageProvider: string) => set({ imageProvider }),
  setImageAspectRatio: (imageAspectRatio: ImageAspectRatio) => set({ imageAspectRatio }),
});
