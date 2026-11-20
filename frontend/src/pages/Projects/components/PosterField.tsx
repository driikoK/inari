import { ChangeEvent, FC, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@mui/material';
import { MovieOutlined } from '@mui/icons-material';

import { MAX_POSTER_BYTES, POSTER_TYPES } from '@/utils/constants';
import styles from './PosterField.module.scss';

interface PosterFieldProps {
  current?: string;
  picked: File | null;
  isRemoved: boolean;
  onPick: (file: File) => void;
  onClear: () => void;
}

export const PosterField: FC<PosterFieldProps> = ({
  current,
  picked,
  isRemoved,
  onPick,
  onClear,
}) => {
  const previewUrl = useMemo(() => (picked ? URL.createObjectURL(picked) : undefined), [picked]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const saved = isRemoved ? undefined : current;
  const shown = previewUrl ?? saved;
  const hasFile = Boolean(picked) || Boolean(saved);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) return;

    if (!POSTER_TYPES.includes(file.type)) {
      toast.error('Завантажте зображення JPEG, PNG або WebP');

      return;
    }

    if (file.size > MAX_POSTER_BYTES) {
      toast.error('Файл завеликий, максимум 5 МБ');

      return;
    }

    onPick(file);
  };

  return (
    <div className={styles.field}>
      {shown ? (
        <img className={styles.preview} src={shown} alt="Постер" />
      ) : (
        <div className={styles.preview}>
          <MovieOutlined />
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.buttons}>
          <Button component="label" variant="outlined" size="small">
            {hasFile ? 'Замінити файл' : 'Завантажити файл'}
            <input
              hidden
              type="file"
              accept={POSTER_TYPES.join(',')}
              data-testid="poster-input"
              onChange={handleChange}
            />
          </Button>

          {hasFile && (
            <Button size="small" color="error" onClick={onClear}>
              {picked ? 'Скасувати вибір' : 'Прибрати файл'}
            </Button>
          )}
        </div>

        <span className={styles.hint}>
          {picked && 'Файл завантажиться, коли ви збережете. '}
          {isRemoved && !picked && 'Файл приберемо, коли ви збережете. '}
          JPEG, PNG або WebP до 5 МБ. Якщо є файл, показується він, а посилання нижче лишається
          запасним.
        </span>
      </div>
    </div>
  );
};
