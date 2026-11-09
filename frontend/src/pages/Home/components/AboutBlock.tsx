import { FunctionComponent } from 'react';
import styles from '../Home.module.scss';

interface AboutItem {
  term: string;
  text: string;
  isHidden?: boolean;
}

export const AboutBlock: FunctionComponent = () => {
  const items: AboutItem[] = [
    {
      term: 'Печивко',
      text: 'прозора система бюджету: надходження, витрати, запити на вивід коштів і фінансова статистика команди.',
    },
    {
      term: 'Видатки',
      text: 'як адмін, виплачувати частування з бюджетів напрямків і тайтлів (на картку, донатом або на розвиток команди) та опрацьовувати запити на печиво й тістечка.',
    },
    {
      term: 'Крихти',
      text: 'як куратор, фіксувати внески у проєкти та бачити, як робота лап і хвостів перетворюється на спільний результат.',
    },
    {
      term: 'Список крихт',
      text: 'відстежувати всі нарахування та прозоро бачити вклад кожного лиса.',
    },
    {
      term: 'Рейтинг',
      text: 'спостерігати, як формується лисяча слава на засадах активності та відданості справі.',
    },
    {
      term: 'Проєкти',
      text: 'поточні роботи, їхні учасники, прогрес і сезонна статистика, щоб кожен знав, де його місце в спільній пригоді.',
    },
    {
      term: 'Пропозиції',
      text: 'майбутні сезони, нові світи й можливість долучитися до проєктів заздалегідь.',
    },
    {
      term: 'Лисяча комора',
      text: 'переглядати та додавати пропозиції тайтлів і ідей, які чекатимуть на своїх лисенят.',
      isHidden: !process.env.VITE_SHEET_EMBED_URL,
    },
    {
      term: 'Кодекс Інарі',
      text: 'правила, що тримають нашу лисячу зграю у гармонії та взаємоповазі.',
      isHidden: !process.env.VITE_CODEX_URL,
    },
  ];

  return (
    <ul className={`fade-up ${styles.about}`}>
      {items
        .filter(({ isHidden }) => !isHidden)
        .map(({ term, text }) => (
          <li key={term} className={styles.aboutItem}>
            <span className={styles.aboutTerm}>{term}</span> — {text}
          </li>
        ))}
    </ul>
  );
};
