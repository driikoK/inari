import { ANIME_TYPE, MEMBER_ROLE, SEASON } from '../shared/index.js';
import type { TitleGroup } from '../tracks/interfaces/track.interface.js';
import {
  describeTitlePlan,
  type KnownProject,
  type TeamTitle,
  type TitlePlan,
  planTitles,
} from './titles-plan.js';

describe('planTitles', () => {
  const today = '2027-05-10';

  const group = (extra: Partial<TitleGroup> = {}): TitleGroup => ({
    nameTitle: 'Wind Breaker',
    titleType: ANIME_TYPE.SERIES,
    season: SEASON.SPRING,
    year: 2027,
    isOngoing: true,
    maxEpisode: 4,
    firstAt: new Date('2027-04-03T10:00:00Z'),
    lastAt: new Date('2027-05-02T10:00:00Z'),
    tracks: 8,
    unlinked: 8,
    members: [{ nickname: 'Аня', role: MEMBER_ROLE.DUB, tracks: 8 }],
    ...extra,
  });

  const team = (
    name: string,
    createdAt = '2027-04-20T10:00:00Z',
    projectId?: string,
  ): TeamTitle => ({
    name,
    createdAt: new Date(createdAt),
    ...(projectId && { projectId }),
  });

  const known = (extra: Partial<KnownProject> = {}): KnownProject => ({
    _id: 'p1',
    ukrName: 'Вітробой',
    romajiName: 'Wind Breaker',
    titleType: ANIME_TYPE.SERIES,
    startDate: '2027-04-02',
    episodesReleased: 3,
    ...extra,
  });

  const plan = (input: {
    teamTitles?: TeamTitle[];
    groups?: TitleGroup[];
    projects?: KnownProject[];
  }): TitlePlan[] =>
    planTitles({ teamTitles: [], groups: [], projects: [], today, ...input });

  describe('a title that is not a project yet', () => {
    it('becomes an active project when its tracks are recent, from the data of its tracks', () => {
      const [entry] = plan({
        teamTitles: [team('Wind Breaker')],
        groups: [group()],
      });

      expect(entry).toMatchObject({
        action: 'create',
        state: 'active',
        tracks: 8,
        unlinked: 8,
      });
      expect(entry.project).toEqual({
        ukrName: 'Wind Breaker',
        romajiName: 'Wind Breaker',
        link: 'https://myanimelist.net/anime.php?q=Wind%20Breaker&cat=anime',
        titleType: ANIME_TYPE.SERIES,
        isOngoing: true,
        isSequel: false,
        startDate: '2027-04-03',
        episodesReleased: 4,
        participants: [{ nickname: 'Аня', roles: [MEMBER_ROLE.DUB] }],
      });
    });

    it('becomes a finished project when its last track is older than the previous season, excused from the debt', () => {
      const [entry] = plan({
        groups: [
          group({
            nameTitle: 'Old Show',
            season: SEASON.FALL,
            year: 2025,
            isOngoing: false,
            maxEpisode: 12,
            firstAt: new Date('2025-10-06T10:00:00Z'),
            lastAt: new Date('2025-12-22T10:00:00Z'),
          }),
        ],
      });

      expect(entry.state).toBe('finished');
      expect(entry.project).toMatchObject({
        isOngoing: false,
        startDate: '2025-10-06',
        endDate: '2025-12-22',
        isInTime: true,
        episodesReleased: 12,
      });
    });

    it('judges a title by its tracks, not by the day it was added to the old list', () => {
      const [entry] = plan({
        teamTitles: [team('Wind Breaker', '2027-05-01T10:00:00Z')],
        groups: [
          group({
            season: SEASON.FALL,
            year: 2025,
            firstAt: new Date('2025-10-06T10:00:00Z'),
            lastAt: new Date('2025-12-22T10:00:00Z'),
          }),
        ],
      });

      expect(entry.state).toBe('finished');
      expect(entry.project?.endDate).toBe('2025-12-22');
    });

    it('counts the last two seasons as recent and nothing older', () => {
      const states = (lastAt: string) =>
        plan({ groups: [group({ lastAt: new Date(lastAt) })] })[0].state;

      expect(states('2027-01-01T10:00:00Z')).toBe('active');
      expect(states('2026-12-31T10:00:00Z')).toBe('finished');
    });

    it('starts in the season of its tracks even when the first track is dated outside it', () => {
      const [entry] = plan({
        groups: [
          group({
            season: SEASON.FALL,
            year: 2026,
            firstAt: new Date('2027-01-12T10:00:00Z'),
          }),
        ],
      });

      expect(entry.project?.startDate).toBe('2026-10-01');
    });

    it('never starts in the future', () => {
      const [entry] = plan({
        groups: [group({ season: SEASON.SUMMER, year: 2027 })],
      });

      expect(entry.project?.startDate).toBe(today);
    });

    it('is a series when the tracks name no type it knows', () => {
      const [entry] = plan({
        groups: [group({ titleType: 'unknown' as ANIME_TYPE })],
      });

      expect(entry.project?.titleType).toBe(ANIME_TYPE.SERIES);
    });

    it('keeps no released episodes for a film', () => {
      const [entry] = plan({
        groups: [
          group({
            titleType: ANIME_TYPE.FILM,
            maxEpisode: 1,
            lastAt: new Date('2025-02-02T10:00:00Z'),
            firstAt: new Date('2025-02-01T10:00:00Z'),
            season: SEASON.WINTER,
            year: 2025,
          }),
        ],
      });

      expect(entry.state).toBe('finished');
      expect(entry.project?.episodesReleased).toBe(0);
    });

    it('takes a title with no tracks from the day it was added', () => {
      const [recent, old] = plan({
        teamTitles: [
          team('Brand New', '2027-04-20T10:00:00Z'),
          team('Forgotten', '2024-06-03T10:00:00Z'),
        ],
      });

      expect(recent).toMatchObject({ title: 'Brand New', state: 'active' });
      expect(recent.project).toMatchObject({
        startDate: '2027-04-20',
        isOngoing: true,
        participants: [],
      });
      expect(recent.project).not.toHaveProperty('endDate');
      expect(old).toMatchObject({ title: 'Forgotten', state: 'finished' });
      expect(old.project).toMatchObject({
        startDate: '2024-06-03',
        endDate: '2024-06-03',
        isInTime: true,
        isOngoing: false,
      });
    });

    it('counts the episodes with tracks as released, running or not', () => {
      const [entry] = plan({ groups: [group({ maxEpisode: 9 })] });

      expect(entry.state).toBe('active');
      expect(entry.project?.episodesReleased).toBe(9);
    });

    it('is made for a title that only the tracks know, one the old list lost', () => {
      const [entry] = plan({ groups: [group({ nameTitle: 'Lost Title' })] });

      expect(entry).toMatchObject({ title: 'Lost Title', action: 'create' });
    });

    it('treats the spellings of one title as one title, the old list naming it', () => {
      const entries = plan({
        teamTitles: [team('Wind Breaker')],
        groups: [
          group({ nameTitle: 'wind  breaker ', tracks: 3, unlinked: 3 }),
          group({ tracks: 5, unlinked: 2 }),
        ],
      });

      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        title: 'Wind Breaker',
        tracks: 8,
        unlinked: 5,
      });
      expect([...entries[0].names].sort()).toEqual([
        'Wind Breaker',
        'wind  breaker ',
      ]);
    });

    it('gathers the team once per nickname, joining the roles, and skips what is not a role', () => {
      const [entry] = plan({
        groups: [
          group({
            members: [
              { nickname: 'Аня', role: MEMBER_ROLE.DUB, tracks: 3 },
              { nickname: ' аня ', role: MEMBER_ROLE.SOUND, tracks: 1 },
              { nickname: 'Аня', role: MEMBER_ROLE.DUB, tracks: 2 },
              { nickname: 'Борис', role: 'nope' as MEMBER_ROLE, tracks: 1 },
              { nickname: '', role: MEMBER_ROLE.SUB, tracks: 1 },
            ],
          }),
        ],
      });

      expect(entry.project?.participants).toEqual([
        { nickname: 'Аня', roles: [MEMBER_ROLE.DUB, MEMBER_ROLE.SOUND] },
      ]);
    });

    it('keeps the roles in the order of the list of roles, whatever order the tracks came in', () => {
      const [entry] = plan({
        groups: [
          group({
            members: [
              { nickname: 'Аня', role: MEMBER_ROLE.SOUND, tracks: 1 },
              { nickname: 'Аня', role: MEMBER_ROLE.DUB, tracks: 1 },
            ],
          }),
        ],
      });

      expect(entry.project?.participants[0].roles).toEqual([
        MEMBER_ROLE.DUB,
        MEMBER_ROLE.SOUND,
      ]);
    });

    it('keeps the 50 people with the most tracks when there are more, and says how many were left out', () => {
      const members = Array.from({ length: 60 }, (_, index) => ({
        nickname: `Нік${index}`,
        role: MEMBER_ROLE.DUB,
        tracks: index + 1,
      }));
      const [entry] = plan({ groups: [group({ members })] });
      const nicknames = entry.project?.participants.map(
        ({ nickname }) => nickname,
      );

      expect(nicknames).toHaveLength(50);
      expect(nicknames).toContain('Нік59');
      expect(nicknames).toContain('Нік10');
      expect(nicknames).not.toContain('Нік9');
      expect(entry.leftOut).toBe(10);
      expect(describeTitlePlan(entry)).toMatch(/10 more people did not fit/);
    });

    it('adds up the tracks of one person over their roles when it picks who stays', () => {
      const members = [
        { nickname: 'Багатоликий', role: MEMBER_ROLE.DUB, tracks: 2 },
        { nickname: 'Багатоликий', role: MEMBER_ROLE.SUB, tracks: 2 },
        ...Array.from({ length: 49 }, (_, index) => ({
          nickname: `Нік${index}`,
          role: MEMBER_ROLE.DUB,
          tracks: 3,
        })),
      ];
      const [entry] = plan({ groups: [group({ members })] });

      expect(entry.project?.participants).toHaveLength(50);
      expect(
        entry.project?.participants.map(({ nickname }) => nickname),
      ).toContain('Багатоликий');
      expect(entry).not.toHaveProperty('leftOut');
    });
  });

  describe('a title that is a project already', () => {
    it('is linked to it, whichever of its three names matches, whatever the case', () => {
      for (const name of ['вітробой', 'WIND BREAKER', ' codeword ']) {
        const [entry] = plan({
          groups: [group({ nameTitle: name })],
          projects: [known({ codeName: 'Codeword' })],
        });

        expect(entry).toMatchObject({ action: 'link', projectId: 'p1' });
        expect(entry).not.toHaveProperty('project');
      }
    });

    it('raises the released episodes of that project when the tracks reach further', () => {
      const [raised] = plan({
        groups: [group({ maxEpisode: 7 })],
        projects: [known({ episodesReleased: 3 })],
      });
      const [enough] = plan({
        groups: [group({ maxEpisode: 3 })],
        projects: [known({ episodesReleased: 3 })],
      });
      const [film] = plan({
        groups: [group({ maxEpisode: 1 })],
        projects: [known({ titleType: ANIME_TYPE.FILM, episodesReleased: 0 })],
      });

      expect(raised.raiseTo).toBe(7);
      expect(enough).not.toHaveProperty('raiseTo');
      expect(film).not.toHaveProperty('raiseTo');
    });

    it('says when the season of the tracks is not the season of the start of the project', () => {
      const [entry] = plan({
        groups: [group()],
        projects: [known({ startDate: '2026-11-15' })],
      });

      expect(entry.note).toMatch(/season/);
    });

    it('stays out of the way when two projects carry the same name', () => {
      const [entry] = plan({
        groups: [group()],
        projects: [
          known(),
          known({ _id: 'p2', ukrName: 'Інший', romajiName: 'Wind Breaker' }),
        ],
      });

      expect(entry).toMatchObject({
        action: 'ambiguous',
        candidates: ['Вітробой', 'Інший'],
      });
    });

    it('is found once however many of its names match', () => {
      const [entry] = plan({
        groups: [group({ nameTitle: 'Same' })],
        projects: [
          known({ ukrName: 'Same', romajiName: 'same', codeName: 'SAME' }),
        ],
      });

      expect(entry.action).toBe('link');
    });
  });

  describe('a title an earlier run has moved', () => {
    const renamed = known({
      ukrName: 'Вітробій',
      romajiName: 'Kaze ga Tsuyoku',
    });

    it('is left alone after its project was renamed, though no project carries the old name', () => {
      const entries = plan({
        teamTitles: [team('Wind Breaker', undefined, 'p1')],
        groups: [group({ unlinked: 0, projectId: 'p1' })],
        projects: [renamed],
      });

      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({ action: 'moved', unlinked: 0 });
      expect(entries[0]).not.toHaveProperty('project');
    });

    it('is left alone after its project was deleted', () => {
      const entries = plan({
        teamTitles: [team('Wind Breaker', undefined, 'p1')],
        groups: [group({ unlinked: 0, projectId: 'p1' })],
      });

      expect(entries.map(({ action }) => action)).toEqual(['moved']);
    });

    it('is left alone when the old list has it with no tracks and says where it went', () => {
      const entries = plan({
        teamTitles: [team('Forgotten', '2024-06-03T10:00:00Z', 'p9')],
      });

      expect(entries.map(({ action }) => action)).toEqual(['moved']);
    });

    it('is left alone when only the tracks know it and all of them have a project', () => {
      const entries = plan({
        groups: [group({ unlinked: 0, projectId: 'p1' })],
        projects: [renamed],
      });

      expect(entries.map(({ action }) => action)).toEqual(['moved']);
    });

    it('sends a track written the old way, after a rename, to the project the title went to', () => {
      const [entry] = plan({
        teamTitles: [team('Wind Breaker', undefined, 'p1')],
        groups: [group({ tracks: 9, unlinked: 1, projectId: 'p1' })],
        projects: [renamed],
      });

      expect(entry).toMatchObject({
        action: 'link',
        projectId: 'p1',
        unlinked: 1,
      });
    });

    it('finds the project from the linked tracks when a run stopped before it marked the old list', () => {
      const [entry] = plan({
        teamTitles: [team('Wind Breaker')],
        groups: [group({ tracks: 8, unlinked: 3, projectId: 'p1' })],
        projects: [renamed],
      });

      expect(entry).toMatchObject({ action: 'link', projectId: 'p1' });
    });

    it('still links a title of the old list that no run has marked to the project that carries its name', () => {
      const [entry] = plan({
        teamTitles: [team('Wind Breaker')],
        projects: [known()],
      });

      expect(entry).toMatchObject({ action: 'link', projectId: 'p1' });
    });
  });

  it('plans nothing new when it is run again over what it made', () => {
    const first = plan({
      teamTitles: [
        team('Wind Breaker'),
        team('Forgotten', '2024-06-03T10:00:00Z'),
      ],
      groups: [group()],
    });
    const created = first.map(({ title, project }, index) => ({
      _id: `p${index}`,
      ukrName: title,
      romajiName: title,
      titleType: project?.titleType ?? ANIME_TYPE.SERIES,
      startDate: project?.startDate ?? today,
      episodesReleased: project?.episodesReleased ?? 0,
    }));
    const again = plan({
      teamTitles: [
        team('Wind Breaker', undefined, 'p0'),
        team('Forgotten', '2024-06-03T10:00:00Z', 'p1'),
      ],
      groups: [group({ unlinked: 0, projectId: 'p0' })],
      projects: created,
    });

    expect(first.every(({ action }) => action === 'create')).toBe(true);
    expect(again.every(({ action }) => action === 'moved')).toBe(true);
  });

  it('lists the titles in alphabetical order', () => {
    const titles = plan({
      teamTitles: [team('Charlie'), team('Alpha'), team('Bravo')],
    }).map(({ title }) => title);

    expect(titles).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });
});
