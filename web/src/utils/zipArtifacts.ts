import { strToU8, zipSync } from 'fflate';
import { buildExportFiles } from '@utils/projectScaffold';

export const sanitizePath = (filePath: string) =>
  filePath
    .split('/')
    .filter((segment) => segment !== '' && segment !== '.' && segment !== '..')
    .join('/');

export const downloadArtifactsZip = (
  files: { path: string; content: string }[],
  zipName: string
) => {
  const entries: Record<string, Uint8Array> = {};
  buildExportFiles(files).forEach((file) => {
    const path = sanitizePath(file.path);
    if (path) entries[path] = strToU8(file.content);
  });

  const blob = new Blob([zipSync(entries)], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipName;
  link.click();
  URL.revokeObjectURL(url);
};
