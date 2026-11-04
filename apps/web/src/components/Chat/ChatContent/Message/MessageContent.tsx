import React, { useState } from 'react';
import useStore from '@store/store';

import ContentView from './View/ContentView';
import EditView from './View/EditView';
import { Role } from '@type/chat';

const MessageContent = ({
  role,
  content,
  messageIndex,
  sticky = false,
}: {
  role: Role;
  content: string;
  messageIndex: number;
  sticky?: boolean;
}) => {
  const [isEdit, setIsEdit] = useState<boolean>(sticky);
  const advancedMode = useStore((state) => state.advancedMode);
  const inlineLatex = useStore((state) => state.inlineLatex);
  const markdownMode = useStore((state) => state.markdownMode);

  return (
    <>
      {isEdit ? (
        <EditView
          content={content}
          setIsEdit={setIsEdit}
          messageIndex={messageIndex}
          sticky={sticky}
        />
      ) : (
        <ContentView role={role} content={content} setIsEdit={setIsEdit} />
      )}
    </>
  );
};

export default MessageContent;
