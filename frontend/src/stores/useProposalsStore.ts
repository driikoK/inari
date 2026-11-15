import { create } from 'zustand';
import axios from '@/api';
import type { PROPOSAL_FUNDING } from '@/types';
import { ensure } from '@/utils/request';

export interface Participant {
  userName: string;
  roles: string[];
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
  funding?: PROPOSAL_FUNDING;
  projectId?: string;
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
  funding: PROPOSAL_FUNDING | null;
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
  join: (id: string, roles: string[]) => Promise<void>;
  setParticipantRoles: (id: string, userName: string, roles: string[]) => Promise<void>;
}

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
