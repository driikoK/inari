import { z } from 'zod';

// One request is one operation in the audit, so it is kept to what a person can
// look through
export const MAX_BULK_DELETE = 200;

export const BulkDeleteTracksData = z.object({
  ids: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Невірний id'))
    .min(1, 'Виберіть хоча б один трек')
    .max(MAX_BULK_DELETE, `Не більше ${MAX_BULK_DELETE} треків за раз`),
});

export type BulkDeleteTracksData = z.infer<typeof BulkDeleteTracksData>;
