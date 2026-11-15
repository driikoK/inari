import { create } from 'zustand';
import axios from '@/api';
import type { ANIME_TYPE, PROJECT_MARK, PROPOSAL_FUNDING } from '@/types';
import { ensure } from '@/utils/request';

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
  ) => Promise<void>;
  updateProject: (id: string, payload: ProjectPayload & Partial<FinishPayload>) => Promise<void>;
  finishProject: (id: string, payload: FinishPayload) => Promise<void>;
  reopenProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

const defaultPath = '/projects';

const useProjectsStore = create<State & Actions>((set) => {
  const refresh = async () => {
    const response = ensure(await axios.get(defaultPath));

    set({ seasons: response.data.seasons });
  };

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
      ensure(await axios.post(defaultPath, payload));
      await refresh();
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
  };
});

export default useProjectsStore;
