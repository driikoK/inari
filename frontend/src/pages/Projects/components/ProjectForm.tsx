import { FC, useState } from 'react';
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
import {
  COLLAB_TEAM,
  collabOptions,
  hasEpisodeCount,
  latestStartDay,
  MIN_DAY,
  projectTypes,
  todayDay,
} from '../const/options';
import { ParticipantsEditor } from './ParticipantsEditor';
import { PosterField } from './PosterField';

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
  collabTeam: 'Команда, з якою співпрацюємо',
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
  const uploadPoster = useProjectsStore((state) => state.uploadPoster);
  const deletePoster = useProjectsStore((state) => state.deletePoster);
  const getProposals = useProposalsStore((state) => state.getProposals);
  const today = todayDay();
  const [pickedPoster, setPickedPoster] = useState<File | null>(null);
  const [isPosterRemoved, setIsPosterRemoved] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<ProjectFormValues>({
    defaultValues: initialValues(today, nicknames, project, proposal),
    resolver: zodResolver(createProjectFormSchema(today)),
    mode: 'onChange',
  });

  const titleType = watch('titleType');
  const isFinished = watch('isFinished');
  const collab = watch('collab');

  // The project is saved by now, so a poster that fails does not keep the form open:
  // saving again would make a second project
  const applyPoster = async (id: string) => {
    try {
      if (pickedPoster) await uploadPoster(id, pickedPoster);
      else if (isPosterRemoved) await deletePoster(id);
    } catch (error) {
      notifyFailure(error);
      toast.error('Проєкт збережено, але постер не змінився');
    }
  };

  const onSubmit = async (values: ProjectFormValues) => {
    const payload = toProjectPayload(values);
    let id: string;

    try {
      if (project) {
        await updateProject(project._id, { ...payload, ...toFinishedPayload(values) });
        id = project._id;
        toast.success('Проєкт оновлено');
      } else {
        id = await createProject({
          ...payload,
          ...toFinishedPayload(values),
          proposalId: proposal?._id,
        });
        toast.success('Проєкт створено');

        if (proposal) getProposals().catch(notifyFailure);
      }
    } catch (error) {
      notifyFailure(error);

      return;
    }

    await applyPoster(id);
    onClose();
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

  const dateField = (name: 'startDate' | 'endDate', label: string, max: string) => (
    <div>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <DateInput {...field} label={label} min={MIN_DAY} max={max} fullWidth />
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

        <PosterField
          current={project?.posterFile ? project.poster : undefined}
          picked={pickedPoster}
          isRemoved={isPosterRemoved}
          onPick={(file) => {
            setPickedPoster(file);
            setIsPosterRemoved(false);
          }}
          onClear={() => (pickedPoster ? setPickedPoster(null) : setIsPosterRemoved(true))}
        />
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

        <div>
          <P sx={{ color: 'var(--text-muted)', mb: 0.5 }}>Співпраця з іншою командою</P>
          <Controller
            control={control}
            name="collab"
            render={({ field }) => (
              <ToggleButtonGroup
                exclusive
                color="primary"
                size="small"
                value={field.value}
                onChange={(_, next) => next && field.onChange(next)}
              >
                {collabOptions.map((option) => (
                  <ToggleButton key={option.value} value={option.value} sx={toggleSx}>
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            )}
          />
        </div>

        {collab === COLLAB_TEAM && textField('collabTeam')}

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

        {dateField('startDate', 'Дата початку', latestStartDay(today))}

        {hasEpisodeCount(titleType) && (
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
            {dateField('endDate', 'Дата фіналу', today)}

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
                submitCount={submitCount}
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
