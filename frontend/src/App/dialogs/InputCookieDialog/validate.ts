import { FormikErrors } from 'formik';
import { CofType, CoinsType, FormErrorsType, ValuesType } from './types';

export const validate = (
  values: ValuesType,
  coins: CoinsType,
  cof: CofType,
): FormikErrors<FormErrorsType> => {
  const errors: FormikErrors<FormErrorsType> = {};

  const totalMainCoins: number = Object.values(values.main).reduce(
    (sum, item) => sum + item.coin,
    0
  );

  const totalBonusCoins: number = Object.values(values.bonus).reduce(
    (sum, item) => sum + item.coin,
    0
  );

  const mainDubCoins = Object.keys(values.main)
    .filter((key) => key.startsWith('dub'))
    .reduce((sum, key) => sum + values.main[key].coin, 0);

  const bonusDubCoins = Object.keys(values.bonus)
    .filter((key) => key.startsWith('dub'))
    .reduce((sum, key) => sum + values.bonus[key].coin, 0);

  const bonusOthersCoins = ['fixer', 'roleBreaker', 'release'].reduce(
    (sum, key) => sum + values.bonus[key].coin,
    0
  );
  const bonusMainCoins = ['sub', 'sound'].reduce(
    (sum, key) => sum + values.bonus[key].coin,
    0
  );

  if (coins.coin - totalMainCoins < 0) {
    errors.main = 'Основні крихти перевищують доступну кількість';
  }

  if (coins.coin - totalMainCoins > 0) {
    errors.main = 'Основні крихти повністю не вичерпані';
  }

  if (cof.dub - mainDubCoins < 0) {
    errors.main = 'Крихти деберів перевищують число дозволених';
  }

  if (cof.dub - mainDubCoins > 0) {
    errors.main = 'Крихти деберів не вичерпані';
  }

  if (coins.coinBonus - totalBonusCoins < 0) {
    errors.bonus = 'Бонусні крихти перевищують доступну кількість';
  }

  if (coins.coinBonus - totalBonusCoins > 0) {
    errors.bonus = 'Бонусні крихти повністю не вичерпані';
  }

  if (coins.maxBonusForOthers - bonusOthersCoins < 0) {
    errors.bonus =
      'Бонусні крихти перевищують дозволених для фіксера, дабера і розбивача';
  }

  if (coins.maxBonusForOthers - bonusOthersCoins > 0) {
    errors.bonus =
      'Бонусні крихти не вичерпано для фіксера, дабера і розбивача';
  }

  if (coins.maxBonusForMainRoles - (bonusMainCoins + bonusDubCoins) < 0) {
    errors.bonus =
      'Бонусні крихти перевищують дозволених для перекладача, даберів і звукача';
  }

  if (coins.maxBonusForMainRoles - (bonusMainCoins + bonusDubCoins) > 0) {
    errors.bonus =
      'Бонусні крихти не вичерпано для перекладача, даберів і звукача';
  }

  for (const key in values.bonus) {
    if (key !== 'director' && Object.hasOwnProperty.call(values.bonus, key)) {
      if (values.bonus[key].coin > 10) {
        errors.bonus = `Крихти для ${key} перевищують максимально допустиме значення`;
      }
    }
  }

  for (const key in values.main) {
    if (Object.prototype.hasOwnProperty.call(values.main, key)) {
      if (!values.main[key].nickname) {
        errors.main = 'Нікнейми не можуть бути порожнім';
      }
    }
  }

  for (const key in values.bonus) {
    if (Object.prototype.hasOwnProperty.call(values.bonus, key)) {
      if (!values.bonus[key].nickname) {
        errors.bonus = 'Нікнейми не можуть бути порожнім';
      }
    }
  }
  return errors;
};
