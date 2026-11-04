import React from 'react';
import { logger } from '@utils/logger';

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    logger.error('ui crashed:', error.message);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className='flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center'>
        <p className='text-sm text-ink'>Kuch masla aa gaya. Dobara koshish karein.</p>
        <button
          type='button'
          className='rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-soft hover:bg-brand-600'
          onClick={() => this.setState({ hasError: false })}
        >
          Retry
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
