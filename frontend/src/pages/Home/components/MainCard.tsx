import { FunctionComponent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import styles from '../Home.module.scss';

export const MainCard: FunctionComponent<{ isLoggedIn: boolean }> = ({ isLoggedIn }) => {
  const navigate = useNavigate();

  return (
    <div className={`fade-up ${styles.hero}`}>
      <div className={styles.heroGlowTop} />
      <div className={styles.heroGlowBottom} />

      <div className={styles.heroContent}>
        <div className={styles.heroBadgeRow}>
          <span className={styles.heroBadge}>✦ Вітаємо</span>
        </div>
        <h1 className={styles.heroTitle}>
          Привіт,
          <br />
          <span className={styles.heroTitleAccent}>Інарчата!</span> 🦊
        </h1>
        <p className={styles.heroDescription}>
          Система обліку крихт аніме-субтитрів гурту Inari. Відстежуй прогрес, докладай лапу до
          тайтлів та переглядай рейтинги.
        </p>
        <div className={styles.heroActions}>
          {isLoggedIn ? (
            <>
              <Button variant="contained" onClick={() => navigate('/cookie')}>
                Крихти →
              </Button>
              <Button variant="outlined" onClick={() => navigate('/cookie/rating')}>
                Рейтинг
              </Button>
            </>
          ) : (
            <Button variant="contained" onClick={() => navigate('/login')}>
              Увійти →
            </Button>
          )}
        </div>
      </div>

      <div className={styles.heroImageWrapper}>
        <img src="/fox.jpg" className={styles.heroImage} alt="fox" />
      </div>
    </div>
  );
};
