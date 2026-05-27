import { useCallback, useEffect } from 'react';
import { Html } from 'react-konva-utils';

import type Konva from 'konva';

const TextArea = ({
  textNode,
  onChange,
  textareaRef,
}: {
  textNode: Konva.Text | null;
  onChange: (newText: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) => {
  useEffect(() => {
    if (!textareaRef.current || !textNode) return;

    const textarea = textareaRef.current;
    const textPosition = textNode.position();
    const areaPosition = {
      x: textPosition.x,
      y: textPosition.y,
    };

    // Match styles with the text node
    textarea.value = textNode.getAttr('isEmpty') ? '' : textNode.text();
    textarea.style.position = 'absolute';
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${textNode.width() - textNode.padding() * 2}px`;
    textarea.style.height = `${textNode.height() - textNode.padding() * 2 + 5}px`;
    textarea.style.fontSize = `${textNode.fontSize()}px`;
    textarea.style.border = 'none';
    textarea.style.padding = '0px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'none';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = `${textNode.lineHeight()}`;
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.transformOrigin = 'left top';
    textarea.style.textAlign = textNode.align();
    const fill = textNode.fill();
    if (typeof fill === 'string') textarea.style.color = fill;

    const rotation = textNode.rotation();
    let transform = '';
    if (rotation) {
      transform += `rotateZ(${rotation}deg)`;
    }
    textarea.style.transform = transform;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight + 3}px`;

    textarea.focus();

    const handleInput = () => {
      const scale = textNode.getAbsoluteScale().x;
      textarea.style.width = `${textNode.width() * scale}px`;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight + textNode.fontSize()}px`;
      onChange(textarea.value);
    };

    // textarea.addEventListener("keydown", handleKeyDown);
    textarea.addEventListener('input', handleInput);

    return () => {
      // textarea.removeEventListener("keydown", handleKeyDown);
      textarea.removeEventListener('input', handleInput);
    };
  }, [textNode, onChange]);

  return (
    <textarea
      ref={textareaRef}
      style={{
        minHeight: '1em',
        position: 'absolute',
      }}
    />
  );
};

export const TextEditor = ({
  textNode,
  textEditorRef,
}: {
  textNode: React.RefObject<Konva.Text | null>;
  textEditorRef: React.RefObject<HTMLTextAreaElement | null>;
}) => {
  const onChange = useCallback((newText: string) => {
    if (!textNode || !textNode.current) return;
    textNode.current.text(newText);
    if (textEditorRef.current !== null) {
      textEditorRef.current.value = newText;
    }
  }, []);
  // const onClose = () => {
  //   if (textNode && textNode.current) {
  //     if (textEditorRef.current !== null)
  //       textNode.current.text(textEditorRef.current.value);
  //     textNode.current.visible(true);
  //     textNode.current = null;
  //   }
  //   isEditingTextRef.current = false;
  // };
  return (
    <Html>
      <TextArea textNode={textNode.current} onChange={onChange} textareaRef={textEditorRef} />
    </Html>
  );
};
