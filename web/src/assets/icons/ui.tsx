import React from 'react';

// Shared UI icons for the redesigned interface.
// All icons use currentColor and stroke-based strokes like the rest of the set.

const svg = (children: React.ReactNode, viewBox = '0 0 24 24') => (
  <svg
    stroke='currentColor'
    fill='none'
    strokeWidth='1.8'
    viewBox={viewBox}
    strokeLinecap='round'
    strokeLinejoin='round'
    className='h-full w-full'
    xmlns='http://www.w3.org/2000/svg'
  >
    {children}
  </svg>
);

export const SearchIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <>
        <circle cx='11' cy='11' r='7' />
        <path d='m20 20-3.5-3.5' />
      </>
    )}
  </span>
);

export const DotsIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <>
        <circle cx='5' cy='12' r='1' fill='currentColor' stroke='none' />
        <circle cx='12' cy='12' r='1' fill='currentColor' stroke='none' />
        <circle cx='19' cy='12' r='1' fill='currentColor' stroke='none' />
      </>
    )}
  </span>
);

export const PaperclipIcon = ({
  className = 'h-4 w-4',
}: {
  className?: string;
}) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <path d='m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48' />
    )}
  </span>
);

export const GlobeIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <>
        <circle cx='12' cy='12' r='9' />
        <path d='M3 12h18M12 3a15.3 15.3 0 0 1 0 18M12 3a15.3 15.3 0 0 0 0 18' />
      </>
    )}
  </span>
);

export const MicIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <>
        <rect x='9' y='2' width='6' height='12' rx='3' />
        <path d='M5 10a7 7 0 0 0 14 0M12 19v3' />
      </>
    )}
  </span>
);

export const SparkleIcon = ({
  className = 'h-4 w-4',
}: {
  className?: string;
}) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <path d='M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4L12 3zm7 11 1 2.6L22.6 18l-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1.4L19 14z' />
    )}
  </span>
);

export const BookmarkIcon = ({
  className = 'h-4 w-4',
}: {
  className?: string;
}) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <path d='M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' />
    )}
  </span>
);

export const GearIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <>
        <circle cx='12' cy='12' r='3' />
        <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' />
      </>
    )}
  </span>
);

export const HelpIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <>
        <circle cx='12' cy='12' r='9' />
        <path d='M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.6-3 4.5' />
        <circle cx='12' cy='17.5' r='0.5' fill='currentColor' stroke='none' />
      </>
    )}
  </span>
);

export const TranslateIcon = ({
  className = 'h-4 w-4',
}: {
  className?: string;
}) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <>
        <path d='M5 8h9M7 5v3c0 1.7-1 4-2.5 5.5M9 8v1c0 1.7-1.3 4.3-3.5 6M3 13.5c2-1.8 3.5-4 3.5-4s1.5 2.2 3.5 4' />
        <path d='m11 19 4-8 4 8M12.5 15.5h5' />
      </>
    )}
  </span>
);

export const LayersIcon = ({
  className = 'h-4 w-4',
}: {
  className?: string;
}) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <>
        <path d='m12 2 9 5-9 5-9-5 9-5z' />
        <path d='m3 12 9 5 9-5' />
        <path d='m3 17 9 5 9-5' />
      </>
    )}
  </span>
);

export const BulbIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <>
        <path d='M9 18h6M10 21h4' />
        <path d='M12 3a6 6 0 0 0-3.3 11c.6.5 1 .9 1.3 2h4c.3-1.1.7-1.5 1.3-2A6 6 0 0 0 12 3z' />
      </>
    )}
  </span>
);

export const CheckSquareIcon = ({
  className = 'h-4 w-4',
}: {
  className?: string;
}) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <>
        <path d='m9 11 3 3 8-8' />
        <path d='M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9' />
      </>
    )}
  </span>
);

export const CompassIcon = ({
  className = 'h-4 w-4',
}: {
  className?: string;
}) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <>
        <circle cx='12' cy='12' r='9' />
        <path d='m16 8-2.5 5.5L8 16l2.5-5.5L16 8z' />
      </>
    )}
  </span>
);

export const LibraryIcon = ({
  className = 'h-4 w-4',
}: {
  className?: string;
}) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <>
        <path d='M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z' />
        <path d='M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5' />
      </>
    )}
  </span>
);

export const FileIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <>
        <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
        <path d='M14 2v6h6' />
      </>
    )}
  </span>
);

export const ClockIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <>
        <circle cx='12' cy='12' r='9' />
        <path d='M12 7v5l3.5 2' />
      </>
    )}
  </span>
);

export const PanelLeftIcon = ({
  className = 'h-4 w-4',
}: {
  className?: string;
}) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <>
        <rect x='3' y='4' width='18' height='16' rx='2' />
        <path d='M9 4v16' />
      </>
    )}
  </span>
);

export const DeepResearchIcon = ({
  className = 'h-4 w-4',
}: {
  className?: string;
}) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <>
        <circle cx='10.5' cy='10.5' r='6.5' />
        <path d='m19.5 19.5-4-4' />
        <path d='M8 10.5h5M10.5 8v5' />
      </>
    )}
  </span>
);

export const SendUpIcon = ({
  className = 'h-4 w-4',
}: {
  className?: string;
}) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <>
        <path d='M12 19V5M5 12l7-7 7 7' />
      </>
    )}
  </span>
);

export const ExportUpIcon = ({
  className = 'h-4 w-4',
}: {
  className?: string;
}) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <>
        <path d='M12 3v12M7 8l5-5 5 5' />
        <path d='M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4' />
      </>
    )}
  </span>
);

export const ShareLinkIcon = ({
  className = 'h-4 w-4',
}: {
  className?: string;
}) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <>
        <path d='M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.7 1.7' />
        <path d='M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.7-1.7' />
      </>
    )}
  </span>
);

export const SignOutIcon = ({
  className = 'h-4 w-4',
}: {
  className?: string;
}) => (
  <span className={`inline-flex ${className}`}>
    {svg(
      <>
        <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
        <path d='m16 17 5-5-5-5M21 12H9' />
      </>
    )}
  </span>
);
