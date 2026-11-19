import type { CodexContent } from '../data/codex.data.js';

export interface ICodex {
  _id: string;
  content: CodexContent;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// What the page gets. `updatedAt` is null while nobody has saved a text of their own yet.
export interface CodexView {
  content: CodexContent;
  updatedAt: Date | null;
}
