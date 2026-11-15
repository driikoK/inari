import { FC, useMemo, useRef } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorMessage } from '@hookform/error-message';
import { Box, Button, TextField } from '@mui/material';

import { ErrorText } from '@/components';
import { DateField } from '@/pages/Budget/components/DateField';
import { PayoutFields } from '@/pages/Budget/components/PayoutFields';
import {
  budgetPlaces,
  createTreatFormSchema,
  newTreatValues,
  PAYOUT_KINDS,
  toExpensesPayload,
  type TreatFormValues,
} from '@/pages/Budget/const/expenseForm';
import { isAuditNotSaved } from '@/pages/Budget/const/options';
import { useMembersStore } from '@/stores';
import useBudgetStore from '@/stores/useBudgetStore';
import { notifyFailure } from '@/utils/request';
import styles from '../Expenses.module.scss';

export const TreatForm: FC = () => {
  const summary = useBudgetStore((state) => state.summary);
  const createExpenses = useBudgetStore((state) => state.createExpenses);
  const members = useMembersStore((state) => state.membersDictionary);

  const places = useMemo(() => budgetPlaces(summary), [summary]);
  const nicknames = useMemo(() => members.map(({ nickname }) => nickname), [members]);

  // The budgets arrive after the form is made, and the check must see them
  const placesRef = useRef(places);

  placesRef.current = places;

  const form = useForm<TreatFormValues>({
    defaultValues: newTreatValues(),
    resolver: (values, context, options) =>
      zodResolver(createTreatFormSchema(placesRef.current))(values, context, options),
    mode: 'onChange',
  });
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (values: TreatFormValues) => {
    const payload = toExpensesPayload(values, places);

    if (payload.lines.length === 0) {
      setError('root', { type: 'custom', message: 'Заповніть хоча б один розділ' });

      return;
    }

    try {
      await createExpenses(payload);
      toast.success('Частування записано');
      reset(newTreatValues());
    } catch (error) {
      // The record is saved even when its audit is not, and a form that stayed open would be sent twice
      if (isAuditNotSaved(error)) reset(newTreatValues());

      notifyFailure(error);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.hint}>
          Заповніть один розділ або всі разом. Гроші зменшать бюджет, який ви оберете в кожному
          розділі. Номер карти не зберігається повністю, лишаються тільки останні чотири цифри.
        </div>

        <DateField maxWidth={220} />

        {PAYOUT_KINDS.map((kind) => (
          <PayoutFields key={kind} kind={kind} places={places} nicknames={nicknames} />
        ))}

        <div>
          <Controller
            control={control}
            name="comment"
            render={({ field }) => (
              <TextField {...field} label="Коментар" multiline minRows={2} fullWidth />
            )}
          />
          <ErrorMessage
            name="comment"
            errors={errors}
            render={({ message }) => <ErrorText>{message}</ErrorText>}
          />
        </div>

        <ErrorMessage
          name="root"
          errors={errors}
          render={({ message }) => <ErrorText>{message}</ErrorText>}
        />

        <Box>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Вивести
          </Button>
        </Box>
      </form>
    </FormProvider>
  );
};
