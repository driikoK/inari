import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';

import { DEFAULT_CODEX } from './codex.default.js';
import type { SaveCodexData } from './data/codex.data.js';
import { CODEX_ID } from './enums/index.js';
import type { CodexView, ICodex } from './interfaces/index.js';

const isDuplicateKey = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  (error as { code?: number }).code === 11000;

@Injectable()
export class CodexService {
  constructor(@Inject('CODEX_MODEL') private readonly model: Model<ICodex>) {}

  async get(): Promise<CodexView> {
    const stored = await this.model.findById(CODEX_ID).lean<ICodex>();

    return stored
      ? { content: stored.content, updatedAt: stored.updatedAt }
      : { content: DEFAULT_CODEX, updatedAt: null };
  }

  // The last save wins. Two first saves at once both try to create the
  // document and one of them hits the unique id, so it goes again as an update.
  async save({ content }: SaveCodexData, actor: string): Promise<CodexView> {
    const write = () =>
      this.model
        .findOneAndUpdate(
          { _id: CODEX_ID },
          { $set: { content, updatedBy: actor } },
          { upsert: true, new: true },
        )
        .lean<ICodex>();

    let saved: ICodex | null;

    try {
      saved = await write();
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;

      saved = await write();
    }

    return { content, updatedAt: saved?.updatedAt ?? new Date() };
  }
}
