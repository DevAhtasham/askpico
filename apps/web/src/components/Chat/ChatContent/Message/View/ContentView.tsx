import React, { DetailedHTMLProps, HTMLAttributes, memo } from 'react';

import ReactMarkdown from 'react-markdown';
import { CodeProps, ReactMarkdownProps } from 'react-markdown/lib/ast-to-react';

import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import useStore from '@store/store';

import { codeLanguageSubset } from '@constants/chat';

import { isDocumentLanguage, MarkdownSegment, splitFences } from '@utils/artifactParser';
import ArtifactCard from '@components/Artifact/ArtifactCard';
import DocumentExport from '@components/Artifact/DocumentExport';

import CopyButton from './Button/CopyButton';
import EditButton from './Button/EditButton';

import CodeBlock from '../CodeBlock';

const ContentView = memo(
  ({
    role,
    content,
    setIsEdit,
  }: {
    role: string;
    content: string;
    setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
  }) => {
    const inlineLatex = useStore((state) => state.inlineLatex);

    const handleCopy = () => {
      navigator.clipboard.writeText(content);
    };

    const segments: MarkdownSegment[] =
      role === 'assistant'
        ? splitFences(content)
        : [{ type: 'text', value: content }];

    return (
      <>
        <div
          className={`markdown prose break-words dark:prose-invert dark share-gpt-message ${
            role === 'user'
              ? 'ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-50 px-4 py-2.5 text-ink md:max-w-[85%]'
              : 'w-full md:max-w-full'
          }`}
        >
          {segments.map((segment, index) => {
            if (segment.type === 'code') {
              if (segment.content.trim() === '') return null;
              return (
                <React.Fragment key={index}>
                  <ArtifactCard
                    language={segment.language}
                    filePath={segment.filePath}
                    content={segment.content}
                  />
                  {isDocumentLanguage(segment.language) && (
                    <DocumentExport title={segment.filePath ?? 'document'} content={segment.content} />
                  )}
                </React.Fragment>
              );
            }
            return (
              <ReactMarkdown
                key={index}
                remarkPlugins={[
                  remarkGfm,
                  [remarkMath, { singleDollarTextMath: inlineLatex }],
                ]}
                rehypePlugins={[
                  rehypeKatex,
                  [
                    rehypeHighlight,
                    {
                      detect: true,
                      ignoreMissing: true,
                      subset: codeLanguageSubset,
                    },
                  ],
                ]}
                linkTarget='_new'
                components={{
                  code,
                  p,
                }}
              >
                {segment.value}
              </ReactMarkdown>
            );
          })}
        </div>
        <div className='flex justify-end gap-2 w-full mt-2'>
          <CopyButton onClick={handleCopy} />
          {role === 'user' && <EditButton setIsEdit={setIsEdit} />}
        </div>
      </>
    );
  }
);

const code = memo((props: CodeProps) => {
  const { inline, className, children } = props;
  const match = /language-(\w+)/.exec(className || '');
  const lang = match && match[1];

  if (inline) {
    return <code className={className}>{children}</code>;
  } else {
    return <CodeBlock lang={lang || 'text'} codeChildren={children} />;
  }
});

const p = memo(
  (
    props?: Omit<
      DetailedHTMLProps<
        HTMLAttributes<HTMLParagraphElement>,
        HTMLParagraphElement
      >,
      'ref'
    > &
      ReactMarkdownProps
  ) => {
    return <p className='whitespace-pre-wrap'>{props?.children}</p>;
  }
);

export default ContentView;
