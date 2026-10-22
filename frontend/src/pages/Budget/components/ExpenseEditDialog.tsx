import { FC, useEffect, useMemo } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorMessage } from '@hookform/error-message';
import { Box, Button, TextField } from '@mui/material';

import { CustomDialog, ErrorText, H6 } from '@/components';
import { useMembersStore } from '@/stores';
import useBudgetStore, { type ExpenseEntry } from '@/stores/useBudgetStore';
import { notifyFailure } from '@/utils/request';
import {
  budgetPlaces,
  createTreatFormSchema,
  toExpensePayload,
  toTreatValues,
  type TreatFormValues,
} from '../const/expenseForm';
import { isAuditNotSaved } from '../const/options';
import { DateField } from './DateField';
import { PayoutFields } from './PayoutFields';

interface ExpenseEditDialogProps {
  entry: ExpenseEntry;
  onClose: () => void;
}

export const ExpenseEditDialog: FC<ExpenseEditDialogProps> = ({ entry, onClose }) => {
  const summary = useBudgetStore((state) => state.summary);
  const getSummary = useBudgetStore((state) => state.getSummary);
  const updateExpense = useBudgetStore((state) => state.updateExpense);
  const members = useMembersStore((state) => state.membersDictionary);
  const getMembers = useMembersStore((state) => state.getMembers);

  const places = useMemo(() => budgetPlaces(summary), [summary]);
  const nicknames = useMemo(() => members.map(({ nickname }) => nickname), [members]);

  const form = useForm<TreatFormValues>({
    defaultValues: toTreatValues(entry),
    resolver: (values, context, options) =>
      zodResolver(createTreatFormSchema(places, true))(values, context, options),
    mode: 'onChange',
  });
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const hasMembers = members.length > 0;

  useEffect(() => {
    if (!summary) getSummary().catch(notifyFailure);
    if (!hasMembers) getMembers().catch(notifyFailure);
  }, [summary, hasMembers, getSummary, getMembers]);

  const onSubmit = async (values: TreatFormValues) => {
    try {
      await updateExpense(entry._id, toExpensePayload(values, entry.kind, places));
      toast.success('Частування оновлено');
      onClose();
    } catch (error) {
      // The record is saved even when its audit is not, and a form that stayed open would be sent twice
      if (isAuditNotSaved(error)) onClose();

      notifyFailure(error);
    }
  };

  return (
    <CustomDialog open onClose={onClose}>
      <H6>Редагувати частування</H6>

      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <DateField />

            <PayoutFields kind={entry.kind} places={places} nicknames={nicknames} />

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

            <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth>
              Зберегти
            </Button>
          </Box>
        </form>
      </FormProvider>
    </CustomDialog>
  );
};
