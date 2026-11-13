import type { z } from 'zod';
import { SignUpData } from '../auth/data/sign-up.data.js';
import { CreateMemberData } from '../members/data/create-member.data.js';
import {
  MemberFilterData,
  UNMARKED_KIND,
} from '../members/data/filter-members.data.js';
import { UpdateMemberData } from '../members/data/update-member.data.js';
import { UpdateMemberKindData } from '../members/data/update-member-kind.data.js';
import {
  CreateProposalData,
  CreateSeasonData,
  ParticipationData,
  SeasonStateData,
  UpdateProposalData,
} from '../proposals/data/index.js';
import {
  CreateProjectData,
  FinishProjectData,
  UpdateProjectData,
} from '../projects/data/index.js';
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
  projectId: 'p1',
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
      expect(LastTracksData.parse({ projectId: 'p1', episode: '2' })).toEqual({
        projectId: 'p1',
        episode: 2,
      });
      expect(
        messagesOf(LastTracksData, { projectId: 'p1', episode: '1' }),
      ).toEqual(['Епізод мусить бути мінімум 2']);
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

  describe('member kind', () => {
    const member = { nickname: 'x', types: [] };

    it.each(['team', 'guest'])('accepts a new nickname marked %s', (kind) => {
      expect(CreateMemberData.parse({ ...member, kind }).kind).toBe(kind);
    });

    it.each([undefined, null, '', 'owner'])(
      'needs a valid kind on a new nickname, not %o',
      (kind) => {
        expect(messagesOf(CreateMemberData, { ...member, kind })).toEqual([
          'Вкажіть, чи це гість, чи учасник команди',
        ]);
      },
    );

    it('is changed on its own, never through the coins endpoint', () => {
      expect(UpdateMemberKindData.parse({ kind: 'guest' })).toEqual({
        kind: 'guest',
      });
      expect(UpdateMemberKindData.safeParse({ kind: 'owner' }).success).toBe(
        false,
      );
      expect(
        UpdateMemberData.parse({ nickname: 'x', coins: 1, kind: 'guest' }),
      ).toEqual({ nickname: 'x', coins: 1 });
    });

    it('can be filtered on, the unmarked ones included', () => {
      expect(MemberFilterData.parse({ kind: UNMARKED_KIND }).kind).toBe(
        UNMARKED_KIND,
      );
      expect(MemberFilterData.safeParse({ kind: 'owner' }).success).toBe(false);
    });
  });

  describe('proposals', () => {
    const proposal = {
      seasonId: '61c0ccf11d7bf83d153d7c06',
      ukrName: 'Школа привидів',
      romajiName: 'Youkai Gakkou',
      link: 'https://myanimelist.net/anime/1',
      isOngoing: true,
      isSequel: false,
    };

    it('accepts a title with only the required fields', () => {
      expect(CreateProposalData.safeParse(proposal).success).toBe(true);
    });

    it('accepts the optional poster, note and funding, and their nulls', () => {
      expect(
        CreateProposalData.safeParse({
          ...proposal,
          posterUrl: 'https://cdn.myanimelist.net/images/1.jpg',
          note: 'Замовлення',
          funding: 'patron',
        }).success,
      ).toBe(true);
      expect(
        CreateProposalData.safeParse({
          ...proposal,
          posterUrl: null,
          note: null,
          funding: null,
        }).success,
      ).toBe(true);
    });

    it.each([
      ['ukrName', ''],
      ['romajiName', ''],
      ['link', 'not a link'],
      ['link', 'ftp://example.com/x'],
      ['posterUrl', 'nope'],
      ['note', 'x'.repeat(501)],
      ['funding', 'free'],
      ['isOngoing', undefined],
      ['isSequel', 'yes'],
    ])('rejects %s = %o', (field, value) => {
      expect(
        CreateProposalData.safeParse({ ...proposal, [field]: value }).success,
      ).toBe(false);
    });

    it('lets an update leave the season out and keeps the rest required', () => {
      const { seasonId, ...rest } = proposal;

      expect(UpdateProposalData.safeParse(rest).success).toBe(true);
      expect(
        UpdateProposalData.safeParse({ ...rest, ukrName: '' }).success,
      ).toBe(false);
    });

    it('takes a season of the year and a year', () => {
      expect(
        CreateSeasonData.safeParse({ season: 'winter', year: 2027 }).success,
      ).toBe(true);
      expect(
        CreateSeasonData.safeParse({ season: 'monsoon', year: 2027 }).success,
      ).toBe(false);
      expect(
        CreateSeasonData.safeParse({ season: 'winter', year: 2027.5 }).success,
      ).toBe(false);
    });

    it('takes every member role, the role breaker too, and an empty list means withdraw', () => {
      expect(ParticipationData.safeParse({ roles: [] }).success).toBe(true);
      expect(
        ParticipationData.safeParse({
          roles: [
            'sub',
            'editor',
            'typesetter',
            'dubs',
            'fixers',
            'sound',
            'releasers',
            'director',
            'roleBreaker',
          ],
        }).success,
      ).toBe(true);
      expect(ParticipationData.safeParse({ roles: ['wizard'] }).success).toBe(
        false,
      );
    });

    it('closes and reopens with a plain boolean', () => {
      expect(SeasonStateData.safeParse({ isClosed: true }).success).toBe(true);
      expect(SeasonStateData.safeParse({ isClosed: 'yes' }).success).toBe(
        false,
      );
    });
  });

  describe('projects', () => {
    const projectBody = {
      ukrName: 'Вітробой',
      romajiName: 'Wind Breaker',
      link: 'https://myanimelist.net/anime/54900',
      titleType: 'series',
      isOngoing: true,
      isSequel: false,
      startDate: '2027-04-02',
      episodesReleased: 3,
      participants: [{ nickname: 'Dixy', roles: ['sub', 'editor'] }],
    };

    it('accepts a project with only the required fields and no team yet', () => {
      expect(
        CreateProjectData.safeParse({ ...projectBody, participants: [] })
          .success,
      ).toBe(true);
    });

    it('accepts the optional fields, their nulls and the proposal it comes from', () => {
      expect(
        CreateProjectData.safeParse({
          ...projectBody,
          codeName: 'wind',
          posterUrl: 'https://cdn.myanimelist.net/images/1.jpg',
          funding: 'order',
          proposalId: '61c0ccf11d7bf83d153d7c06',
        }).success,
      ).toBe(true);
      expect(
        CreateProjectData.safeParse({
          ...projectBody,
          codeName: null,
          posterUrl: null,
          funding: null,
          proposalId: null,
        }).success,
      ).toBe(true);
    });

    it.each([
      ['ukrName', ''],
      ['romajiName', ' '],
      ['link', 'not a link'],
      ['posterUrl', 'ftp://example.com/x'],
      ['titleType', 'movie'],
      ['isOngoing', undefined],
      ['funding', 'free'],
      ['startDate', '02.04.2027'],
      ['startDate', '2027-13-40'],
      ['episodesReleased', -1],
      ['episodesReleased', 1000],
      ['episodesReleased', 2.5],
      ['codeName', 'x'.repeat(101)],
    ])('rejects %s = %o', (field, value) => {
      expect(
        CreateProjectData.safeParse({ ...projectBody, [field]: value }).success,
      ).toBe(false);
    });

    it.each([
      ['a participant without a role', [{ nickname: 'Dixy', roles: [] }]],
      ['a role nobody has', [{ nickname: 'Dixy', roles: ['wizard'] }]],
      ['a blank nickname', [{ nickname: ' ', roles: ['sub'] }]],
      [
        'the same nickname twice, whatever its case',
        [
          { nickname: 'Dixy', roles: ['sub'] },
          { nickname: 'dixy', roles: ['dubs'] },
        ],
      ],
    ])('rejects %s', (_, participants) => {
      expect(
        CreateProjectData.safeParse({ ...projectBody, participants }).success,
      ).toBe(false);
    });

    it('lets a participant be a role breaker like in tracks', () => {
      expect(
        CreateProjectData.safeParse({
          ...projectBody,
          participants: [{ nickname: 'Dixy', roles: ['roleBreaker'] }],
        }).success,
      ).toBe(true);
    });

    it('refuses a date before 2000, a typo that would span thousands of seasons', () => {
      expect(
        CreateProjectData.safeParse({ ...projectBody, startDate: '0025-04-01' })
          .success,
      ).toBe(false);
      expect(
        CreateProjectData.safeParse({ ...projectBody, startDate: '1999-12-31' })
          .success,
      ).toBe(false);
      expect(
        CreateProjectData.safeParse({ ...projectBody, startDate: '2000-01-01' })
          .success,
      ).toBe(true);
      expect(
        UpdateProjectData.safeParse({ ...projectBody, endDate: '1999-12-31' })
          .success,
      ).toBe(false);
      expect(
        FinishProjectData.safeParse({ endDate: '1999-12-31', isInTime: false })
          .success,
      ).toBe(false);
    });

    it('says only that a malformed date is malformed, not also that it is too early', () => {
      expect(
        messagesOf(CreateProjectData, {
          ...projectBody,
          startDate: '02.04.2027',
        }),
      ).toEqual(['Вкажіть коректну дату']);
      expect(
        messagesOf(CreateProjectData, {
          ...projectBody,
          startDate: '0025-04-01',
        }),
      ).toEqual(['Дата не може бути раніше 2000 року']);
    });

    it('lets a new project come already finished, with an end date and the flag', () => {
      expect(
        CreateProjectData.safeParse({
          ...projectBody,
          endDate: '2027-05-01',
          isInTime: true,
        }).success,
      ).toBe(true);
      expect(
        CreateProjectData.safeParse({
          ...projectBody,
          endDate: null,
          isInTime: null,
        }).success,
      ).toBe(true);
      expect(
        CreateProjectData.safeParse({ ...projectBody, endDate: '1999-12-31' })
          .success,
      ).toBe(false);
    });

    it('lets an update carry the end date and the in-time flag', () => {
      expect(
        UpdateProjectData.safeParse({
          ...projectBody,
          endDate: '2027-05-01',
          isInTime: true,
        }).success,
      ).toBe(true);
      expect(UpdateProjectData.safeParse(projectBody).success).toBe(true);
    });

    it('needs a date and the flag to finish', () => {
      expect(
        FinishProjectData.safeParse({ endDate: '2027-05-01', isInTime: false })
          .success,
      ).toBe(true);
      expect(FinishProjectData.safeParse({ isInTime: false }).success).toBe(
        false,
      );
      expect(
        FinishProjectData.safeParse({ endDate: '2027-05-01' }).success,
      ).toBe(false);
    });
  });

  describe('CreateTrackData', () => {
    it('needs the project of the title, and takes neither a name nor a type of the title', () => {
      expect(
        CreateTrackData.safeParse({ ...track, projectId: '' }).success,
      ).toBe(false);

      const { projectId, ...withoutProject } = track;

      expect(CreateTrackData.safeParse(withoutProject).success).toBe(false);
      expect(
        CreateTrackData.parse({
          ...track,
          nameTitle: 'Чужа назва',
          titleType: 'film',
        }),
      ).toEqual(CreateTrackData.parse(track));
    });

    it('takes a season only together with a year', () => {
      expect(
        CreateTrackData.safeParse({ ...track, season: 'summer', year: 2027 })
          .success,
      ).toBe(true);
      expect(
        CreateTrackData.safeParse({ ...track, season: null, year: null })
          .success,
      ).toBe(true);
      expect(
        messagesOf(CreateTrackData, { ...track, season: 'summer' }),
      ).toEqual(['Вкажіть сезон і рік разом']);
      expect(messagesOf(CreateTrackData, { ...track, year: 2027 })).toEqual([
        'Вкажіть сезон і рік разом',
      ]);
      expect(
        CreateTrackData.safeParse({ ...track, season: 'monsoon', year: 2027 })
          .success,
      ).toBe(false);
    });

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
