import { FC } from 'react';

import OpenInNewIcon from '@mui/icons-material/OpenInNewOutlined';
import { Button } from '@mui/material';

import { CustomDialog, Icon } from '@/components';
import { ParticipantsByRole } from '@/pages/Proposals/components/ParticipantsByRole';
import { ANIME_TYPE } from '@/types';
import type { ProjectView } from '@/stores/useProjectsStore';
import { convertAnimeTypeEngToUkr, linkLabel, MAL_LABEL } from '@/utils/convert';
import MalImg from '/mal.png';
import { formatDay, quotaOf } from '../const/options';
import { ProjectChips } from './ProjectChips';
import styles from './ProjectCard.module.scss';

interface ProjectCardProps {
  open: boolean;
  onClose: () => void;
  project: ProjectView;
  isCurator: boolean;
  onEdit: (project: ProjectView) => void;
  onFinish: (project: ProjectView) => void;
  onReopen: (project: ProjectView) => void;
  onDelete: (project: ProjectView) => void;
}

export const ProjectCard: FC<ProjectCardProps> = ({
  open,
  onClose,
  project,
  isCurator,
  onEdit,
  onFinish,
  onReopen,
  onDelete,
}) => {
  const label = linkLabel(project.link);
  const isSeries = project.titleType === ANIME_TYPE.SERIES;

  const facts = [
    {
      title: 'Посилання',
      value: (
        <a className={styles.link} href={project.link} target="_blank" rel="noreferrer">
          {label === MAL_LABEL ? (
            <Icon img={MalImg} width={20} height={20} />
          ) : (
            <OpenInNewIcon fontSize="small" />
          )}
          {label}
        </a>
      ),
    },
    { title: 'Тип', value: convertAnimeTypeEngToUkr(project.titleType) },
    { title: 'Квота', value: quotaOf(project) },
    isSeries && { title: 'Прогрес', value: `Випущено серій: ${project.episodesReleased}` },
    { title: 'Початок', value: formatDay(project.startDate) },
    project.isFinished &&
      project.endDate && {
        title: 'Завершено',
        value: `${formatDay(project.endDate)}${project.isInTime ? ' · вчасно' : ''}`,
      },
  ].filter((fact) => !!fact);

  return (
    <CustomDialog open={open} onClose={onClose}>
      <div className={styles.card}>
        <div className={styles.head}>
          {project.posterUrl && (
            <img className={styles.poster} src={project.posterUrl} alt={project.ukrName} />
          )}

          <div className={styles.titles}>
            <span className={styles.ukr}>{project.ukrName}</span>
            <span className={styles.romaji}>{project.romajiName}</span>
            {project.codeName && <span className={styles.code}>«{project.codeName}»</span>}
          </div>
        </div>

        <ProjectChips
          mark={project.mark}
          funding={project.funding}
          isSequel={project.isSequel}
          isFinished={project.isFinished}
        />

        <dl className={styles.facts}>
          {facts.map(({ title, value }) => (
            <div className={styles.fact} key={title}>
              <dt>{title}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <ParticipantsByRole
          participants={project.participants.map(({ nickname, roles }) => ({
            userName: nickname,
            roles,
          }))}
        />

        {isCurator && (
          <div className={styles.actions}>
            <Button variant="outlined" onClick={() => onEdit(project)}>
              Редагувати
            </Button>
            {project.isFinished ? (
              <Button variant="outlined" onClick={() => onReopen(project)}>
                Відновити
              </Button>
            ) : (
              <Button variant="contained" onClick={() => onFinish(project)}>
                Завершено
              </Button>
            )}
            <span className={styles.spacer} />
            <Button color="error" variant="outlined" onClick={() => onDelete(project)}>
              Видалити
            </Button>
          </div>
        )}
      </div>
    </CustomDialog>
  );
};
