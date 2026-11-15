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
          Ласкаво просимо до лисятника — простору, де кожен лис творить, зростає й залишає свій слід
          у спільній магії локалізації. Це — серце нашого творчого об’єднання, місце, де
          зберігаються крихти праці, печивко вдячності, історії проєктів і шлях команди крізь
          сезони.
        </p>
        {!isLoggedIn && (
          <div className={styles.heroActions}>
            <Button variant="contained" onClick={() => navigate('/login')}>
              Увійти →
            </Button>
          </div>
        )}
      </div>

      <div className={styles.heroImageWrapper}>
        <img src="/fox.jpg" className={styles.heroImage} alt="fox" />
      </div>
    </div>
  );
};
