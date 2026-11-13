import { FC } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorMessage } from '@hookform/error-message';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

import { DateInput, ErrorText, P } from '@/components';
import { fundingOptions, kindOptions } from '@/pages/Proposals/const/options';
import useProjectsStore, { type ProjectView } from '@/stores/useProjectsStore';
import useProposalsStore, { type Proposal } from '@/stores/useProposalsStore';
import { ANIME_TYPE } from '@/types';
import { notifyFailure } from '@/utils/request';
import {
  createProjectFormSchema,
  emptyProjectForm,
  fromProject,
  fromProposal,
  toFinishedPayload,
  toProjectPayload,
  type ProjectFormValues,
} from '../const/form';
import { MIN_DAY, projectTypes, todayDay } from '../const/options';
import { ParticipantsEditor } from './ParticipantsEditor';

interface ProjectFormProps {
  onClose: () => void;
  nicknames: string[];
  project?: ProjectView;
  proposal?: Proposal;
}

const toggleSx = { textTransform: 'none' } as const;

const textFieldLabels = {
  ukrName: 'Назва українською',
  romajiName: 'Назва ромаджі',
  codeName: 'Кодова назва (не обов’язково)',
  link: 'Посилання (MAL чи аналогічний ресурс)',
  posterUrl: 'Постер (посилання, не обов’язково)',
} as const;

const initialValues = (
  today: string,
  nicknames: string[],
  project?: ProjectView,
  proposal?: Proposal,
) => {
  if (project) return fromProject(project);
  if (proposal) return fromProposal(proposal, nicknames, today);

  return emptyProjectForm(today);
};

export const ProjectForm: FC<ProjectFormProps> = ({ onClose, nicknames, project, proposal }) => {
  const createProject = useProjectsStore((state) => state.createProject);
  const updateProject = useProjectsStore((state) => state.updateProject);
  const getProposals = useProposalsStore((state) => state.getProposals);
  const today = todayDay();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    defaultValues: initialValues(today, nicknames, project, proposal),
    resolver: zodResolver(createProjectFormSchema(today)),
    mode: 'onChange',
  });

  const titleType = watch('titleType');
  const isFinished = watch('isFinished');

  const onSubmit = async (values: ProjectFormValues) => {
    const payload = toProjectPayload(values);

    try {
      if (project) {
        await updateProject(project._id, { ...payload, ...toFinishedPayload(values) });
        toast.success('Проєкт оновлено');
      } else {
        await createProject({
          ...payload,
          ...toFinishedPayload(values),
          proposalId: proposal?._id,
        });
        toast.success('Проєкт створено');

        if (proposal) getProposals().catch(notifyFailure);
      }

      onClose();
    } catch (error) {
      notifyFailure(error);
    }
  };

  const textField = (name: keyof typeof textFieldLabels) => (
    <div>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <TextField {...field} label={textFieldLabels[name]} autoComplete="off" fullWidth />
        )}
      />
      <ErrorMessage
        name={name}
        errors={errors}
        render={({ message }) => <ErrorText>{message}</ErrorText>}
      />
    </div>
  );

  const dateField = (name: 'startDate' | 'endDate', label: string) => (
    <div>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <DateInput {...field} label={label} min={MIN_DAY} max={today} fullWidth />
        )}
      />
      <ErrorMessage
        name={name}
        errors={errors}
        render={({ message }) => <ErrorText>{message}</ErrorText>}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" style={{ width: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {textField('ukrName')}
        {textField('romajiName')}
        {textField('codeName')}
        {textField('link')}
        {textField('posterUrl')}

        <Controller
          control={control}
          name="titleType"
          render={({ field }) => (
            <TextField {...field} select label="Тип проєкту" fullWidth>
              {projectTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <div>
          <P sx={{ color: 'var(--text-muted)', mb: 0.5 }}>Вид</P>
          <Controller
            control={control}
            name="isOngoing"
            render={({ field }) => (
              <ToggleButtonGroup
                exclusive
                color="primary"
                size="small"
                value={field.value}
                onChange={(_, next) => next && field.onChange(next)}
              >
                {kindOptions.map((option) => (
                  <ToggleButton key={option.value} value={option.value} sx={toggleSx}>
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            )}
          />
        </div>

        <div>
          <P sx={{ color: 'var(--text-muted)', mb: 0.5 }}>Меценатський / замовлення</P>
          <Controller
            control={control}
            name="funding"
            render={({ field }) => (
              <ToggleButtonGroup
                exclusive
                color="primary"
                size="small"
                value={field.value}
                onChange={(_, next) => next && field.onChange(next)}
              >
                {fundingOptions.map((option) => (
                  <ToggleButton key={option.value} value={option.value} sx={toggleSx}>
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            )}
          />
        </div>

        <Controller
          control={control}
          name="isSequel"
          render={({ field }) => (
            <FormControlLabel
              label="Продовження"
              control={<Checkbox checked={field.value} onChange={field.onChange} />}
            />
          )}
        />

        {dateField('startDate', 'Дата початку')}

        {titleType === ANIME_TYPE.SERIES && (
          <div>
            <Controller
              control={control}
              name="episodesReleased"
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Випущено серій"
                  slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                  fullWidth
                />
              )}
            />
            <ErrorMessage
              name="episodesReleased"
              errors={errors}
              render={({ message }) => <ErrorText>{message}</ErrorText>}
            />
          </div>
        )}

        {!project && (
          <Controller
            control={control}
            name="isFinished"
            render={({ field }) => (
              <FormControlLabel
                label="Вже завершено"
                control={<Checkbox checked={field.value} onChange={field.onChange} />}
              />
            )}
          />
        )}

        {isFinished && (
          <>
            {dateField('endDate', 'Дата фіналу')}

            <Controller
              control={control}
              name="isInTime"
              render={({ field }) => (
                <FormControlLabel
                  label="Завершено вчасно"
                  control={<Checkbox checked={field.value} onChange={field.onChange} />}
                />
              )}
            />

            {!project && (
              <P sx={{ color: 'var(--text-muted)' }}>
                Для старого тайтлу вкажіть справжню дату фіналу, інакше він вважатиметься боргом.
              </P>
            )}
          </>
        )}

        <div>
          <P sx={{ color: 'var(--text-muted)', mb: 1 }}>Учасники</P>
          <Controller
            control={control}
            name="participants"
            render={({ field }) => (
              <ParticipantsEditor
                value={field.value}
                onChange={field.onChange}
                nicknames={nicknames}
                errors={errors.participants}
              />
            )}
          />
        </div>

        <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth>
          {project ? 'Зберегти' : 'Створити'}
        </Button>
      </Box>
    </form>
  );
};
