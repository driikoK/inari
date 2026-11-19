import { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';

import styles from './RouteError.module.scss';

export const RouteError = () => {
  const error = useRouteError();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Щось пішло не так</h1>
      <p className={styles.hint}>Оновіть сторінку. Якщо помилка повторюється, напишіть адміну.</p>
      <button type="button" className={styles.button} onClick={() => window.location.reload()}>
        Оновити сторінку
      </button>
    </div>
  );
};
