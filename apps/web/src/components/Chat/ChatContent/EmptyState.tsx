import React from 'react';
import useProfileStore, { profileDisplayName } from '@store/profile-store';

const EmptyState = () => {
  const name = useProfileStore((state) => state.name);
  const displayName = profileDisplayName(name);

  return (
    <div className='flex w-full flex-col items-center px-6 pt-0 text-center'>
      <div className='relative mb-5 h-28 w-28'>
        <div className='orb-glow' />
        <div className='orb animate-orb-pulse h-full w-full' />
      </div>
      <h1 className='text-gradient-brand text-xl font-medium sm:text-2xl'>
        Hello, {displayName}
      </h1>
      <p className='mt-1 text-2xl font-semibold leading-tight text-ink'>
        How can I assist you today?
      </p>
    </div>
  );
};

export default EmptyState;
