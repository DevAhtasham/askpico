export type ArtifactType = 'code' | 'preview' | 'document';

export type ArtifactTab = 'preview' | 'code';

export interface ArtifactInterface {
  id: string;
  chatId: string;
  messageIndex: number;
  title: string;
  type: ArtifactType;
  language: string;
  filePath?: string;
  content: string;
  createdAt: number;
}
