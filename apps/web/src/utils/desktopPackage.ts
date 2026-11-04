import JSZip from 'jszip';

import { buildExportFiles } from '@utils/projectScaffold';
import { sanitizePath } from '@utils/zipArtifacts';

const ZIP_NAME = 'project-desktop-app.zip';

export const createDesktopAppZip = async (files: { path: string; content: string }[]): Promise<Blob> => {
  const zip = new JSZip();

  buildExportFiles(files).forEach((file) => {
    const path = sanitizePath(file.path);
    if (path) zip.file(path, file.content);
  });

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
