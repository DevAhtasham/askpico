import { StoreSlice } from './store';
import { ArtifactInterface, ArtifactTab } from '@type/artifact';

export interface ArtifactSlice {
  artifacts: ArtifactInterface[];
  activeArtifactId: string | null;
  artifactPanelOpen: boolean;
  activeArtifactTab: ArtifactTab;
  setArtifacts: (artifacts: ArtifactInterface[]) => void;
  openArtifactPanel: (artifactId?: string) => void;
  closeArtifactPanel: () => void;
  setActiveArtifactId: (artifactId: string | null) => void;
  setActiveArtifactTab: (tab: ArtifactTab) => void;
}

export const createArtifactSlice: StoreSlice<ArtifactSlice> = (set) => ({
  artifacts: [],
  activeArtifactId: null,
  artifactPanelOpen: false,
  activeArtifactTab: 'preview',
  setArtifacts: (artifacts: ArtifactInterface[]) => {
    set((prev: ArtifactSlice) => ({ ...prev, artifacts }));
  },
  openArtifactPanel: (artifactId?: string) => {
    set((prev: ArtifactSlice) => ({
      ...prev,
      artifactPanelOpen: true,
      activeArtifactId: artifactId ?? prev.activeArtifactId,
      hideSideMenu: true,
    }));
  },
  closeArtifactPanel: () => {
    set((prev: ArtifactSlice) => ({ ...prev, artifactPanelOpen: false }));
  },
  setActiveArtifactId: (artifactId: string | null) => {
    set((prev: ArtifactSlice) => ({ ...prev, activeArtifactId: artifactId }));
  },
  setActiveArtifactTab: (tab: ArtifactTab) => {
    set((prev: ArtifactSlice) => ({ ...prev, activeArtifactTab: tab }));
  },
});
