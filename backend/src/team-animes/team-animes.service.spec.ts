import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { vi } from 'vitest';
import { createMock, type DeepMocked } from '@golevelup/ts-vitest';

import { TeamAnimesService } from './team-animes.service.js';
import { ITeamAnime } from './interfaces/team-anime.interface.js';

describe('TeamAnimesService', () => {
  let teamAnimesService: TeamAnimesService;
  let model: DeepMocked<Model<ITeamAnime>>;

  const mockTeamAnime = {
    _id: '61c0ccf11d7bf83d153d7c06',
    name: '100 дівчат, які дуже, дуже, дуже тебе кохають',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamAnimesService,
        {
          provide: 'TEAM_ANIME_MODEL',
          useValue: createMock<Model<ITeamAnime>>(),
        },
      ],
    }).compile();

    teamAnimesService = module.get(TeamAnimesService);
    model = module.get('TEAM_ANIME_MODEL');
  });

  describe('findAll', () => {
    it('should return an array of team animes', async () => {
      model.find.mockImplementation(
        () =>
          ({
            sort: vi.fn().mockResolvedValue([mockTeamAnime]),
          }) as any,
      );

      const result = await teamAnimesService.findAll();

      expect(result).toEqual([mockTeamAnime]);
    });
  });

  describe('markMoved', () => {
    it('says which project the titles with these names went to', async () => {
      await teamAnimesService.markMoved(['Wind Breaker', 'wind breaker'], 'p1');

      expect(model.updateMany).toHaveBeenCalledWith(
        { name: { $in: ['Wind Breaker', 'wind breaker'] } },
        { $set: { projectId: 'p1' } },
      );
    });
  });
});
