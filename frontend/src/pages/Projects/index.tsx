import { FC, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import AddIcon from '@mui/icons-material/AddOutlined';
import { Button, CircularProgress, Tab, Tabs } from '@mui/material';

import { ConfirmDeleteDialog } from '@/components';
import { SUBJECTS } from '@/context/casl';
import { usePermissions } from '@/hooks';
import { seasonLabel } from '@/pages/Proposals/const/options';
import useProjectsStore, { type ProjectSeason, type ProjectView } from '@/stores/useProjectsStore';
import useRolesStore from '@/stores/useRolesStore';
import { notifyFailure } from '@/utils/request';
import { FinishProjectDialog } from './components/FinishProjectDialog';
import { ProjectCard } from './components/ProjectCard';
import { ProjectFormDialog } from './components/ProjectFormDialog';
import { ProjectTile } from './components/ProjectTile';
import { SeasonStats } from './components/SeasonStats';
import styles from './Projects.module.scss';

const keyOf = (season: ProjectSeason) => `${season.season}-${season.year}`;

const isInactive = (season: ProjectSeason, project: ProjectView) =>
  season.isCurrent && project.isFinished;

const Projects: FC = () => {
  const { seasons, isLoading, getProjects, reopenProject, deleteProject } = useProjectsStore();
  const getRoles = useRolesStore((state) => state.getRoles);
  const { hasAccess } = usePermissions();
  const isCurator = hasAccess(SUBJECTS.MANAGE_PROJECTS);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedId = searchParams.get('project');

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<ProjectView | null>(null);
  const [projectToFinish, setProjectToFinish] = useState<ProjectView | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ProjectView | null>(null);
  const [isFetched, setIsFetched] = useState(false);

  useEffect(() => {
    getProjects()
      .catch(notifyFailure)
      .finally(() => setIsFetched(true));
    getRoles().catch(notifyFailure);
  }, [getProjects, getRoles]);

  const current =
    seasons.find((season) => keyOf(season) === selectedKey) ??
    seasons.find((season) => season.isCurrent) ??
    seasons[0];

  const isOpenable = (season: ProjectSeason, project: ProjectView) =>
    isCurator || !isInactive(season, project);

  useEffect(() => {
    if (!requestedId || !isFetched) return;

    const season = [...seasons]
      .reverse()
      .find(({ projects }) => projects.some((project) => project._id === requestedId));
    const project = season?.projects.find(({ _id }) => _id === requestedId);

    setSearchParams({}, { replace: true });

    if (!season || !project) return;

    setSelectedKey(keyOf(season));
    if (isCurator || !isInactive(season, project)) setOpenId(requestedId);
  }, [requestedId, isFetched, seasons, isCurator, setSearchParams]);

  const openProject = current?.projects.find(({ _id }) => _id === openId);

  const handleReopen = async (project: ProjectView) => {
    try {
      await reopenProject(project._id);
      toast.success('Проєкт відновлено');
    } catch (error) {
      notifyFailure(error);
    }
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject(projectToDelete._id);
      toast.success('Проєкт видалено');
    } catch (error) {
      notifyFailure(error);
    } finally {
      setProjectToDelete(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Проєкти</div>
          <div className={styles.subtitle}>Тайтли, над якими команда працює в сезоні</div>
        </div>

        {isCurator && (
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => setIsCreateOpen(true)}>
            Новий проєкт
          </Button>
        )}
      </div>

      {isLoading && seasons.length === 0 && <CircularProgress sx={{ alignSelf: 'center' }} />}

      {!isLoading && seasons.length === 0 && (
        <div className={styles.empty}>
          Не вдалося завантажити проєкти.{' '}
          <Button onClick={() => getProjects().catch(notifyFailure)}>Спробувати ще раз</Button>
        </div>
      )}

      {current && (
        <>
          <Tabs
            className={styles.tabs}
            value={keyOf(current)}
            onChange={(_, key: string) => setSelectedKey(key)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {seasons.map((season) => (
              <Tab
                key={keyOf(season)}
                value={keyOf(season)}
                label={seasonLabel(season.season, season.year)}
                sx={{ textTransform: 'none', minHeight: 48 }}
              />
            ))}
          </Tabs>

          <SeasonStats stats={current.stats} />

          {current.projects.length === 0 ? (
            <div className={styles.empty}>
              {isCurator
                ? 'У цьому сезоні поки немає проєктів. Додайте перший.'
                : 'У цьому сезоні поки немає проєктів.'}
            </div>
          ) : (
            <div className={styles.grid}>
              {current.projects.map((project) => (
                <ProjectTile
                  key={project._id}
                  project={project}
                  isInactive={isInactive(current, project)}
                  isOpenable={isOpenable(current, project)}
                  onOpen={(target) => setOpenId(target._id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {openProject && (
        <ProjectCard
          open
          onClose={() => setOpenId(null)}
          project={openProject}
          isCurator={isCurator}
          onEdit={setProjectToEdit}
          onFinish={setProjectToFinish}
          onReopen={handleReopen}
          onDelete={setProjectToDelete}
        />
      )}

      {isCreateOpen && <ProjectFormDialog open onClose={() => setIsCreateOpen(false)} />}

      {projectToEdit && (
        <ProjectFormDialog open onClose={() => setProjectToEdit(null)} project={projectToEdit} />
      )}

      {projectToFinish && (
        <FinishProjectDialog
          open
          onClose={() => setProjectToFinish(null)}
          project={projectToFinish}
        />
      )}

      <ConfirmDeleteDialog
        open={!!projectToDelete}
        title="Видалити проєкт?"
        message={
          projectToDelete
            ? `Проєкт «${projectToDelete.ukrName}» буде видалено разом з учасниками (${projectToDelete.participants.length}) і зникне зі статистики сезонів. Цю дію не можна скасувати.`
            : ''
        }
        onConfirm={handleDelete}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  );
};

export default Projects;
