import { FC, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import AddIcon from '@mui/icons-material/AddOutlined';
import { Button, CircularProgress, Tab, Tabs } from '@mui/material';

import { ConfirmDeleteDialog, SearchSelect } from '@/components';
import { SUBJECTS } from '@/context/casl';
import { usePermissions } from '@/hooks';
import { seasonLabel } from '@/pages/Proposals/const/options';
import useProjectsStore, {
  type ProjectSeason,
  type ProjectView,
  type SeasonTarget,
} from '@/stores/useProjectsStore';
import useRolesStore from '@/stores/useRolesStore';
import { notifyFailure } from '@/utils/request';
import { FinishProjectDialog } from './components/FinishProjectDialog';
import { ProjectCard } from './components/ProjectCard';
import { ProjectFormDialog } from './components/ProjectFormDialog';
import { ProjectTile } from './components/ProjectTile';
import { SeasonStats } from './components/SeasonStats';
import styles from './Projects.module.scss';

const keyOf = ({ season, year }: SeasonTarget) => `${season}-${year}`;

const isInactive = (season: ProjectSeason, project: ProjectView) =>
  season.isCurrent && project.isFinished;

interface OpenRequest {
  id: string;
  key: string;
}

const Projects: FC = () => {
  const {
    tabs,
    season,
    participants,
    isSeasonLoading,
    isSeasonFailed,
    getTabs,
    getSeason,
    getParticipants,
    getProjectSeason,
    reopenProject,
    deleteProject,
  } = useProjectsStore();
  const getRoles = useRolesStore((state) => state.getRoles);
  const { hasAccess } = usePermissions();
  const isCurator = hasAccess(SUBJECTS.MANAGE_PROJECTS);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedId = searchParams.get('project');

  // No tab chosen yet means the current season, which only the server knows
  const [target, setTarget] = useState<SeasonTarget>();
  const [participant, setParticipant] = useState<string>();
  const [openId, setOpenId] = useState<string | null>(null);
  const [openRequest, setOpenRequest] = useState<OpenRequest | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<ProjectView | null>(null);
  const [projectToFinish, setProjectToFinish] = useState<ProjectView | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ProjectView | null>(null);
  const [isFetched, setIsFetched] = useState(false);

  // The tab of a season that has no project any more (the last one was deleted) is gone, and the
  // page falls back to the current season
  const activeTab =
    (target && tabs.find((tab) => keyOf(tab) === keyOf(target))) ||
    tabs.find(({ isCurrent }) => isCurrent);
  const activeSeason = activeTab?.season;
  const activeYear = activeTab?.year;

  const options = useMemo(
    () => participants.map((name) => ({ value: name.toLowerCase(), label: name })),
    [participants],
  );

  useEffect(() => {
    getParticipants().catch(notifyFailure);
    getRoles().catch(notifyFailure);
  }, [getParticipants, getRoles]);

  useEffect(() => {
    getTabs(participant)
      .catch(notifyFailure)
      .finally(() => setIsFetched(true));
  }, [participant, getTabs]);

  useEffect(() => {
    if (activeSeason === undefined || activeYear === undefined) return;

    getSeason({ season: activeSeason, year: activeYear }, participant).catch(notifyFailure);
  }, [activeSeason, activeYear, participant, getSeason]);

  // A person who is in no team any more (after an edit or a delete) is no filter any more
  useEffect(() => {
    if (participant && !options.some(({ value }) => value === participant)) {
      setParticipant(undefined);
    }
  }, [participant, options]);

  // While the season of a tab loads the one before it stays, dimmed and out of reach, so the page
  // does not go blank for the length of a request
  const isBusy = isSeasonLoading || (!!season && !!activeTab && keyOf(season) !== keyOf(activeTab));

  const isOpenable = (current: ProjectSeason, project: ProjectView) =>
    isCurator || !isInactive(current, project);

  // A link to a project (from the proposals) lands on the season the project is shown on
  useEffect(() => {
    if (!requestedId) return;

    setSearchParams({}, { replace: true });
    setParticipant(undefined);

    getProjectSeason(requestedId)
      .then((found) => {
        setTarget(found);
        setOpenRequest({ id: requestedId, key: keyOf(found) });
      })
      .catch(notifyFailure);
  }, [requestedId, getProjectSeason, setSearchParams]);

  useEffect(() => {
    if (!openRequest || !season || keyOf(season) !== openRequest.key) return;

    // The season of the store can be one from an earlier visit (filtered, or from before the
    // project existed) while the season of this visit is on its way, and the project is not in it.
    // The store is read here, not in the render, because the load starts in an effect of this
    // same commit.
    if (useProjectsStore.getState().isSeasonLoading) return;

    const project = season.projects.find(({ _id }) => _id === openRequest.id);

    setOpenRequest(null);
    if (project && (isCurator || !isInactive(season, project))) setOpenId(project._id);
  }, [openRequest, season, isCurator]);

  const openProject = season?.projects.find(({ _id }) => _id === openId);

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

  const emptyText = participant
    ? 'У цьому сезоні немає проєктів з цим учасником.'
    : isCurator
      ? 'У цьому сезоні поки немає проєктів. Додайте перший.'
      : 'У цьому сезоні поки немає проєктів.';

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

      {!isFetched && <CircularProgress sx={{ alignSelf: 'center' }} />}

      {isFetched && tabs.length === 0 && (
        <div className={styles.empty}>
          Не вдалося завантажити проєкти.{' '}
          <Button onClick={() => getTabs(participant).catch(notifyFailure)}>
            Спробувати ще раз
          </Button>
        </div>
      )}

      {activeTab && (
        <>
          <div className={styles.filter}>
            <SearchSelect
              label="Учасник"
              value={participant}
              onChange={setParticipant}
              options={options}
              noOptionsText="Учасника не знайдено"
            />
          </div>

          <Tabs
            className={styles.tabs}
            value={keyOf(activeTab)}
            onChange={(_, key: string) => setTarget(tabs.find((tab) => keyOf(tab) === key))}
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabs.map((tab) => (
              <Tab
                key={keyOf(tab)}
                value={keyOf(tab)}
                label={`${seasonLabel(tab.season, tab.year)}${participant ? ` (${tab.count})` : ''}`}
                sx={{ textTransform: 'none', minHeight: 48 }}
              />
            ))}
          </Tabs>

          {!season && isSeasonLoading && <CircularProgress sx={{ alignSelf: 'center' }} />}

          {!season && isSeasonFailed && !isSeasonLoading && (
            <div className={styles.empty}>
              Не вдалося завантажити сезон.{' '}
              <Button
                onClick={() =>
                  getSeason({ season: activeTab.season, year: activeTab.year }, participant).catch(
                    notifyFailure,
                  )
                }
              >
                Спробувати ще раз
              </Button>
            </div>
          )}

          {season && (
            <div className={clsx(styles.content, isBusy && styles.busy)}>
              <SeasonStats stats={season.stats} />

              {season.projects.length === 0 ? (
                <div className={styles.empty}>{emptyText}</div>
              ) : (
                <div className={styles.grid}>
                  {season.projects.map((project) => (
                    <ProjectTile
                      key={project._id}
                      project={project}
                      isInactive={isInactive(season, project)}
                      isOpenable={isOpenable(season, project)}
                      onOpen={(opened) => setOpenId(opened._id)}
                    />
                  ))}
                </div>
              )}
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
