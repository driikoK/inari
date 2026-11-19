import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import toast from 'react-hot-toast';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Button } from '@mui/material';
import { EditOutlined, SaveOutlined } from '@mui/icons-material';
import clsx from 'clsx';

import { ConfirmDeleteDialog, FallbackComponent } from '@/components';
import { SUBJECTS } from '@/context/casl';
import { usePermissions } from '@/hooks';
import { useCodexStore } from '@/stores';
import type { CodexType } from '@/types';
import { notifyFailure } from '@/utils/request';
import styles from './Codex.module.scss';
import { CodexToolbar } from './components/CodexToolbar';
import { LinkDialog } from './components/LinkDialog';
import { codexExtensions } from './const/extensions';

const formatDay = (value: string) =>
  new Date(value).toLocaleDateString('uk-UA', { timeZone: 'Europe/Kyiv' });

const CodexPage = ({ codex }: { codex: CodexType }) => {
  const saveCodex = useCodexStore((state) => state.saveCodex);
  const { hasAccess } = usePermissions();
  const canEdit = hasAccess(SUBJECTS.EDIT_CODEX);

  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  // The text as the editor had it when the editing began, to tell whether anything changed
  const original = useRef<ProseMirrorNode | null>(null);

  const editor = useEditor({
    extensions: codexExtensions,
    content: codex.content,
    editable: false,
    onUpdate: ({ editor: current }) =>
      setIsDirty(original.current ? !current.state.doc.eq(original.current) : false),
  });

  const blocker = useBlocker(isDirty);

  useEffect(() => {
    if (!isDirty) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();

    window.addEventListener('beforeunload', warn);

    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  if (!editor) return <FallbackComponent />;

  const startEditing = () => {
    original.current = editor.state.doc;
    editor.setEditable(true);
    setIsEditing(true);
    setIsDirty(false);
    editor.commands.focus('start');
  };

  const stopEditing = () => {
    editor.setEditable(false);
    setIsEditing(false);
    setIsDirty(false);
  };

  const discard = () => {
    if (original.current) editor.commands.setContent(original.current.toJSON());
    setIsDiscardOpen(false);
    stopEditing();
  };

  const handleCancel = () => (isDirty ? setIsDiscardOpen(true) : stopEditing());

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await saveCodex(editor.getJSON());
      toast.success('Кодекс збережено');
      stopEditing();
    } catch (error) {
      // The server's refusal was shown by the request itself, the text stays to be corrected
      notifyFailure(error);
    } finally {
      setIsSaving(false);
    }
  };

  const applyLink = (href: string) => {
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    setIsLinkOpen(false);
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setIsLinkOpen(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <header className={styles.header}>
          <h1 className={styles.title}>Кодекс Інарі</h1>

          {canEdit && !isEditing && (
            <Button variant="outlined" startIcon={<EditOutlined />} onClick={startEditing}>
              Редагувати
            </Button>
          )}
          {isEditing && (
            <div className={styles.actions}>
              <Button onClick={handleCancel} disabled={isSaving}>
                Скасувати
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveOutlined />}
                onClick={handleSave}
                disabled={!isDirty || isSaving}
              >
                Зберегти
              </Button>
            </div>
          )}
        </header>

        <figure className={styles.cover}>
          <img src="/codex-cover.png" width={1280} height={720} alt="Правила Лисятника" />
          <figcaption>Правила Лисятника</figcaption>
        </figure>

        {isEditing && <CodexToolbar editor={editor} onLink={() => setIsLinkOpen(true)} />}

        <EditorContent
          editor={editor}
          className={clsx(styles.document, isEditing && styles.editing)}
        />

        {codex.updatedAt && (
          <div className={styles.revision}>Редакція від {formatDay(codex.updatedAt)}</div>
        )}
      </div>

      <LinkDialog
        open={isLinkOpen}
        href={isLinkOpen ? (editor.getAttributes('link').href ?? '') : ''}
        onApply={applyLink}
        onRemove={removeLink}
        onClose={() => setIsLinkOpen(false)}
      />

      <ConfirmDeleteDialog
        open={isDiscardOpen}
        title="Відмінити правки?"
        message="Не збережені зміни зникнуть, а текст повернеться до збереженого."
        confirmLabel="Відмінити"
        cancelLabel="Лишитись у редакторі"
        onConfirm={discard}
        onCancel={() => setIsDiscardOpen(false)}
      />

      <ConfirmDeleteDialog
        open={blocker.state === 'blocked'}
        title="Піти зі сторінки?"
        message="У тексті Кодексу є незбережені правки. Якщо піти зараз, вони зникнуть."
        confirmLabel="Піти"
        cancelLabel="Лишитись"
        autoFocusCancel
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </div>
  );
};

const Codex: FunctionComponent = () => {
  const codex = useCodexStore((state) => state.codex);
  const getCodex = useCodexStore((state) => state.getCodex);
  const [isFresh, setIsFresh] = useState(false);
  const [isFailed, setIsFailed] = useState(false);

  const load = useCallback(() => {
    setIsFailed(false);
    getCodex()
      .then(() => setIsFresh(true))
      .catch((error) => {
        setIsFailed(true);
        notifyFailure(error);
      });
  }, [getCodex]);

  useEffect(() => {
    load();
  }, [load]);

  if (isFailed) {
    return (
      <div className={styles.page}>
        <div className={clsx(styles.column, styles.failure)}>
          Не вдалося завантажити Кодекс.
          <Button onClick={load}>Спробувати ще раз</Button>
        </div>
      </div>
    );
  }

  if (!codex || !isFresh) return <FallbackComponent />;

  return <CodexPage codex={codex} />;
};

export default Codex;
