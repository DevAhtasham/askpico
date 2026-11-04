import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

const QrScanner = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!scanning) return;
    let stream: MediaStream | null = null;
    let frame = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const image = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(image.data, image.width, image.height);
          if (code) {
            setResult(code.data);
            setScanning(false);
            return;
          }
        }
      }
      frame = requestAnimationFrame(tick);
    };

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        frame = requestAnimationFrame(tick);
      } catch (err) {
        setError(`Camera access nahi mila: ${(err as Error).message}. Browser permission check karein (HTTPS ya localhost zaroori hai).`);
        setScanning(false);
      }
    };
    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [scanning]);

  const scanImage = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setResult('');
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = canvasRef.current ?? document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Canvas context available nahi');
      context.drawImage(bitmap, 0, 0);
      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(image.data, image.width, image.height);
      if (code) setResult(code.data);
      else setError('Image mein QR code nahi mila.');
    } catch (err) {
      setError(`Image read nahi hui: ${(err as Error).message}`);
    }
  };

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-surface-line bg-white p-4 text-sm'>
      <div className='flex flex-wrap gap-2'>
        <button
          type='button'
          className='btn btn-primary'
          onClick={() => {
            setResult('');
            setError('');
            setScanning((prev) => !prev);
          }}
        >
          {scanning ? 'Stop camera' : 'Start camera'}
        </button>
        <label className='btn btn-neutral cursor-pointer'>
          Image se scan
          <input type='file' accept='image/*' className='hidden' onChange={(e) => scanImage(e.target.files?.[0])} />
        </label>
      </div>
      <video ref={videoRef} playsInline muted className={`w-full rounded-lg bg-black ${scanning ? '' : 'hidden'}`} />
      <canvas ref={canvasRef} className='hidden' />
      {error && <p className='text-red-600'>{error}</p>}
      {result && (
        <div className='rounded-lg bg-surface-muted p-3'>
          <p className='font-semibold'>Result:</p>
          <p className='break-all font-mono'>{result}</p>
        </div>
      )}
    </div>
  );
};

export default QrScanner;
