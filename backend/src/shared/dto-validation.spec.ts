import type { z } from 'zod';
import { SignUpData } from '../auth/data/sign-up.data.js';
import { UpdateMemberData } from '../members/data/update-member.data.js';
import { VoteData } from '../polls/data/vote.data.js';
import { CreateTrackData } from '../tracks/data/create-track.data.js';
import { FilterTrackData } from '../tracks/data/filter-track.data.js';
import { LastTracksData } from '../tracks/data/last-tracks.js';
import { UpdateUserData } from '../users/data/update-user.data.js';

const messagesOf = (schema: z.ZodType, input: unknown) => {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

const track = {
  membersInfo: [{ nickname: 'a', typeRole: 'dubs', coins: 5 }],
  currentEpisode: 1,
  nameTitle: 'T',
  titleType: 'series',
  season: 'winter',
  year: 2025,
  username: 'u',
};

describe('request DTO schemas', () => {
  describe('unknown keys', () => {
    it('are dropped, so they never reach the database', () => {
      expect(
        UpdateUserData.parse({
          role: 'admin',
          username: 'root',
          isAdmin: true,
        }),
      ).toEqual({ role: 'admin' });
      expect(FilterTrackData.parse({ $where: '1', nickname: 'a' })).toEqual({
        nickname: 'a',
        page: 1,
        perPage: 10,
      });
    });
  });

  describe('query strings', () => {
    it('are coerced to numbers and paging falls back to defaults', () => {
      expect(FilterTrackData.parse({})).toEqual({ page: 1, perPage: 10 });
      expect(
        FilterTrackData.parse({ page: '2', perPage: '5', year: '2025' }),
      ).toEqual({ page: 2, perPage: 5, year: 2025 });
    });

    it.each([
      { page: '0' },
      { page: 'abc' },
      { page: '1.5' },
      { perPage: '-1' },
      { year: 'abc' },
      { season: '' },
      { typeRole: 'nope' },
    ])('reject %o', (query) => {
      expect(FilterTrackData.safeParse(query).success).toBe(false);
    });

    it('require the last-tracks episode to be at least 2', () => {
      expect(LastTracksData.parse({ titleName: 'T', episode: '2' })).toEqual({
        titleName: 'T',
        episode: 2,
      });
      expect(
        messagesOf(LastTracksData, { titleName: 'T', episode: '1' }),
      ).toEqual(['Епізод мусить бути мінімум 2']);
    });
  });

  describe('VoteData', () => {
    const vote = { animeId: 'x', roles: ['dub', 'sub'] };

    it('validates every vote, not just the list', () => {
      expect(VoteData.safeParse({ votes: [vote] }).success).toBe(true);
      expect(
        VoteData.safeParse({ votes: [{ animeId: 'x', roles: ['nope'] }] })
          .success,
      ).toBe(false);
      expect(VoteData.safeParse({ votes: [{ roles: ['dub'] }] }).success).toBe(
        false,
      );
    });

    it('limits votes and roles with the user-facing messages', () => {
      expect(messagesOf(VoteData, { votes: Array(11).fill(vote) })).toEqual([
        'Обрано більше 10 аніме',
      ]);
      expect(
        messagesOf(VoteData, {
          votes: [{ animeId: 'x', roles: Array(7).fill('dub') }],
        }),
      ).toEqual(['Обрано забагато ролей']);
    });
  });

  describe('UpdateMemberData', () => {
    it('accepts a member the way the API returned it', () => {
      const member = {
        _id: '1',
        nickname: 'x',
        coins: 0,
        types: ['dubs'],
        // a season can legitimately drop to 0 (or below) after a track is deleted
        seasons: [{ _id: 's1', season: 'winter', year: 2025, coins: -3 }],
        createdAt: 'd',
        updatedAt: 'd',
        __v: 0,
      };

      expect(UpdateMemberData.parse(member)).toEqual({
        nickname: 'x',
        coins: 0,
        types: ['dubs'],
        seasons: [{ _id: 's1', season: 'winter', year: 2025, coins: -3 }],
      });
    });

    it('rejects negative coins', () => {
      expect(
        messagesOf(UpdateMemberData, { nickname: 'x', coins: -1 }),
      ).toEqual(['Coins must be at least 0']);
    });
  });

  describe('CreateTrackData', () => {
    it('accepts a minimal track and null optionals', () => {
      expect(CreateTrackData.safeParse(track).success).toBe(true);
      expect(
        CreateTrackData.safeParse({ ...track, note: null, isOngoing: null })
          .success,
      ).toBe(true);
    });

    it('needs at least one member', () => {
      expect(
        CreateTrackData.safeParse({ ...track, membersInfo: [] }).success,
      ).toBe(false);
    });

    it.each([
      [0, 'Мусить бути більше 0'],
      [1000, 'Мусить бути менше 999'],
    ])('rejects episode %i', (currentEpisode, message) => {
      expect(messagesOf(CreateTrackData, { ...track, currentEpisode })).toEqual(
        [message],
      );
    });
  });

  describe('credentials', () => {
    it('checks username, password and email on sign-up', () => {
      const valid = { username: 'abc', password: 'abc', email: 'a@b.co' };

      expect(SignUpData.safeParse(valid).success).toBe(true);
      expect(SignUpData.safeParse({ ...valid, username: 'ab' }).success).toBe(
        false,
      );
      expect(SignUpData.safeParse({ ...valid, email: 'nope' }).success).toBe(
        false,
      );
    });

    it('keeps the user-facing messages on user updates', () => {
      expect(messagesOf(UpdateUserData, { role: 'bogus' })).toEqual([
        'Invalid role',
      ]);
      expect(messagesOf(UpdateUserData, { email: 'bad' })).toEqual([
        'Неправильна пошта',
      ]);
    });
  });
});
