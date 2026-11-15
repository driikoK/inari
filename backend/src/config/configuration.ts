const configuration = () => ({
  app: {
    port: Number(process.env.PORT) || 8000,
    cors: process.env.CORS,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET_KEY,
  },
  mongo: {
    user: process.env.MONGO_USERNAME,
    password: process.env.MONGO_PASSWORD,
    dbName: process.env.MONGO_DATABASE || 'test',
    port: parseInt(process.env.MONGO_PORT, 10) || 27017,
    host: process.env.MONGO_HOST || 'localhost',
  },
  mailer: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASS,
  },
  seed: {
    rootPassword: process.env.ROOT_PASSWORD,
    rootEmail: process.env.ROOT_EMAIL || 'root@inari.local',
    userPassword: process.env.SEED_USER_PASSWORD,
  },
});

export default configuration;

export type AppConfig = ReturnType<typeof configuration>;
