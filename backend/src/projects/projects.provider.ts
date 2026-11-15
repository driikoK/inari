import { Mongoose } from 'mongoose';
import { ProjectSchema } from './schemas/index.js';

export const projectsProviders = [
  {
    provide: 'PROJECT_MODEL',
    useFactory: (mongoose: Mongoose) =>
      mongoose.model('project', ProjectSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
