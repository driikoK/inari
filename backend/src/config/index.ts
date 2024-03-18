import * as dotenv from 'dotenv';

dotenv.config();

// export enviroments
export default {
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  db: process.env.POSTGRES_DB,
  dbString: process.env.POSTGRES_CONNECTION_STRING,
  cors: process.env.CORS,
  apiKey: process.env.API_KEY,
};
