import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

import CrossIcon2 from '@icon/CrossIcon2';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For trying out FahmChat.',
    features: ['Limited daily messages', 'Standard models', 'Chat history'],
    cta: 'Current Plan',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$20',
    period: 'per month',
    description: 'For everyday power users.',
    features: [
      'Unlimited messages',
      'All models, including GPT-4',
      'Priority responses',
      'Export and share chats',
    ],
    cta: 'Upgrade Now',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'per team',
    description: 'For teams with security needs.',
    features: [
      'Everything in Pro',
      'Team management',
      'SSO and admin controls',
      'Dedicated support',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const UpgradeModal = ({ onClose }: { onClose: () => void }) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className='fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-md'
      onMouseDown={onClose}
    >
      <div
        className='relative mx-4 w-full max-w-3xl rounded-3xl border border-surface-line bg-white p-6 shadow-2xl'
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          className='absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-black/5 hover:text-ink'
          onClick={onClose}
          aria-label='close upgrade plans'
        >
          <CrossIcon2 />
        </button>

        <div className='text-center'>
          <h2 className='text-xl font-semibold text-ink'>Upgrade Your Plan</h2>
          <p className='mt-1 text-sm text-ink-muted'>
            Choose the plan that fits how you work.
          </p>
        </div>

        <div className='mt-6 grid grid-cols-1 gap-4 md:grid-cols-3'>
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-2xl border p-5 ${
                plan.highlighted
                  ? 'border-brand-300 bg-brand-50 shadow-card'
                  : 'border-surface-line bg-white'
              }`}
            >
              <div className='text-sm font-semibold text-ink'>{plan.name}</div>
              <div className='mt-1 text-xs text-ink-muted'>
                {plan.description}
              </div>
              <div className='mt-4 flex items-baseline gap-1'>
                <span className='text-2xl font-semibold text-ink'>
                  {plan.price}
                </span>
                <span className='text-xs text-ink-muted'>{plan.period}</span>
              </div>
              <ul className='mt-4 flex flex-1 flex-col gap-2 text-sm text-ink-soft'>
                {plan.features.map((f) => (
                  <li key={f} className='flex items-start gap-2'>
                    <span className='mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500' />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-5 w-full rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  plan.cta === 'Current Plan'
                    ? 'border border-surface-line bg-white text-ink-muted'
                    : plan.highlighted
                    ? 'bg-ink text-white hover:bg-ink-soft'
                    : 'border border-surface-line bg-white text-ink hover:bg-surface-muted'
                }`}
                disabled={plan.cta === 'Current Plan'}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UpgradeModal;
