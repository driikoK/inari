import { FC, useEffect, useMemo } from 'react';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/AddOutlined';
import { Box, Button } from '@mui/material';

import { CustomDialog, H6 } from '@/components';
import { useMembersStore } from '@/stores';
import useBudgetStore, { type IncomeEntry } from '@/stores/useBudgetStore';
import useProjectsStore from '@/stores/useProjectsStore';
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
import { isAuditNotSaved } from '../const/options';
import { IncomeLineFields } from './IncomeLineFields';
import { PeriodFields } from './PeriodFields';
import type { ProjectOption } from './TitleField';

interface IncomeFormDialogProps {
  open: boolean;
  onClose: () => void;
  entry?: IncomeEntry;
}

export const IncomeFormDialog: FC<IncomeFormDialogProps> = ({ open, onClose, entry }) => {
  const createIncomes = useBudgetStore((state) => state.createIncomes);
  const updateEntry = useBudgetStore((state) => state.updateEntry);
  const projectSeasons = useProjectsStore((state) => state.seasons);
  const getProjects = useProjectsStore((state) => state.getProjects);
  const members = useMembersStore((state) => state.membersDictionary);
  const getMembers = useMembersStore((state) => state.getMembers);

  const isEdit = !!entry;

  const form = useForm<IncomeFormValues>({
    defaultValues: entry ? toFormValues(entry) : newFormValues(),
    resolver: zodResolver(createIncomeFormSchema()),
    mode: 'onChange',
  });
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

  const hasProjects = projectSeasons.length > 0;
  const hasMembers = members.length > 0;

  useEffect(() => {
    if (!hasProjects) getProjects().catch(notifyFailure);
    if (!hasMembers) getMembers().catch(notifyFailure);
  }, [hasProjects, hasMembers, getProjects, getMembers]);

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
            <PeriodFields
              isManual={isEdit}
              extraYear={entry?.year}
              hint="Сезон підставляється з дати. Змініть його, якщо гроші треба зарахувати в інший сезон."
            />

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
