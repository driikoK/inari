import { FC, useEffect, useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorMessage } from '@hookform/error-message';
import { Box, Button, InputAdornment, TextField } from '@mui/material';

import { CustomDialog, ErrorText, H6 } from '@/components';
import useBudgetStore, { type BudgetSummary, type SupportPreview } from '@/stores/useBudgetStore';
import { SUPPORT_DIRECTION } from '@/types';
import { notifyFailure } from '@/utils/request';
import {
  balanceOf,
  createSupportFormSchema,
  newSupportValues,
  toSupportPayload,
  type SupportFormValues,
} from '../const/supportForm';
import { directionOptions, formatKop, isAuditNotSaved } from '../const/options';
import { PeriodFields } from './PeriodFields';

interface SupportBudgetDialogProps {
  summary: BudgetSummary;
  onClose: () => void;
}

const PREVIEW_DELAY = 300;

export const SupportBudgetDialog: FC<SupportBudgetDialogProps> = ({ summary, onClose }) => {
  const updateSupport = useBudgetStore((state) => state.updateSupport);
  const previewSupport = useBudgetStore((state) => state.previewSupport);

  const form = useForm<SupportFormValues>({
    defaultValues: newSupportValues(summary),
    resolver: zodResolver(createSupportFormSchema()),
    mode: 'onChange',
  });
  const {
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = form;

  const values = watch();
  const [preview, setPreview] = useState<SupportPreview | null>(null);

  // The server does the sums: how much the new budgets take out of the jar and what is left in it
  const draft = isValid ? toSupportPayload(values, summary) : null;
  const payloadKey = draft && draft.targets.length > 0 ? JSON.stringify(draft) : null;

  useEffect(() => {
    if (!payloadKey) {
      setPreview(null);

      return;
    }

    let isCurrent = true;
    const timer = setTimeout(() => {
      previewSupport(JSON.parse(payloadKey))
        .then((result) => isCurrent && setPreview(result))
        .catch(() => isCurrent && setPreview(null));
    }, PREVIEW_DELAY);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [payloadKey, previewSupport]);

  const onSubmit = async (submitted: SupportFormValues) => {
    const payload = toSupportPayload(submitted, summary);

    if (payload.targets.length === 0) {
      setError('root', { type: 'custom', message: 'Жоден бюджет не змінився' });

      return;
    }

    try {
      await updateSupport(payload);
      toast.success('Печивко підтримки оновлено');
      onClose();
    } catch (error) {
      // The record is saved even when its audit is not, and a form that stayed open would be sent twice
      if (isAuditNotSaved(error)) onClose();

      notifyFailure(error);
    }
  };

  return (
    <CustomDialog open onClose={onClose}>
      <H6>Бюджети напрямків підтримки</H6>

      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <PeriodFields hint="Різницю з тим, що напрямок має зараз, буде взято з банки цього сезону або повернено в неї." />

            {directionOptions.map(({ value, label }) => (
              <div key={value}>
                <Controller
                  control={control}
                  name={`targets.${value}`}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={label}
                      fullWidth
                      helperText={`Зараз: ${formatKop(balanceOf(summary, value as SUPPORT_DIRECTION))}`}
                      slotProps={{
                        htmlInput: { inputMode: 'decimal' },
                        input: {
                          endAdornment: <InputAdornment position="end">грн</InputAdornment>,
                        },
                      }}
                    />
                  )}
                />
                <ErrorMessage
                  name={`targets.${value}`}
                  errors={errors}
                  render={({ message }) => <ErrorText>{message}</ErrorText>}
                />
              </div>
            ))}

            {preview && (
              <div style={{ fontSize: 14 }}>
                {preview.takenKop >= 0 ? 'З банки сезону буде взято' : 'У банку сезону повернеться'}
                : <b>{formatKop(Math.abs(preview.takenKop))}</b> · у банці зараз{' '}
                {formatKop(preview.jarKop)}, стане {formatKop(preview.jarAfterKop)}
              </div>
            )}

            {preview?.problem && <ErrorText>{preview.problem}</ErrorText>}

            <ErrorMessage
              name="root"
              errors={errors}
              render={({ message }) => <ErrorText>{message}</ErrorText>}
            />

            <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth>
              Зберегти
            </Button>
          </Box>
        </form>
      </FormProvider>
    </CustomDialog>
  );
};
