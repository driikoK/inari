import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { vi } from 'vitest';
import { createMock, type DeepMocked } from '@golevelup/ts-vitest';

import { TeamAnimesService } from './team-animes.service.js';
import { ITeamAnime } from './interfaces/team-anime.interface.js';
import { CreateTeamAnimeData } from './data/create-team-anime.data.js';

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

  describe('create', () => {
    it('should create and return a team anime', async () => {
      const newAnime = {
        name: 'New awesome anime',
      };

      model.create.mockImplementationOnce(() =>
        Promise.resolve(mockTeamAnime as any),
      );

      const result = await teamAnimesService.create(
        newAnime as CreateTeamAnimeData,
      );

      expect(result).toEqual(mockTeamAnime);
    });
  });

  describe('deleteById', () => {
    it('should delete and return boolean value', async () => {
      model.deleteOne.mockResolvedValue({
        acknowledged: true,
        deletedCount: 1,
      });

      const result = await teamAnimesService.deleteById(mockTeamAnime._id);

      expect(model.deleteOne).toHaveBeenCalledWith({ _id: mockTeamAnime._id });

      expect(result).toEqual(true);
    });
  });
});
