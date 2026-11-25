import { create } from 'zustand';
import axios from '@/api';
import type { ANIME_TYPE, PROJECT_MARK, PROPOSAL_FUNDING } from '@/types';
import { ensure, notifyFailure } from '@/utils/request';

export interface ProjectParticipant {
  nickname: string;
  roles: string[];
}

export interface Project {
  _id: string;
  ukrName: string;
  romajiName: string;
  codeName?: string;
  collabTeam?: string;
  link: string;
  posterUrl?: string;
  posterFile?: string;
  poster?: string;
  titleType: ANIME_TYPE;
  isOngoing: boolean;
  isSequel: boolean;
  funding?: PROPOSAL_FUNDING;
  startDate: string;
  endDate?: string;
  isFinished: boolean;
  isInTime: boolean;
  episodesReleased: number;
  participants: ProjectParticipant[];
}

export interface ProjectView extends Project {
  mark: PROJECT_MARK;
}

export interface SeasonStats {
  total: number;
  ongoing: number;
  old: number;
  debt: number;
  planned: number;
  patron: number;
  order: number;
}

export interface ProjectSeason {
  season: string;
  year: number;
  isCurrent: boolean;
  stats: SeasonStats;
  projects: ProjectView[];
}

// A tab of the Projects page: a season that holds a project, and how many of the wanted ones
export interface SeasonTab {
  season: string;
  year: number;
  isCurrent: boolean;
  count: number;
}

export interface SeasonTarget {
  season: string;
  year: number;
}

export interface ProjectPayload {
  ukrName: string;
  romajiName: string;
  codeName: string | null;
  collabTeam: string | null;
  link: string;
  posterUrl: string | null;
  titleType: ANIME_TYPE;
  isOngoing: boolean;
  isSequel: boolean;
  funding: PROPOSAL_FUNDING | null;
  startDate: string;
  episodesReleased: number;
  participants: ProjectParticipant[];
}

export interface FinishPayload {
  endDate: string;
  isInTime: boolean;
}

interface State {
  // Every season with every project, for the pages that need all of them
  seasons: ProjectSeason[];
  isLoading: boolean;
  // What the Projects page shows: its tabs, one season of them, and who can be filtered by
  tabs: SeasonTab[];
  season?: ProjectSeason;
  participants: string[];
  isSeasonLoading: boolean;
  isSeasonFailed: boolean;
}

interface Actions {
  getProjects: () => Promise<void>;
  getTabs: (participant?: string) => Promise<void>;
  getSeason: (target: SeasonTarget, participant?: string) => Promise<void>;
  getParticipants: () => Promise<void>;
  getProjectSeason: (id: string) => Promise<SeasonTarget>;
  createProject: (
    payload: ProjectPayload & Partial<FinishPayload> & { proposalId?: string },
  ) => Promise<string>;
  updateProject: (id: string, payload: ProjectPayload & Partial<FinishPayload>) => Promise<void>;
  finishProject: (id: string, payload: FinishPayload) => Promise<void>;
  reopenProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  uploadPoster: (id: string, file: File) => Promise<void>;
  deletePoster: (id: string) => Promise<void>;
}

const defaultPath = '/projects';

const useProjectsStore = create<State & Actions>((set) => {
  // What the page asked for last, which is what a write has to load again
  let view: { target?: SeasonTarget; participant?: string } = {};
  // An answer that comes after a newer request for the same thing must not replace the newer one
  let tabsRequest = 0;
  let seasonRequest = 0;
  let participantsRequest = 0;

  const fetchTabs = async (participant?: string) => {
    const request = ++tabsRequest;
    const response = ensure(
      await axios.get<SeasonTab[]>(`${defaultPath}/seasons`, { params: { participant } }),
    );

    if (request === tabsRequest) set({ tabs: response.data });
  };

  const fetchSeason = async (target: SeasonTarget, participant?: string) => {
    const request = ++seasonRequest;

    view = { ...view, target, participant };
    set({ isSeasonLoading: true, isSeasonFailed: false });

    try {
      const response = ensure(
        await axios.get<{ seasons: ProjectSeason[] }>(defaultPath, {
          params: { ...target, participant },
        }),
      );

      if (request === seasonRequest) set({ season: response.data.seasons[0] });
    } catch (error) {
      // A request that a newer one has overtaken is not the page's concern any more
      if (request !== seasonRequest) return;

      // The page keeps the old season on the screen while a new one loads, so one that
      // failed must take it away rather than leave it under the wrong tab
      set({ season: undefined, isSeasonFailed: true });

      throw error;
    } finally {
      if (request === seasonRequest) set({ isSeasonLoading: false });
    }
  };

  const fetchParticipants = async () => {
    const request = ++participantsRequest;
    const response = ensure(await axios.get<string[]>(`${defaultPath}/participants`));

    if (request === participantsRequest) set({ participants: response.data });
  };

  // The page shows what a write changed, and the list of every season is dropped so that the
  // pages that read it ask again
  const refresh = async () => {
    set({ seasons: [] });

    await Promise.all([
      fetchTabs(view.participant),
      view.target ? fetchSeason(view.target, view.participant) : undefined,
      fetchParticipants(),
    ]);
  };

  // The write is done by now, so a list that fails to load must not look like a write that
  // failed: the form would stay open and a second save would make a second project, and a
  // project that was deleted would answer 404 to another try
  const refreshAfterWrite = () => refresh().catch(notifyFailure);

  return {
    seasons: [],
    isLoading: true,
    tabs: [],
    participants: [],
    isSeasonLoading: false,
    isSeasonFailed: false,

    getProjects: async () => {
      set({ isLoading: true });

      try {
        const response = ensure(await axios.get(defaultPath));

        set({ seasons: response.data.seasons });
      } finally {
        set({ isLoading: false });
      }
    },

    getTabs: async (participant) => {
      view = { ...view, participant };
      await fetchTabs(participant);
    },

    getSeason: fetchSeason,

    getParticipants: fetchParticipants,

    getProjectSeason: async (id) => {
      const response = ensure(
        await axios.get<SeasonTarget>(`${defaultPath}/${encodeURIComponent(id)}/season`),
      );

      return response.data;
    },

    createProject: async (payload) => {
      const response = ensure(await axios.post<{ _id: string }>(defaultPath, payload));

      await refreshAfterWrite();

      return response.data._id;
    },

    updateProject: async (id, payload) => {
      ensure(await axios.put(`${defaultPath}/${id}`, payload));
      await refreshAfterWrite();
    },

    finishProject: async (id, payload) => {
      ensure(await axios.post(`${defaultPath}/${id}/finish`, payload));
      await refreshAfterWrite();
    },

    reopenProject: async (id) => {
      ensure(await axios.post(`${defaultPath}/${id}/reopen`));
      await refreshAfterWrite();
    },

    deleteProject: async (id) => {
      ensure(await axios.delete(`${defaultPath}/${id}`));
      await refreshAfterWrite();
    },

    uploadPoster: async (id, file) => {
      const body = new FormData();

      body.append('poster', file);
      ensure(await axios.put(`${defaultPath}/${id}/poster`, body));
      await refreshAfterWrite();
    },

    deletePoster: async (id) => {
      ensure(await axios.delete(`${defaultPath}/${id}/poster`));
      await refreshAfterWrite();
    },
  };
});

export default useProjectsStore;
