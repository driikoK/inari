import { Document, Types } from 'mongoose';
import { ROLES_ON_VOTE } from '../enums';

interface AnimeRole {
  animeId: Types.ObjectId;
  roles: ROLES_ON_VOTE[];
}

export interface Vote extends Document {
  userName: string;
  votes: AnimeRole[];
}
