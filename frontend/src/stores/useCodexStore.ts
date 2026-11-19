import { create } from 'zustand';
import type { JSONContent } from '@tiptap/react';
import axios from '@/api';
import type { CodexType } from '@/types';
import { ensure } from '@/utils/request';

interface State {
  codex: CodexType | null;
}

interface Actions {
  getCodex: () => Promise<void>;
  saveCodex: (content: JSONContent) => Promise<void>;
}

const useCodexStore = create<State & Actions>((set) => ({
  codex: null,

  getCodex: async () => {
    const response = ensure(await axios.get<CodexType>('/codex'));

    set({ codex: response.data });
  },

  saveCodex: async (content) => {
    const response = ensure(await axios.put<CodexType>('/codex', { content }));

    set({ codex: response.data });
  },
}));

export default useCodexStore;
