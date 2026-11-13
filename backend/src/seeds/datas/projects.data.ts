import { PROPOSAL_FUNDING } from '../../proposals/enums/index.js';
import { ANIME_TYPE, MEMBER_ROLE } from '../../shared/index.js';
import type { ProjectParticipant } from '../../projects/interfaces/index.js';
import {
  seasonOrdinal,
  seasonStartDay,
  shiftDays,
} from '../../projects/layout.js';

export interface SeedProject {
  ukrName: string;
  romajiName: string;
  codeName?: string;
  link: string;
  posterUrl?: string;
  titleType: ANIME_TYPE;
  isOngoing: boolean;
  isSequel: boolean;
  funding?: PROPOSAL_FUNDING;
  startDate: string;
  episodesReleased: number;
  participants: ProjectParticipant[];
  finish?: { endDate: string; isInTime: boolean };
}

const seasonStart = (today: string, seasonsBack: number) =>
  seasonStartDay(seasonOrdinal(today) - seasonsBack);

export const projectSeeds = (today: string): SeedProject[] => {
  const thisSeason = seasonStart(today, 0);
  const lastSeason = shiftDays(seasonStart(today, 1), 10);
  const seasonBeforeLast = seasonStart(today, 2);

  return [
    {
      ukrName: 'Вітробой',
      romajiName: 'Wind Breaker',
      codeName: 'wind',
      link: 'https://myanimelist.net/anime/54900/Wind_Breaker',
      posterUrl: 'https://cdn.myanimelist.net/images/anime/1438/141816.jpg',
      titleType: ANIME_TYPE.SERIES,
      isOngoing: true,
      isSequel: false,
      funding: PROPOSAL_FUNDING.PATRON,
      startDate: thisSeason,
      episodesReleased: 4,
      participants: [
        { nickname: 'Dixy', roles: [MEMBER_ROLE.SUB, MEMBER_ROLE.EDITOR] },
        { nickname: 'Kitsune', roles: [MEMBER_ROLE.DUB] },
        { nickname: 'Ronin', roles: [MEMBER_ROLE.TYPESETTER] },
      ],
    },
    {
      ukrName: 'Космічний нотатник',
      romajiName: 'Astro Note',
      link: 'https://myanimelist.net/anime/57391/Astro_Note',
      posterUrl: 'https://cdn.myanimelist.net/images/anime/1606/145126.jpg',
      titleType: ANIME_TYPE.SERIES,
      isOngoing: false,
      isSequel: true,
      startDate: thisSeason,
      episodesReleased: 7,
      participants: [
        { nickname: 'Luthien', roles: [MEMBER_ROLE.SUB, MEMBER_ROLE.SOUND] },
        { nickname: 'Tanuki', roles: [MEMBER_ROLE.DUB, MEMBER_ROLE.FIXER] },
      ],
    },
    {
      ukrName: 'Країна пісків',
      romajiName: 'Sand Land',
      link: 'https://myanimelist.net/anime/53882/Sand_Land',
      titleType: ANIME_TYPE.FILM,
      isOngoing: true,
      isSequel: false,
      funding: PROPOSAL_FUNDING.ORDER,
      startDate: thisSeason,
      episodesReleased: 0,
      participants: [{ nickname: 'Sakura', roles: [MEMBER_ROLE.DIRECTOR] }],
    },
    {
      ukrName: 'Повість про дім Тайра',
      romajiName: 'Heike Monogatari',
      link: 'https://myanimelist.net/anime/49738/Heike_Monogatari',
      titleType: ANIME_TYPE.SHORT_FILM,
      isOngoing: true,
      isSequel: false,
      startDate: thisSeason,
      episodesReleased: 0,
      participants: [{ nickname: 'Dixy', roles: [MEMBER_ROLE.SOUND] }],
      finish: { endDate: today, isInTime: false },
    },
    {
      ukrName: 'Вовчиця і купець',
      romajiName: 'Merchant Meets the Wise Wolf',
      codeName: 'wolf',
      link: 'https://myanimelist.net/anime/51122/Ookami_to_Koushinryou__Merchant_Meets_the_Wise_Wolf',
      posterUrl: 'https://cdn.myanimelist.net/images/anime/1792/136743.jpg',
      titleType: ANIME_TYPE.SERIES,
      isOngoing: true,
      isSequel: false,
      startDate: lastSeason,
      episodesReleased: 9,
      participants: [
        { nickname: 'Luthien', roles: [MEMBER_ROLE.SUB, MEMBER_ROLE.DUB] },
        { nickname: 'Ronin', roles: [MEMBER_ROLE.EDITOR] },
      ],
    },
    {
      ukrName: 'Вигнані ворони',
      romajiName: 'Karasu wa Aruji wo Erabanai',
      link: 'https://myanimelist.net/anime/56980/Karasu_wa_Aruji_wo_Erabanai',
      titleType: ANIME_TYPE.SERIES,
      isOngoing: true,
      isSequel: false,
      startDate: lastSeason,
      episodesReleased: 20,
      participants: [{ nickname: 'Kitsune', roles: [MEMBER_ROLE.DUB] }],
      finish: { endDate: thisSeason, isInTime: true },
    },
    {
      ukrName: 'Побачення з життям V',
      romajiName: 'Date A Live V',
      link: 'https://myanimelist.net/anime/52196/Date_A_Live_V',
      titleType: ANIME_TYPE.SERIES,
      isOngoing: true,
      isSequel: true,
      funding: PROPOSAL_FUNDING.PATRON,
      startDate: seasonBeforeLast,
      episodesReleased: 12,
      participants: [
        { nickname: 'Tanuki', roles: [MEMBER_ROLE.DUB] },
        { nickname: 'Sakura', roles: [MEMBER_ROLE.RELEASER] },
      ],
      finish: {
        endDate: shiftDays(seasonStart(today, 1), -1),
        isInTime: false,
      },
    },
    {
      ukrName: 'Синій архів',
      romajiName: 'Blue Archive',
      link: 'https://myanimelist.net/anime/54233/Blue_Archive_the_Animation',
      titleType: ANIME_TYPE.SERIES,
      isOngoing: false,
      isSequel: false,
      startDate: thisSeason,
      episodesReleased: 1,
      participants: [{ nickname: 'Luthien', roles: [MEMBER_ROLE.SUB] }],
    },
  ];
};
