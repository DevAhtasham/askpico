import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const QrGenerator = () => {
  const [text, setText] = useState('https://askpico.app');
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!text.trim()) {
      setDataUrl('');
      return;
    }
    let active = true;
    QRCode.toDataURL(text.trim(), { width: 256, margin: 2 })
      .then((url) => active && setDataUrl(url))
      .catch(() => active && setDataUrl(''));
    return () => {
      active = false;
    };
  }, [text]);

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-surface-line bg-white p-4 text-sm'>
      <textarea
        aria-label='qr text'
        className='min-h-[70px] rounded-lg border border-surface-line px-3 py-2'
        placeholder='URL ya text likhein'
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {dataUrl ? (
        <img src={dataUrl} alt='QR code' className='h-64 w-64 self-center rounded-lg bg-white' />
      ) : (
        <p className='text-gray-500'>QR banane ke liye text likhein.</p>
      )}
      <a
        href={dataUrl || undefined}
        download='qr-code.png'
        className={`self-start rounded-lg border border-surface-line px-3 py-1.5 ${dataUrl ? '' : 'pointer-events-none opacity-50'}`}
      >
        Download PNG
      </a>
    </div>
  );
};

export default QrGenerator;
