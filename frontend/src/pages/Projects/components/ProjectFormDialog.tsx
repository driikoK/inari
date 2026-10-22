import { FC, useEffect, useState } from 'react';

import { CircularProgress } from '@mui/material';

import { CustomDialog, H6 } from '@/components';
import useMembersStore from '@/stores/useMembersStore';
import useRolesStore from '@/stores/useRolesStore';
import type { ProjectView } from '@/stores/useProjectsStore';
import type { Proposal } from '@/stores/useProposalsStore';
import { notifyFailure } from '@/utils/request';
import { ProjectForm } from './ProjectForm';

interface ProjectFormDialogProps {
  open: boolean;
  onClose: () => void;
  project?: ProjectView;
  proposal?: Proposal;
}

export const ProjectFormDialog: FC<ProjectFormDialogProps> = ({
  open,
  onClose,
  project,
  proposal,
}) => {
  const membersDictionary = useMembersStore((state) => state.membersDictionary);
  const getMembers = useMembersStore((state) => state.getMembers);
  const getRoles = useRolesStore((state) => state.getRoles);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    Promise.all([getMembers(), getRoles()])
      .catch(notifyFailure)
      .finally(() => setIsReady(true));
  }, [getMembers, getRoles]);

  return (
    <CustomDialog open={open} onClose={onClose}>
      <H6>{project ? 'Редагувати проєкт' : proposal ? 'Запустити проєкт' : 'Новий проєкт'}</H6>

      {isReady ? (
        <ProjectForm
          onClose={onClose}
          nicknames={membersDictionary.map(({ nickname }) => nickname)}
          project={project}
          proposal={proposal}
        />
      ) : (
        <CircularProgress />
      )}
    </CustomDialog>
  );
};
