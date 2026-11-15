import { MEMBER_ROLE, SEASON } from '../../shared/index.js';
import { PROPOSAL_FUNDING } from '../../proposals/enums/index.js';

interface SeedParticipant {
  userName: string;
  roles: MEMBER_ROLE[];
}

interface SeedProposal {
  ukrName: string;
  romajiName: string;
  link: string;
  isOngoing: boolean;
  isSequel: boolean;
  funding?: PROPOSAL_FUNDING;
  note?: string;
  participants: SeedParticipant[];
}

export interface SeedSeason {
  season: SEASON;
  year: number;
  proposals: SeedProposal[];
}

export const proposalSeasons: SeedSeason[] = [
  {
    season: SEASON.WINTER,
    year: 2027,
    proposals: [
      {
        ukrName: 'Кохання на кінчиках пальців',
        romajiName: 'Yubisaki to Renren',
        link: 'https://myanimelist.net/anime/55866',
        isOngoing: true,
        isSequel: false,
        funding: PROPOSAL_FUNDING.PATRON,
        participants: [
          {
            userName: 'demo_member_1',
            roles: [MEMBER_ROLE.SUB, MEMBER_ROLE.EDITOR],
          },
          { userName: 'demo_member_2', roles: [MEMBER_ROLE.DUB] },
        ],
      },
      {
        ukrName: 'Школа привидів',
        romajiName: 'Youkai Gakkou no Sensei Hajimemashita',
        link: 'https://myanimelist.net/anime/57533/Youkai_Gakkou_no_Sensei_Hajimemashita',
        isOngoing: true,
        isSequel: true,
        participants: [
          { userName: 'demo_director', roles: [MEMBER_ROLE.DIRECTOR] },
        ],
      },
      {
        ukrName: 'Гуртожиток вампірів',
        romajiName: 'Vampire Dormitory',
        link: 'https://myanimelist.net/anime/57031',
        isOngoing: false,
        isSequel: false,
        funding: PROPOSAL_FUNDING.ORDER,
        note: 'Замовлення від спонсорів',
        participants: [],
      },
    ],
  },
  {
    season: SEASON.SPRING,
    year: 2027,
    proposals: [
      {
        ukrName: 'Синій архів',
        romajiName: 'Blue Archive',
        link: 'https://myanimelist.net/anime/54309',
        isOngoing: true,
        isSequel: false,
        participants: [
          {
            userName: 'demo_member_1',
            roles: [MEMBER_ROLE.SOUND, MEMBER_ROLE.RELEASER],
          },
        ],
      },
    ],
  },
];
