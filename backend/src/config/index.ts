import * as dotenv from 'dotenv';

dotenv.config();

// export enviroments
export default {
  postgres: {
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    db: process.env.POSTGRES_DB,
  },
  mongo: {
    user: process.env.MONGO_USERNAME,
    password: process.env.MONGO_PASSWORD,
    dbName: process.env.MONGO_DATABASE || 'test',
    port: parseInt(process.env.MONGO_PORT) || '27017',
    host: process.env.MONGO_HOST || 'localhost',
  },
  cors: process.env.CORS,
  coinsPass: process.env.COINS_PASSWORD,
};
