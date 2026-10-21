import '../env.js';

export default {
  port: Number(process.env.PORT) || 8000,
  mongo: {
    user: process.env.MONGO_USERNAME,
    password: process.env.MONGO_PASSWORD,
    dbName: process.env.MONGO_DATABASE || 'test',
    port: parseInt(process.env.MONGO_PORT) || '27017',
    host: process.env.MONGO_HOST || 'localhost',
  },
  cors: process.env.CORS,
};
