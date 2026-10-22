import { FC } from 'react';
import clsx from 'clsx';

import MovieOutlinedIcon from '@mui/icons-material/MovieOutlined';

import type { ProjectView } from '@/stores/useProjectsStore';
import { ProjectChips } from './ProjectChips';
import styles from './ProjectTile.module.scss';

interface ProjectTileProps {
  project: ProjectView;
  isInactive: boolean;
  isOpenable: boolean;
  onOpen: (project: ProjectView) => void;
}

export const ProjectTile: FC<ProjectTileProps> = ({ project, isInactive, isOpenable, onOpen }) => (
  <button
    type="button"
    className={clsx(styles.tile, isInactive && styles.inactive)}
    disabled={!isOpenable}
    onClick={() => onOpen(project)}
  >
    {project.posterUrl ? (
      <img className={styles.poster} src={project.posterUrl} alt={project.ukrName} />
    ) : (
      <div className={styles.placeholder}>
        <MovieOutlinedIcon fontSize="large" />
      </div>
    )}

    <div className={styles.body}>
      <span className={styles.ukr}>{project.ukrName}</span>
      <span className={styles.romaji}>{project.romajiName}</span>

      <ProjectChips
        mark={project.mark}
        funding={project.funding}
        isSequel={project.isSequel}
        isFinished={project.isFinished}
      />
    </div>
  </button>
);
