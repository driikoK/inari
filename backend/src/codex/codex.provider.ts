import { Mongoose } from 'mongoose';
import { CodexSchema } from './schemas/codex.schema.js';

export const codexProviders = [
  {
    provide: 'CODEX_MODEL',
    useFactory: (mongoose: Mongoose) =>
      mongoose.model('Codex', CodexSchema, 'codex'),
    inject: ['DATABASE_CONNECTION'],
  },
];
