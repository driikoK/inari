import { FC } from 'react';
import { Editor, useEditorState } from '@tiptap/react';
import { IconButton } from '@mui/material';
import {
  FormatBoldOutlined,
  FormatItalicOutlined,
  HorizontalRuleOutlined,
  InsertLinkOutlined,
  RedoOutlined,
  UndoOutlined,
} from '@mui/icons-material';
import clsx from 'clsx';

import styles from '../Codex.module.scss';

interface CodexToolbarProps {
  editor: Editor;
  onLink: () => void;
}

export const CodexToolbar: FC<CodexToolbarProps> = ({ editor, onLink }) => {
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      link: current.isActive('link'),
      section: current.isActive('heading', { level: 2 }),
      subsection: current.isActive('heading', { level: 3 }),
      hasSelection: !current.state.selection.empty,
      canUndo: current.can().undo(),
      canRedo: current.can().redo(),
    }),
  });

  // A button must not take the focus from the text, or the selection it works on is gone
  const keepSelection = (event: { preventDefault: () => void }) => event.preventDefault();
  const chain = () => editor.chain().focus();

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Форматування">
      <IconButton
        size="small"
        title="Жирний"
        aria-label="Жирний"
        className={clsx(state.bold && styles.active)}
        onMouseDown={keepSelection}
        onClick={() => chain().toggleBold().run()}
      >
        <FormatBoldOutlined />
      </IconButton>
      <IconButton
        size="small"
        title="Курсив"
        aria-label="Курсив"
        className={clsx(state.italic && styles.active)}
        onMouseDown={keepSelection}
        onClick={() => chain().toggleItalic().run()}
      >
        <FormatItalicOutlined />
      </IconButton>
      <IconButton
        size="small"
        title="Посилання: виділіть текст"
        aria-label="Посилання"
        className={clsx(state.link && styles.active)}
        disabled={!state.hasSelection && !state.link}
        onMouseDown={keepSelection}
        onClick={onLink}
      >
        <InsertLinkOutlined />
      </IconButton>

      <span className={styles.separator} />

      <button
        type="button"
        title="Розділ"
        aria-label="Розділ"
        className={clsx(styles.textButton, state.section && styles.active)}
        onMouseDown={keepSelection}
        onClick={() => chain().toggleHeading({ level: 2 }).run()}
      >
        Розділ
      </button>
      <button
        type="button"
        title="Підрозділ"
        aria-label="Підрозділ"
        className={clsx(styles.textButton, state.subsection && styles.active)}
        onMouseDown={keepSelection}
        onClick={() => chain().toggleHeading({ level: 3 }).run()}
      >
        Підрозділ
      </button>
      <IconButton
        size="small"
        title="Горизонтальна лінія"
        aria-label="Горизонтальна лінія"
        onMouseDown={keepSelection}
        onClick={() => chain().setHorizontalRule().run()}
      >
        <HorizontalRuleOutlined />
      </IconButton>

      <span className={styles.separator} />

      <IconButton
        size="small"
        title="Скасувати дію"
        aria-label="Скасувати дію"
        disabled={!state.canUndo}
        onMouseDown={keepSelection}
        onClick={() => chain().undo().run()}
      >
        <UndoOutlined />
      </IconButton>
      <IconButton
        size="small"
        title="Повторити дію"
        aria-label="Повторити дію"
        disabled={!state.canRedo}
        onMouseDown={keepSelection}
        onClick={() => chain().redo().run()}
      >
        <RedoOutlined />
      </IconButton>
    </div>
  );
};
