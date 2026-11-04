import React, { useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useStore from '@store/store';
import { StudioItemInterface } from '@store/image-slice';
import { runStudioGeneration } from '@utils/studioGeneration';
import { SparkleIcon } from '@icon/ui';
import ImageControls from './ImageControls';
import ImageDropdown from './ImageDropdown';
import StudioItemCard from './StudioItemCard';

type ImageStyle = 'none' | 'closeup' | 'avatar' | 'product';

const STYLE_LABEL: Record<ImageStyle, string> = {
  none: 'No style',
  closeup: 'Closeup',
  avatar: 'Avatar',
  product: 'Product',
};

const STYLE_PREFIX: Record<ImageStyle, string> = {
  none: '',
  closeup: 'Close-up shot, ',
  avatar: 'Professional avatar portrait, ',
  product: 'Studio product photo, ',
};

type Point = { x: number; y: number };

type CanvasDrag = {
  mode: 'pan' | 'item';
  key?: string;
  startX: number;
  startY: number;
  origin: Point;
};

const CANVAS_CARD_WIDTH = 240;
const CANVAS_GAP = 32;
const CANVAS_ORIGIN = 48;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 2;

type CanvasMode = 'cursor' | 'hand';

const widgetButtonClass = (active: boolean) =>
  `flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
    active ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-surface-muted'
  }`;

const ImageStudio = () => {
  const setImageMode = useStore((state) => state.setImageMode);
  const imageProvider = useStore((state) => state.imageProvider);
  const setImageProvider = useStore((state) => state.setImageProvider);
  const imageAspectRatio = useStore((state) => state.imageAspectRatio);
  const setImageAspectRatio = useStore((state) => state.setImageAspectRatio);
  const [prompt, setPrompt] = useState<string>('');
  const [style, setStyle] = useState<ImageStyle>('none');
  const [count, setCount] = useState<number>(1);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const studioItems = useStore((state) => state.studioItems);
  const addStudioItem = useStore((state) => state.addStudioItem);

  const [canvasOffset, setCanvasOffset] = useState<Point>({ x: 0, y: 0 });
  const [itemPositions, setItemPositions] = useState<Record<string, Point>>({});
  const dragRef = useRef<CanvasDrag | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('cursor');

  const placed = studioItems.map((item, slot) => ({
    item,
    pos: itemPositions[item.id] ?? {
      x: CANVAS_ORIGIN + (slot % 3) * (CANVAS_CARD_WIDTH + CANVAS_GAP),
      y: CANVAS_ORIGIN + Math.floor(slot / 3) * (CANVAS_CARD_WIDTH + CANVAS_GAP),
    },
  }));

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (canvasMode === 'hand') {
      dragRef.current = { mode: 'pan', startX: e.clientX, startY: e.clientY, origin: canvasOffset };
      return;
    }
    const itemEl = (e.target as HTMLElement).closest<HTMLElement>('[data-canvas-item]');
    if (!itemEl) return;
    const key = itemEl.dataset.canvasItem ?? '';
    const entry = placed.find((candidate) => candidate.item.id === key);
    if (!entry) return;
    dragRef.current = { mode: 'item', key, startX: e.clientX, startY: e.clientY, origin: entry.pos };
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.mode === 'pan') {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      setCanvasOffset({
        x: drag.origin.x + e.clientX - drag.startX,
        y: drag.origin.y + e.clientY - drag.startY,
      });
    } else if (drag.key !== undefined) {
      const key = drag.key;
      setItemPositions((prev) => ({
        ...prev,
        [key]: {
          x: drag.origin.x + (e.clientX - drag.startX) / zoom,
          y: drag.origin.y + (e.clientY - drag.startY) / zoom,
        },
      }));
    }
  };

  const endCanvasDrag = () => {
    dragRef.current = null;
  };

  const zoomTo = (target: number) => {
    const next = Number(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, target)).toFixed(3));
    const el = canvasRef.current;
    if (!el || next === zoom) return;
    const cx = el.clientWidth / 2;
    const cy = el.clientHeight / 2;
    const ratio = next / zoom;
    setCanvasOffset((prev) => ({
      x: cx - (cx - prev.x) * ratio,
      y: cy - (cy - prev.y) * ratio,
    }));
    setZoom(next);
  };

  const handleAttachFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      setPrompt((prev) => `${prev ? `${prev}\n\n` : ''}[File: ${file.name}]\n${text}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleGenerate = () => {
    const text = prompt.trim();
    if (text === '' || imageProvider === '') return;
    const fullPrompt = `${STYLE_PREFIX[style]}${text}`;

    const items: StudioItemInterface[] = Array.from({ length: count }, () => ({
      id: uuidv4(),
      prompt: fullPrompt,
      provider: imageProvider,
      aspectRatio: imageAspectRatio,
      status: 'loading',
    }));
    items.forEach((item) => addStudioItem(item));
    setPrompt('');

    void (async () => {
      for (const item of items) {
        await runStudioGeneration(item.id, {
          provider: item.provider,
          prompt: item.prompt,
          aspectRatio: item.aspectRatio,
        });
      }
    })();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className='flex h-full min-h-0 flex-1 flex-col bg-white text-ink'>
      <div className='flex items-center justify-between px-5 py-3'>
        <span className='text-sm font-semibold text-ink'>Image Studio</span>
        <button
          className='rounded-lg border border-surface-line bg-white px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-surface-muted'
          onClick={() => setImageMode(false)}
        >
          Back to chat
        </button>
      </div>

      <div className='relative min-h-0 flex-1'>
      <div
        ref={canvasRef}
        className={`absolute inset-0 touch-none select-none overflow-hidden ${
          canvasMode === 'hand' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
        style={{
          backgroundImage: 'radial-gradient(#d4d4d8 1px, transparent 1px)',
          backgroundSize: `${18 * zoom}px ${18 * zoom}px`,
          backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
        }}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={endCanvasDrag}
        onPointerCancel={endCanvasDrag}
        onDragStart={(e) => e.preventDefault()}
      >
        {studioItems.length === 0 && (
          <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center'>
            <p className='text-3xl font-extrabold uppercase tracking-tight text-ink'>
              Turn any idea
            </p>
            <p className='text-3xl font-extrabold uppercase tracking-tight text-ink-muted'>
              into an image
            </p>
          </div>
        )}
        <div
          className='absolute left-0 top-0'
          style={{
            transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {placed.map((entry) => (
            <div
              key={entry.item.id}
              data-canvas-item={entry.item.id}
              className={`absolute ${canvasMode === 'cursor' ? 'cursor-move' : ''}`}
              style={{ left: entry.pos.x, top: entry.pos.y, width: CANVAS_CARD_WIDTH }}
            >
              <StudioItemCard item={entry.item} />
            </div>
          ))}
        </div>
      </div>

      <div className='absolute left-4 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-1 rounded-xl border border-surface-line bg-white/80 p-1 shadow-card backdrop-blur'>
        <button
          type='button'
          aria-label='cursor mode'
          aria-pressed={canvasMode === 'cursor'}
          title='Cursor mode'
          onClick={() => setCanvasMode('cursor')}
          className={widgetButtonClass(canvasMode === 'cursor')}
        >
          <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinejoin='round' className='h-4 w-4' aria-hidden='true'>
            <path d='M5 3l14 8-6 2-2 6z' />
          </svg>
        </button>
        <button
          type='button'
          aria-label='hand mode'
          aria-pressed={canvasMode === 'hand'}
          title='Hand mode'
          onClick={() => setCanvasMode('hand')}
          className={widgetButtonClass(canvasMode === 'hand')}
        >
          <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' className='h-4 w-4' aria-hidden='true'>
            <path d='M9 11V5a1.5 1.5 0 0 1 3 0v5m0-4a1.5 1.5 0 0 1 3 0v4m0-2.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.6-2.2L4 15.5a1.6 1.6 0 0 1 2.4-2.1L9 16' />
          </svg>
        </button>
      </div>

      <div className='absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-1 rounded-xl border border-surface-line bg-white/80 p-1 shadow-card backdrop-blur'>
        <button type='button' aria-label='zoom out' onClick={() => zoomTo(zoom / 1.2)} className={widgetButtonClass(false)}>
          -
        </button>
        <button
          type='button'
          aria-label='reset zoom'
          onClick={() => zoomTo(1)}
          className='h-8 w-8 rounded-lg text-[9px] font-medium text-ink-soft hover:bg-surface-muted'
        >
          {Math.round(zoom * 100)}%
        </button>
        <button type='button' aria-label='zoom in' onClick={() => zoomTo(zoom * 1.2)} className={widgetButtonClass(false)}>
          +
        </button>
      </div>

      <div className='pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-4 pt-2'>
        <div className='pointer-events-auto mx-auto flex w-full max-w-3xl items-stretch gap-2'>
        <div className='flex flex-col justify-center gap-1 rounded-2xl border border-surface-line bg-white/70 p-1.5 shadow-card backdrop-blur'>
          <button
            className='flex w-14 flex-col items-center gap-1 rounded-xl bg-white px-1.5 py-2 text-[10px] font-medium text-ink shadow-card'
            aria-label='image mode active'
          >
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' className='h-4 w-4' aria-hidden='true'>
              <rect x='3' y='3' width='18' height='18' rx='2' />
              <circle cx='9' cy='9' r='2' />
              <path d='m21 15-5-5L5 21' />
            </svg>
            Image
          </button>
          <button
            className='flex w-14 cursor-not-allowed flex-col items-center gap-1 rounded-xl px-1.5 py-2 text-[10px] font-medium text-ink-muted'
            disabled
            aria-label='video mode unavailable'
          >
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' className='h-4 w-4' aria-hidden='true'>
              <rect x='2' y='6' width='14' height='12' rx='2' />
              <path d='m22 8-6 4 6 4V8z' />
            </svg>
            Video
          </button>
        </div>

        <div className='flex min-w-0 flex-1 flex-col gap-1.5 rounded-2xl border border-gray-200/80 bg-white/70 p-2 shadow-card backdrop-blur'>
          <textarea
            className='m-0 max-h-24 w-full resize-none overflow-y-auto border-0 bg-transparent p-1 text-sm leading-5 text-ink placeholder:text-ink-muted focus:outline-none focus:ring-0'
            placeholder='Describe what you want to create...'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <div className='mt-auto flex flex-wrap items-center gap-1.5'>
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              aria-label='attach file'
              className='flex h-8 w-8 items-center justify-center rounded-full border border-surface-line bg-white text-base text-ink-soft hover:bg-surface-muted'
            >
              +
            </button>
            <input
              ref={fileInputRef}
              type='file'
              className='hidden'
              onChange={handleAttachFile}
              accept='.txt,.md,.json,.csv,.log'
            />
            <ImageDropdown<ImageStyle>
              ariaLabel='image style'
              value={style}
              options={(Object.keys(STYLE_LABEL) as ImageStyle[]).map((item) => ({
                value: item,
                label: STYLE_LABEL[item],
              }))}
              onChange={setStyle}
            />
            <ImageControls
              provider={imageProvider}
              onProviderChange={setImageProvider}
              aspectRatio={imageAspectRatio}
              onAspectRatioChange={setImageAspectRatio}
            />
            <div className='flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700'>
              <button
                type='button'
                aria-label='decrease image count'
                onClick={() => setCount((c) => Math.max(1, c - 1))}
                className='px-1.5'
              >
                -
              </button>
              <span>{count}/4</span>
              <button
                type='button'
                aria-label='increase image count'
                onClick={() => setCount((c) => Math.min(4, c + 1))}
                className='px-1.5'
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className='flex shrink-0 items-stretch gap-1.5'>
          {(['avatar', 'product'] as ImageStyle[]).map((item) => (
            <button
              key={item}
              type='button'
              onClick={() => setStyle(style === item ? 'none' : item)}
              aria-pressed={style === item}
              className={`flex h-auto w-14 flex-col items-center justify-center gap-1 rounded-xl border text-[9px] font-semibold uppercase transition-colors ${
                style === item
                  ? 'border-brand-300 bg-brand-50 text-brand-700'
                  : 'border-surface-line bg-white/70 text-ink-soft backdrop-blur hover:bg-white'
              }`}
            >
              <span className='flex h-5 w-5 items-center justify-center rounded-full border border-current text-xs leading-none'>
                +
              </span>
              {STYLE_LABEL[item]}
            </button>
          ))}
        </div>

        <button
          className='flex w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl bg-brand-500 text-xs font-semibold uppercase tracking-wide text-white shadow-soft transition-all hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50'
          disabled={prompt.trim() === '' || imageProvider === ''}
          onClick={handleGenerate}
        >
          <SparkleIcon className='h-4 w-4' />
          Generate
        </button>
      </div>
        </div>
      </div>
    </div>
  );
};

export default ImageStudio;
