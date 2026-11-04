import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';

const Barcode = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [text, setText] = useState('PICO-123');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || !text.trim()) return;
    try {
      JsBarcode(svgRef.current, text.trim(), { format: 'CODE128', displayValue: true, margin: 10 });
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [text]);

  const download = () => {
    if (!svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'barcode.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-surface-line bg-white p-4 text-sm'>
      <input
        aria-label='barcode text'
        className='rounded-lg border border-surface-line px-3 py-2'
        placeholder='Text ya number (CODE128)'
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {error && <p className='text-red-600'>{error}</p>}
      <div className='overflow-auto rounded-lg bg-white p-2'>
        <svg ref={svgRef} />
      </div>
      <button
        type='button'
        className='self-start rounded-lg border border-surface-line px-3 py-1.5'
        onClick={download}
        disabled={!!error}
      >
        Download SVG
      </button>
    </div>
  );
};

export default Barcode;
