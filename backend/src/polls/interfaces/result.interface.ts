import { ROLES_ON_VOTE } from '../enums/index.js';

interface Vote {
  userName: string;
  roles: ROLES_ON_VOTE[];
}

export interface Result {
  animeId: string;
  animeName: string;
  totalVotes: number;
  votes: Vote[];
}
