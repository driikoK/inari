import { FC, useEffect, useMemo, useState } from 'react';
import { Controller, FormProvider, useFieldArray, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorMessage } from '@hookform/error-message';
import AddIcon from '@mui/icons-material/AddOutlined';
import { Box, Button, MenuItem, TextField } from '@mui/material';

import { CustomDialog, ErrorText, H6 } from '@/components';
import { MIN_DAY, todayDay } from '@/pages/Projects/const/options';
import { useMembersStore } from '@/stores';
import useBudgetStore, { type BudgetEntry } from '@/stores/useBudgetStore';
import useProjectsStore from '@/stores/useProjectsStore';
import { seasonOptions } from '@/utils/constants';
import { notifyFailure } from '@/utils/request';
import {
  createIncomeFormSchema,
  emptyLine,
  type IncomeFormValues,
  newFormValues,
  toFormValues,
  toIncomePayload,
  toIncomesPayload,
} from '../const/form';
import { isAuditNotSaved, seasonOfDay } from '../const/options';
import { IncomeLineFields } from './IncomeLineFields';
import type { ProjectOption } from './TitleField';

interface IncomeFormDialogProps {
  open: boolean;
  onClose: () => void;
  entry?: BudgetEntry;
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const IncomeFormDialog: FC<IncomeFormDialogProps> = ({ open, onClose, entry }) => {
  const createIncomes = useBudgetStore((state) => state.createIncomes);
  const updateEntry = useBudgetStore((state) => state.updateEntry);
  const projectSeasons = useProjectsStore((state) => state.seasons);
  const getProjects = useProjectsStore((state) => state.getProjects);
  const members = useMembersStore((state) => state.membersDictionary);
  const getMembers = useMembersStore((state) => state.getMembers);

  const isEdit = !!entry;
  const [isSeasonManual, setIsSeasonManual] = useState(isEdit);

  const form = useForm<IncomeFormValues>({
    defaultValues: entry ? toFormValues(entry) : newFormValues(),
    resolver: zodResolver(createIncomeFormSchema()),
    mode: 'onChange',
  });
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const date = watch('date');

  const hasProjects = projectSeasons.length > 0;
  const hasMembers = members.length > 0;

  useEffect(() => {
    if (!hasProjects) getProjects().catch(notifyFailure);
    if (!hasMembers) getMembers().catch(notifyFailure);
  }, [hasProjects, hasMembers, getProjects, getMembers]);

  useEffect(() => {
    if (isSeasonManual || !DAY_PATTERN.test(date)) return;

    const { season, year } = seasonOfDay(date);

    setValue('season', season);
    setValue('year', String(year));
  }, [date, isSeasonManual, setValue]);

  const projectOptions = useMemo<ProjectOption[]>(() => {
    const unique = new Map<string, ProjectOption & { startDate: string }>();

    for (const { projects } of projectSeasons) {
      for (const project of projects) {
        unique.set(project._id, {
          id: project._id,
          label: project.ukrName,
          romaji: project.romajiName,
          startDate: project.startDate,
        });
      }
    }

    return [...unique.values()].sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [projectSeasons]);

  const nicknames = useMemo(() => members.map(({ nickname }) => nickname), [members]);

  const years = useMemo(() => {
    const first = Number(MIN_DAY.slice(0, 4));
    const last = Number(todayDay().slice(0, 4)) + 1;
    const list = Array.from({ length: last - first + 1 }, (_, step) => first + step);

    return entry && !list.includes(entry.year) ? [...list, entry.year] : list;
  }, [entry]);

  const onSubmit = async (values: IncomeFormValues) => {
    try {
      if (entry) {
        await updateEntry(entry._id, toIncomePayload(values));
        toast.success('Надходження оновлено');
      } else {
        await createIncomes(toIncomesPayload(values));
        toast.success('Надходження додано');
      }

      onClose();
    } catch (error) {
      // The record is saved even when its audit is not, and a form that stayed open would be sent twice
      if (isAuditNotSaved(error)) onClose();

      notifyFailure(error);
    }
  };

  return (
    <CustomDialog open={open} onClose={onClose}>
      <H6>{isEdit ? 'Редагувати надходження' : 'Нові надходження'}</H6>

      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 160px' }}>
                <Controller
                  control={control}
                  name="date"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      label="Дата"
                      fullWidth
                      slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: { min: MIN_DAY, max: todayDay() },
                      }}
                    />
                  )}
                />
                <ErrorMessage
                  name="date"
                  errors={errors}
                  render={({ message }) => <ErrorText>{message}</ErrorText>}
                />
              </div>

              <div style={{ flex: '1 1 120px' }}>
                <Controller
                  control={control}
                  name="season"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Сезон"
                      fullWidth
                      onChange={(event) => {
                        setIsSeasonManual(true);
                        field.onChange(event);
                      }}
                    >
                      {seasonOptions.map(({ value, label }) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <ErrorMessage
                  name="season"
                  errors={errors}
                  render={({ message }) => <ErrorText>{message}</ErrorText>}
                />
              </div>

              <div style={{ flex: '1 1 100px' }}>
                <Controller
                  control={control}
                  name="year"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Рік"
                      fullWidth
                      onChange={(event) => {
                        setIsSeasonManual(true);
                        field.onChange(event);
                      }}
                    >
                      {years.map((year) => (
                        <MenuItem key={year} value={String(year)}>
                          {year}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <ErrorMessage
                  name="year"
                  errors={errors}
                  render={({ message }) => <ErrorText>{message}</ErrorText>}
                />
              </div>
            </Box>

            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Сезон підставляється з дати. Змініть його, якщо гроші треба зарахувати в інший сезон.
            </div>

            {fields.map((field, index) => (
              <IncomeLineFields
                key={field.id}
                index={index}
                canRemove={!isEdit && fields.length > 1}
                onRemove={() => remove(index)}
                projectOptions={projectOptions}
                nicknames={nicknames}
              />
            ))}

            {!isEdit && (
              <Button
                startIcon={<AddIcon />}
                onClick={() => append(emptyLine())}
                sx={{ alignSelf: 'flex-start' }}
              >
                Додати ще надходження
              </Button>
            )}

            <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth>
              {isEdit ? 'Зберегти' : 'Внести'}
            </Button>
          </Box>
        </form>
      </FormProvider>
    </CustomDialog>
  );
};
