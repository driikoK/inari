import { Mongoose } from 'mongoose';
import { ProposalSchema, ProposalSeasonSchema } from './schemas/index.js';

export const proposalsProviders = [
  {
    provide: 'PROPOSAL_SEASON_MODEL',
    useFactory: (mongoose: Mongoose) =>
      mongoose.model('proposal_season', ProposalSeasonSchema),
    inject: ['DATABASE_CONNECTION'],
  },
  {
    provide: 'PROPOSAL_MODEL',
    useFactory: (mongoose: Mongoose) =>
      mongoose.model('proposal', ProposalSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
