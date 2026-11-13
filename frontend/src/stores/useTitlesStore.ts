import { create } from 'zustand';
import axios from '@/api';
import type { ANIME_TYPE } from '@/types';
import { ensure } from '@/utils/request';

// A project as a select offers it when a track is written or listed
export interface ProjectTitle {
  _id: string;
  ukrName: string;
  romajiName: string;
  codeName?: string;
  titleType: ANIME_TYPE;
  isOngoing: boolean;
  isFinished: boolean;
  startDate: string;
  season: string;
  year: number;
}

interface State {
  titles: ProjectTitle[];
}

interface Actions {
  getTitles: () => Promise<void>;
}

const useTitlesStore = create<State & Actions>((set) => ({
  titles: [],

  getTitles: async () => {
    const response = ensure(await axios.get<ProjectTitle[]>('/projects/titles'));

    set({ titles: response.data });
  },
}));

export default useTitlesStore;
