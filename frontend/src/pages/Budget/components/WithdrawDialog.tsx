import { FC, useEffect, useMemo, useState } from 'react';
import { Controller, FormProvider, useForm, useFormContext } from 'react-hook-form';
import toast from 'react-hot-toast';

import { ErrorMessage } from '@hookform/error-message';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  TextField,
} from '@mui/material';

import { CustomDialog, ErrorText, H6 } from '@/components';
import { seasonLabel } from '@/pages/Proposals/const/options';
import useBudgetStore, {
  type BudgetSummary,
  type PreviewLine,
  type RequestPreview,
} from '@/stores/useBudgetStore';
import { EXPENSE_KIND } from '@/types';
import { notifyFailure } from '@/utils/request';
import {
  expenseKindOptions,
  formatCrumbs,
  formatKop,
  formatRate,
  isAuditNotSaved,
} from '../const/options';
import {
  createRequestFormSchema,
  newRequestValues,
  type OrderPlace,
  orderPlaces,
  REQUEST_KINDS,
  type RequestFormValues,
  type RequestSectionValues,
  toRequestPayload,
} from '../const/requestForm';

interface WithdrawDialogProps {
  summary: BudgetSummary;
  onClose: () => void;
}

const PREVIEW_DELAY = 300;

const REQUISITE_LABEL: Record<EXPENSE_KIND, string> = {
  [EXPENSE_KIND.CARD]: 'Номер карти',
  [EXPENSE_KIND.DONATION]: 'Номер карти або посилання на банку',
  [EXPENSE_KIND.DEVELOPMENT]: '',
};

const Estimate: FC<{ line?: PreviewLine }> = ({ line }) => {
  if (!line?.estimate) return null;

  const { amountKop, parts } = line.estimate;

  return (
    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
      Орієнтовно {formatKop(amountKop)}:{' '}
      {parts
        .map(
          ({ season, year, crumbs, coefficient }) =>
            `${seasonLabel(season, year)} — ${formatCrumbs(crumbs)} × ${formatRate(coefficient)}`,
        )
        .join('; ')}
      . Остаточна сума фіксується, коли адмін виконає запит.
    </div>
  );
};

interface SectionFieldsProps {
  kind: EXPENSE_KIND;
  isOrder: boolean;
  line?: PreviewLine;
}

const SectionFields: FC<SectionFieldsProps> = ({ kind, isOrder, line }) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<RequestFormValues>();

  const name = (field: keyof RequestSectionValues) => `${kind}.${field}` as const;
  const title = expenseKindOptions.find(({ value }) => value === kind)?.label;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 2,
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <div style={{ fontWeight: 600 }}>{title}</div>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 160px' }}>
          <Controller
            control={control}
            name={name('amount')}
            render={({ field }) => (
              <TextField
                {...field}
                label={isOrder ? 'Сума' : 'Кількість крихт'}
                fullWidth
                slotProps={{
                  htmlInput: { inputMode: 'decimal' },
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">{isOrder ? 'грн' : 'крихт'}</InputAdornment>
                    ),
                  },
                }}
              />
            )}
          />
          <ErrorMessage
            name={name('amount')}
            errors={errors}
            render={({ message }) => <ErrorText>{message}</ErrorText>}
          />
        </div>

        {kind !== EXPENSE_KIND.DEVELOPMENT && (
          <div style={{ flex: '2 1 240px' }}>
            <Controller
              control={control}
              name={name('requisite')}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={REQUISITE_LABEL[kind]}
                  fullWidth
                  slotProps={{ htmlInput: { autoComplete: 'off' } }}
                />
              )}
            />
            <ErrorMessage
              name={name('requisite')}
              errors={errors}
              render={({ message }) => <ErrorText>{message}</ErrorText>}
            />
          </div>
        )}
      </Box>

      <Estimate line={line} />
    </Box>
  );
};

