import { z } from 'zod';
import { SEASON } from '../../shared/index.js';
import { AUDIT_KIND } from '../enums/index.js';

const seasonTogether = {
  check: (value: { season?: SEASON; year?: number }) =>
    !!value.season === !!value.year,
  options: { error: 'Сезон і рік вказуються разом', path: ['season'] },
};

const paging = (defaultPerPage: number, maxPerPage: number) => ({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce
    .number()
    .int()
    .min(1)
    .max(maxPerPage)
    .default(defaultPerPage),
});

const seasonFilter = {
  season: z.enum(SEASON).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
};

export const EntriesQueryData = z
  .object({ ...paging(25, 100), ...seasonFilter })
  .refine(seasonTogether.check, seasonTogether.options);

export const AuditQueryData = z
  .object({
    ...paging(20, 50),
    ...seasonFilter,
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    kind: z.enum(AUDIT_KIND).optional(),
    search: z.string().trim().max(100).optional(),
  })
  .refine(seasonTogether.check, seasonTogether.options);

export type EntriesQueryData = z.infer<typeof EntriesQueryData>;
export type AuditQueryData = z.infer<typeof AuditQueryData>;
