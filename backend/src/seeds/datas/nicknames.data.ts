import { MemberData } from '../../members/data/member.data.js';
import { MEMBER_KIND } from '../../shared/index.js';

export const nicknames: MemberData[] = [
  {
    nickname: 'Dixy',
    types: ['sound', 'dub'],
    kind: MEMBER_KIND.TEAM,
    coins: 0,
  },
  {
    nickname: 'Luthien',
    types: ['sound', 'dub', 'sub'],
    kind: MEMBER_KIND.TEAM,
    coins: 0,
  },
  {
    nickname: 'Kitsune',
    types: ['dubs'],
    kind: MEMBER_KIND.TEAM,
    coins: 0,
  },
  {
    nickname: 'Tanuki',
    types: ['dubs', 'fixers'],
    kind: MEMBER_KIND.TEAM,
    coins: 0,
  },
  {
    nickname: 'Ronin',
    types: ['editor', 'typesetter'],
    kind: MEMBER_KIND.TEAM,
    coins: 0,
  },
  {
    nickname: 'Sakura',
    types: ['director', 'releasers'],
    kind: MEMBER_KIND.GUEST,
    coins: 0,
  },
];
