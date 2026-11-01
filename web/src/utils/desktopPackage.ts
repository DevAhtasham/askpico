import JSZip from 'jszip';

import { buildExportFiles } from '@utils/projectScaffold';
import { sanitizePath } from '@utils/zipArtifacts';

const LAUNCHER_URL = '/bin/Launcher.exe';
const LAUNCHER_NAME = 'Launcher.exe';
const ZIP_NAME = 'project-desktop-app.zip';

export const createDesktopAppZip = async (files: { path: string; content: string }[]): Promise<Blob> => {
  const zip = new JSZip();

  buildExportFiles(files).forEach((file) => {
    const path = sanitizePath(file.path);
    if (path) zip.file(path, file.content);
  });

  const response = await fetch(LAUNCHER_URL, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${LAUNCHER_URL} (HTTP ${response.status})`);
  }
  zip.file(LAUNCHER_NAME, await response.arrayBuffer(), { binary: true });

  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
};

export const saveDesktopAppZip = (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = ZIP_NAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
