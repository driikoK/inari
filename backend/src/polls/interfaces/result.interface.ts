import { ROLES_ON_VOTE } from '../enums';

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
