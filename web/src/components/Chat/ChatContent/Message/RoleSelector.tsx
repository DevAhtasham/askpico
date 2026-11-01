import React from 'react';
import { useTranslation } from 'react-i18next';

import { Role } from '@type/chat';

const RoleSelector = React.memo(({ role }: { role: Role }) => {
  const { t } = useTranslation();

  return (
    <span className='text-sm font-medium text-ink-soft'>{t(role)}</span>
  );
});
export default RoleSelector;
