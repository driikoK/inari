import { FormikErrors } from 'formik';
import { CofType, CoinsType, FormErrorsType, ValuesType } from './types';
import { getPartialValue } from './utils';

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

  const dubCoins = Object.keys(values.main)
    .filter((key) => key.startsWith('dub'))
    .reduce((sum, key) => sum + values.main[key].coin, 0);

  if ((coins.coin+coins.bonusDirector) - totalMainCoins < 0) {
    errors.main = 'Крихти перевищують доступну кількість';
  }

  if ((coins.coin+coins.bonusDirector) - totalMainCoins > 0) {
    errors.main = 'Крихти повністю не вичерпані';
  }

  if (getPartialValue(cof.dub, coins.coin) - dubCoins < 0) {
    errors.main = 'Крихти деберів перевищують число дозволених';
  }

  if (getPartialValue(cof.dub, coins.coin) - dubCoins > 0) {
    errors.main = 'Крихти деберів не вичерпані';
  }

  for (const key in values.main) {
    if (['fixer', 'roleBreaker', 'release'].includes(key)  && Object.hasOwnProperty.call(values.main, key)) {
      if (values.main[key].coin > coins.maxAdditionalOnRole) {
        errors.main = `Крихти для ${key} перевищують максимально допустиме значення`;
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
  return errors;
};
