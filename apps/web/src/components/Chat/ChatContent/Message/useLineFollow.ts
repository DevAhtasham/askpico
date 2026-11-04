import React from 'react';

type CaretPositionFn = (
  x: number,
  y: number
) => { offsetNode: Node; offset: number } | null;

const getCharRect = (x: number, y: number): DOMRect | null => {
  let node: Node | null = null;
  let offset = 0;

  if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(x, y);
    if (range) {
      node = range.startContainer;
      offset = range.startOffset;
    }
  } else {
    const caretPosition = (document as Document & { caretPositionFromPoint?: CaretPositionFn })
      .caretPositionFromPoint?.(x, y);
    if (caretPosition) {
      node = caretPosition.offsetNode;
      offset = caretPosition.offset;
    }
  }

  if (!node || node.nodeType !== Node.TEXT_NODE) return null;
  const text = node as Text;
  if (text.length === 0) return null;

  const start = Math.min(offset, text.length - 1);
  const range = document.createRange();
  range.setStart(text, start);
  range.setEnd(text, start + 1);
  const rect = range.getBoundingClientRect();
  const isOverGlyph =
    rect.height > 0 && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  return isOverGlyph ? rect : null;
};

export const useLineFollow = (
  containerRef: React.RefObject<HTMLDivElement>,
  avatarRef: React.RefObject<HTMLDivElement>
) => {
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const avatar = avatarRef.current;
    if (!container || !avatar) return;

    const rect = getCharRect(e.clientX, e.clientY);
    if (!rect) return;

    const top = rect.top - container.getBoundingClientRect().top;
    avatar.style.transform = `translateY(${top + rect.height / 2 - avatar.offsetHeight / 2}px)`;
  };

  return { onMouseMove };
};
