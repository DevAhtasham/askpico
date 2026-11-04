import { ArtifactInterface } from '@type/artifact';

export interface FileEntry {
  id: string;
  path: string;
  content: string;
}

export interface TreeNode {
  name: string;
  path: string;
  file?: FileEntry;
  children: TreeNode[];
}

export const getArtifactPath = (artifact: ArtifactInterface): string =>
  artifact.filePath ?? artifact.title;

export const getArtifactLabel = (artifact: ArtifactInterface): string => {
  const path = getArtifactPath(artifact);
  return path.includes('/') ? path : `root/${path}`;
};

export const toFileEntries = (artifacts: ArtifactInterface[]): FileEntry[] =>
  artifacts.map((artifact) => ({
    id: artifact.id,
    path: getArtifactPath(artifact),
    content: artifact.content,
  }));

const sortNodes = (nodes: TreeNode[]): TreeNode[] =>
  nodes
    .map((node) => ({ ...node, children: sortNodes(node.children) }))
    .sort((a, b) => {
      const aFolder = a.children.length > 0 ? 0 : 1;
      const bFolder = b.children.length > 0 ? 0 : 1;
      return aFolder - bFolder || a.name.localeCompare(b.name);
    });

export const buildFileTree = (entries: FileEntry[]): TreeNode[] => {
  const root: TreeNode = { name: '', path: '', children: [] };
  for (const entry of entries) {
    const parts = entry.path.split('/').filter(Boolean);
    let node = root;
    parts.forEach((name, index) => {
      let child = node.children.find((c) => c.name === name);
      if (!child) {
        child = { name, path: parts.slice(0, index + 1).join('/'), children: [] };
        node.children.push(child);
      }
      if (index === parts.length - 1) child.file = entry;
      node = child;
    });
  }
  return sortNodes(root.children);
};
