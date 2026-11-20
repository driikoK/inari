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

export interface ProjectPayload {
  ukrName: string;
  romajiName: string;
  codeName: string | null;
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
  seasons: ProjectSeason[];
  isLoading: boolean;
}

interface Actions {
  getProjects: () => Promise<void>;
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
  const refresh = async () => {
    const response = ensure(await axios.get(defaultPath));

    set({ seasons: response.data.seasons });
  };

  // The write is done by now, so a list that fails to load must not look like a write
  // that failed: the form would stay open and a second save would make a second project
  const refreshAfterWrite = () => refresh().catch(notifyFailure);

  return {
    seasons: [],
    isLoading: true,

    getProjects: async () => {
      set({ isLoading: true });

      try {
        await refresh();
      } finally {
        set({ isLoading: false });
      }
    },

    createProject: async (payload) => {
      const response = ensure(await axios.post<{ _id: string }>(defaultPath, payload));

      await refreshAfterWrite();

      return response.data._id;
    },

    updateProject: async (id, payload) => {
      ensure(await axios.put(`${defaultPath}/${id}`, payload));
      await refresh();
    },

    finishProject: async (id, payload) => {
      ensure(await axios.post(`${defaultPath}/${id}/finish`, payload));
      await refresh();
    },

    reopenProject: async (id) => {
      ensure(await axios.post(`${defaultPath}/${id}/reopen`));
      await refresh();
    },

    deleteProject: async (id) => {
      ensure(await axios.delete(`${defaultPath}/${id}`));
      await refresh();
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
