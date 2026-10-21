import { parseArgs } from 'node:util';
import { NestFactory } from '@nestjs/core';
import mongoose from 'mongoose';
import { AppModule } from './app.module.js';
import { SeedCommand } from './seeds/seed.command.js';

type Command = {
  describe: string;
  run: (seed: SeedCommand) => Promise<void>;
};

const commands: Record<string, Command> = {
  'seed:all': {
    describe: 'run every seed in dependency order',
    run: (seed) => seed.all(),
  },
  'seed:root': {
    describe: 'create root admin user (ROOT_PASSWORD, ROOT_EMAIL from env)',
    run: (seed) => seed.root(),
  },
  'seed:users': {
    describe: 'create demo users (SEED_USER_PASSWORD from env)',
    run: (seed) => seed.users(),
  },
  'seed:nicknames': {
    describe: 'create nicknames',
    run: (seed) => seed.nicknames(),
  },
  'seed:anime': {
    describe: 'create anime',
    run: (seed) => seed.anime(),
  },
  'seed:team-animes': {
    describe: 'create team animes',
    run: (seed) => seed.teamAnimes(),
  },
  'seed:votes': {
    describe: 'create demo votes for ongoing anime (needs seed:anime)',
    run: (seed) => seed.votes(),
  },
  'seed:tracks': {
    describe: 'create demo tracks (needs seed:root and seed:nicknames)',
    run: (seed) => seed.tracks(),
  },
  'seed:clear': {
    describe: 'clear lists',
    run: (seed) => seed.clear(),
  },
};

const printUsage = () => {
  console.log('Usage: node dist/cli.js <command>\n');
  for (const [name, { describe }] of Object.entries(commands)) {
    console.log(`  ${name.padEnd(18)}${describe}`);
  }
};

const {
  positionals: [name],
} = parseArgs({ allowPositionals: true });
const command = name ? commands[name] : undefined;

if (!command) {
  printUsage();
  process.exit(name ? 1 : 0);
}

// Creating the context waits for async providers, including the database connection
const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ['error'],
});

let exitCode = 0;
try {
  await command.run(app.get(SeedCommand, { strict: false }));
} catch (error) {
  console.error(error);
  exitCode = 1;
} finally {
  await app.close();
  await mongoose.disconnect();
}

process.exit(exitCode);