export const WithdrawDialog: FC<WithdrawDialogProps> = ({ summary, onClose }) => {
  const withdrawal = useBudgetStore((state) => state.withdrawal);
  const createRequest = useBudgetStore((state) => state.createRequest);
  const previewRequest = useBudgetStore((state) => state.previewRequest);

  const places = useMemo(() => orderPlaces(summary), [summary]);
  const [preview, setPreview] = useState<RequestPreview | null>(null);

  const form = useForm<RequestFormValues>({
    defaultValues: newRequestValues(),
    resolver: (values, context, options) =>
      zodResolver(createRequestFormSchema(places))(values, context, options),
    mode: 'onChange',
  });
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = form;

  const values = watch();
  const { isOrder } = values;

  // The server prices the lines and says if the crumbs are there, the page adds nothing up
  const draft = isValid ? toRequestPayload(values, places) : null;
  const draftKey = draft && draft.lines.length > 0 ? JSON.stringify(draft) : null;

  useEffect(() => {
    if (!draftKey) {
      setPreview(null);

      return;
    }

    let isCurrent = true;
    const timer = setTimeout(() => {
      previewRequest(JSON.parse(draftKey))
        .then((result) => isCurrent && setPreview(result))
        .catch(() => isCurrent && setPreview(null));
    }, PREVIEW_DELAY);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [draftKey, previewRequest]);

  const onSubmit = async (submitted: RequestFormValues) => {
    const payload = toRequestPayload(submitted, places);

    if (payload.lines.length === 0) {
      setError('root', { type: 'custom', message: 'Заповніть хоча б один розділ' });

      return;
    }

    try {
      await createRequest(payload);
      toast.success('Запит подано');
      onClose();
    } catch (error) {
      if (isAuditNotSaved(error)) onClose();

      notifyFailure(error);
    }
  };

  const switchKind = (checked: boolean) => {
    setValue('isOrder', checked, { shouldValidate: true });

    // An amount means crumbs in one kind of request and hryvnias in the other
    for (const kind of REQUEST_KINDS) setValue(kind, { ...values[kind], amount: '' });
  };

  return (
    <CustomDialog open onClose={onClose}>
      <H6>Вивести крихти</H6>

      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 14 }}>
              Учасник: <b>{withdrawal?.nickname}</b>
            </div>

            {!isOrder && withdrawal && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Можна вивести зараз: <b>{formatCrumbs(withdrawal.availableCrumbs)}</b> крихт
                {withdrawal.reservedCrumbs > 0 &&
                  ` (ще ${formatCrumbs(withdrawal.reservedCrumbs)} уже в запитах)`}
                . Виводяться крихти завершених сезонів, найстаріші першими, за коефіцієнтом свого
                сезону.
              </div>
            )}

            <Controller
              control={control}
              name="isOrder"
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value}
                      onChange={(event) => switchKind(event.target.checked)}
                    />
                  }
                  label="Замовлення: гроші за виконане замовлення з бюджету тайтла, крихти не знімаються"
                />
              )}
            />

            {isOrder && (
              <div>
                <Controller
                  control={control}
                  name="place"
                  render={({ field }) => (
                    <Autocomplete<OrderPlace>
                      options={places}
                      getOptionLabel={(option) => option.title}
                      isOptionEqualToValue={(option, value) => option.key === value.key}
                      value={places.find(({ key }) => key === field.value) ?? null}
                      onChange={(_, option) => field.onChange(option?.key ?? '')}
                      noOptionsText="Бюджетів замовлень ще немає"
                      renderOption={({ key, ...props }, option) => (
                        <li key={key} {...props}>
                          <div>
                            <div>{option.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              Залишок {formatKop(option.balanceKop)}
                            </div>
                          </div>
                        </li>
                      )}
                      renderInput={(params) => <TextField {...params} label="Тайтл замовлення" />}
                    />
                  )}
                />
                <ErrorMessage
                  name="place"
                  errors={errors}
                  render={({ message }) => <ErrorText>{message}</ErrorText>}
                />
              </div>
            )}

            {REQUEST_KINDS.map((kind) => (
              <SectionFields
                key={kind}
                kind={kind}
                isOrder={isOrder}
                line={preview?.lines.find((line) => line.kind === kind)}
              />
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

            {preview?.problem && <ErrorText>{preview.problem}</ErrorText>}

            <ErrorMessage
              name="root"
              errors={errors}
              render={({ message }) => <ErrorText>{message}</ErrorText>}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || !!preview?.problem}
              fullWidth
            >
              Вивести
            </Button>
          </Box>
        </form>
      </FormProvider>
    </CustomDialog>
  );
};
