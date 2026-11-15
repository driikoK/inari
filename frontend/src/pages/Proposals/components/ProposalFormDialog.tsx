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

import { CustomDialog, ErrorText, H6, P } from '@/components';
import useProposalsStore, { type Proposal, type ProposalSeason } from '@/stores/useProposalsStore';
import { NO_FUNDING, TITLE_KIND } from '@/types';
import { notifyFailure } from '@/utils/request';
import {
  createProposalFormSchema,
  toProposalPayload,
  type ProposalFormValues,
} from '../const/form';
import { fundingOptions, kindOptions, seasonLabel } from '../const/options';

interface ProposalFormDialogProps {
  open: boolean;
  onClose: () => void;
  season: ProposalSeason;
  seasons: ProposalSeason[];
  proposal?: Proposal;
}

const toggleSx = { textTransform: 'none' } as const;

const initialValues = (seasonId: string, proposal?: Proposal): ProposalFormValues => ({
  seasonId,
  ukrName: proposal?.ukrName ?? '',
  romajiName: proposal?.romajiName ?? '',
  link: proposal?.link ?? '',
  posterUrl: proposal?.posterUrl ?? '',
  note: proposal?.note ?? '',
  isOngoing: proposal?.isOngoing === false ? TITLE_KIND.OLD : TITLE_KIND.ONGOING,
  funding: proposal?.funding ?? NO_FUNDING,
  isSequel: proposal?.isSequel ?? false,
});

export const ProposalFormDialog: FC<ProposalFormDialogProps> = ({
  open,
  onClose,
  season,
  seasons,
  proposal,
}) => {
  const createProposal = useProposalsStore((state) => state.createProposal);
  const updateProposal = useProposalsStore((state) => state.updateProposal);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProposalFormValues>({
    defaultValues: initialValues(season._id, proposal),
    resolver: zodResolver(createProposalFormSchema()),
    mode: 'onChange',
  });

  const movableSeasons = seasons.filter(
    (candidate) => !candidate.isClosed || candidate._id === season._id,
  );

  const onSubmit = async (values: ProposalFormValues) => {
    try {
      if (proposal) {
        await updateProposal(proposal._id, toProposalPayload(values));
        toast.success('Пропозицію оновлено');
      } else {
        await createProposal({ ...toProposalPayload(values), seasonId: season._id });
        toast.success('Пропозицію додано');
      }

      onClose();
    } catch (error) {
      notifyFailure(error);
    }
  };

  const textField = (name: keyof ProposalFormValues, label: string, multiline = false) => (
    <div>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <TextField
            {...field}
            value={field.value as string}
            label={label}
            multiline={multiline}
            minRows={multiline ? 3 : undefined}
            autoComplete="off"
            fullWidth
          />
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
    <CustomDialog open={open} onClose={onClose}>
      <H6>
        {proposal
          ? 'Редагувати пропозицію'
          : `Нова пропозиція · ${seasonLabel(season.season, season.year)}`}
      </H6>

      <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" style={{ width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {textField('ukrName', 'Назва українською')}
          {textField('romajiName', 'Назва ромаджі')}
          {textField('link', 'Посилання (MAL чи аналогічний ресурс)')}
          {textField('posterUrl', 'Постер (посилання, не обов’язково)')}
          {textField('note', 'Нотатка (не обов’язково)', true)}

          <div>
            <P sx={{ color: 'var(--text-muted)', mb: 0.5 }}>Тип тайтлу</P>
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

          {proposal && (
            <Controller
              control={control}
              name="seasonId"
              render={({ field }) => (
                <TextField {...field} select label="Сезон" fullWidth>
                  {movableSeasons.map((candidate) => (
                    <MenuItem key={candidate._id} value={candidate._id}>
                      {seasonLabel(candidate.season, candidate.year)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          )}

          <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth>
            {proposal ? 'Зберегти' : 'Додати'}
          </Button>
        </Box>
      </form>
    </CustomDialog>
  );
};
