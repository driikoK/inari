import toast from 'react-hot-toast';
import { create } from 'zustand';
import axios from '@/api';

export type ProposalRole =
  | 'sub'
  | 'editor'
  | 'typesetter'
  | 'dubs'
  | 'fixers'
  | 'sound'
  | 'releasers'
  | 'director';

export type ProposalFunding = 'patron' | 'order';

export interface Participant {
  userName: string;
  roles: ProposalRole[];
}

export interface Proposal {
  _id: string;
  seasonId: string;
  ukrName: string;
  romajiName: string;
  link: string;
  posterUrl?: string;
  note?: string;
  isOngoing: boolean;
  isSequel: boolean;
  funding?: ProposalFunding;
  participants: Participant[];
}

export interface ProposalSeason {
  _id: string;
  season: string;
  year: number;
  isClosed: boolean;
  proposals: Proposal[];
}

export interface ProposalPayload {
  seasonId?: string;
  ukrName: string;
  romajiName: string;
  link: string;
  posterUrl: string | null;
  note: string | null;
  isOngoing: boolean;
  isSequel: boolean;
  funding: ProposalFunding | null;
}

interface State {
  seasons: ProposalSeason[];
  maxPerPerson: number;
  isLoading: boolean;
}

interface Actions {
  getProposals: () => Promise<void>;
  createSeason: (season: string, year: number) => Promise<void>;
  setSeasonClosed: (id: string, isClosed: boolean) => Promise<void>;
  deleteSeason: (id: string) => Promise<void>;
  createProposal: (payload: ProposalPayload & { seasonId: string }) => Promise<void>;
  updateProposal: (id: string, payload: ProposalPayload) => Promise<void>;
  deleteProposal: (id: string) => Promise<void>;
  join: (id: string, roles: ProposalRole[]) => Promise<void>;
  setParticipantRoles: (id: string, userName: string, roles: ProposalRole[]) => Promise<void>;
}

// The Axios interceptor returns undefined for a request that got no response at all
const ensure = <T>(response: T): NonNullable<T> => {
  if (!response) throw new Error('Немає відповіді від сервера');

  return response;
};

// Errors the server answered were already shown by the interceptor, only these are not
export const notifyFailure = (error: unknown) => {
  if (error instanceof Error) toast.error(error.message);
};

const useProposalsStore = create<State & Actions>((set) => {
  const refresh = async () => {
    const response = ensure(await axios.get('/proposals'));

    set({ seasons: response.data.seasons, maxPerPerson: response.data.maxPerPerson });
  };

  return {
    seasons: [],
    maxPerPerson: 3,
    isLoading: false,

    getProposals: async () => {
      set({ isLoading: true });

      try {
        await refresh();
      } finally {
        set({ isLoading: false });
      }
    },

    createSeason: async (season, year) => {
      ensure(await axios.post('/proposals/seasons', { season, year }));
      await refresh();
    },

    setSeasonClosed: async (id, isClosed) => {
      ensure(await axios.patch(`/proposals/seasons/${id}`, { isClosed }));
      await refresh();
    },

    deleteSeason: async (id) => {
      ensure(await axios.delete(`/proposals/seasons/${id}`));
      await refresh();
    },

    createProposal: async (payload) => {
      ensure(await axios.post('/proposals', payload));
      await refresh();
    },

    updateProposal: async (id, payload) => {
      ensure(await axios.put(`/proposals/${id}`, payload));
      await refresh();
    },

    deleteProposal: async (id) => {
      ensure(await axios.delete(`/proposals/${id}`));
      await refresh();
    },

    join: async (id, roles) => {
      ensure(await axios.put(`/proposals/${id}/join`, { roles }));
      await refresh();
    },

    setParticipantRoles: async (id, userName, roles) => {
      ensure(
        await axios.put(`/proposals/${id}/participants/${encodeURIComponent(userName)}`, { roles }),
      );
      await refresh();
    },
  };
});

export default useProposalsStore;
