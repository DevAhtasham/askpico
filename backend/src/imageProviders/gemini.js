const GEMINI_NATIVE_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_IMAGE_MODEL = 'gemini-3.1-flash-image';
const REQUEST_TIMEOUT_MS = 60000;

export class ImageProviderError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ImageProviderError';
    this.status = status;
  }
}

export const geminiImageProvider = {
  id: 'gemini',
  label: 'Gemini',

  isConfigured: () => Boolean(process.env.GEMINI_API_KEY),

  async generate({ prompt, aspectRatio = '1:1', signal }) {
    const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
    const signals = [AbortSignal.timeout(REQUEST_TIMEOUT_MS)];
    if (signal) signals.push(signal);

    const response = await fetch(
      `${GEMINI_NATIVE_BASE_URL}/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: { aspectRatio },
          },
        }),
        signal: AbortSignal.any(signals),
      }
    );

    if (!response.ok) {
      throw new ImageProviderError(`Gemini responded with ${response.status}`, response.status);
    }

    const data = await response.json();
    const part = data.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData?.data
    );
    if (!part) {
      throw new ImageProviderError('No image part in Gemini response', 502);
    }

    return {
      mimeType: part.inlineData.mimeType || 'image/png',
      dataBase64: part.inlineData.data,
      model,
    };
  },
};
