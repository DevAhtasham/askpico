import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const RENDER_SCALE = 2;

export const pdfPageCount = async (file: File): Promise<number> => {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  return pdf.numPages;
};

export const parsePageSelection = (input: string, pageCount: number): number[] | null => {
  const text = input.trim().toLowerCase();
  if (text === '' || /\b(all|sari|sare|saray|every)\b/.test(text)) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  const firstN = text.match(/^(\d+)\s*(pages?|pehle|first)?$/);
  if (firstN && Number(firstN[1]) > 0) {
    const n = Math.min(Number(firstN[1]), pageCount);
    for (let i = 1; i <= n; i += 1) pages.add(i);
    return [...pages];
  }

  for (const part of text.split(/[,\s]+/).filter(Boolean)) {
    const range = part.match(/^(\d+)-(\d+)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Math.min(Number(range[2]), pageCount);
      for (let i = start; i <= end; i += 1) pages.add(i);
    } else if (/^\d+$/.test(part)) {
      pages.add(Number(part));
    }
  }
  const valid = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  return valid.length > 0 ? valid : null;
};

export const convertPdfPages = async (
  file: File,
  pages: number[],
  baseName: string
): Promise<{ name: string; url: string }[]> => {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const blobs: { name: string; blob: Blob }[] = [];

  for (const pageNumber of pages) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas is not available');
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG render failed'))), 'image/png')
    );
    blobs.push({ name: `${baseName}-page-${pageNumber}.png`, blob });
  }

  if (blobs.length === 1) {
    return [{ name: `${baseName}.png`, url: URL.createObjectURL(blobs[0].blob) }];
  }

  const zip = new JSZip();
  blobs.forEach(({ name, blob }) => zip.file(name, blob));
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return [{ name: `${baseName}-png.zip`, url: URL.createObjectURL(zipBlob) }];
};
