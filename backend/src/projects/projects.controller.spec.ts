import { createMock } from '@golevelup/ts-vitest';
import type { FastifyRequest } from 'fastify';

import { AuthGuard } from '../auth/auth.guard.js';
import { CuratorGuard } from '../auth/curator.guard.js';
import { ProjectsController } from './projects.controller.js';
import type { ProjectsService } from './projects.service.js';

const guardsOf = (handler: (...args: any[]) => unknown): unknown[] =>
  Reflect.getMetadata('__guards__', handler) ?? [];

describe('ProjectsController', () => {
  it.each([
    'create',
    'update',
    'finish',
    'reopen',
    'remove',
    'setPoster',
    'removePoster',
  ] as const)('%s is for curators and admins only', (handler) => {
    expect(guardsOf(ProjectsController.prototype[handler])).toEqual([
      AuthGuard,
      CuratorGuard,
    ]);
  });

  it.each([
    'findAll',
    'titles',
    'seasons',
    'participants',
    'seasonOf',
  ] as const)('%s can be read by any logged-in user', (handler) => {
    expect(guardsOf(ProjectsController.prototype[handler])).toEqual([
      AuthGuard,
    ]);
  });

  it('hands the file of the upload to the service', async () => {
    const service = createMock<ProjectsService>();
    const bytes = Buffer.from('image');
    const request = {
      isMultipart: () => true,
      file: async () => ({
        toBuffer: async () => bytes,
        file: { truncated: false },
      }),
    } as unknown as FastifyRequest;

    await new ProjectsController(service).setPoster('abc', request);

    expect(service.setPoster).toHaveBeenCalledWith('abc', bytes);
  });
});
