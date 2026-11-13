import { parseArgs } from 'node:util';
import { NestFactory } from '@nestjs/core';
import mongoose from 'mongoose';
import { AppModule } from './app.module.js';
import { SeedCommand } from './seeds/seed.command.js';

type Command = {
  describe: string;
  // Only a command that can show what it would do accepts --dry-run
  dryRun?: true;
  run: (seed: SeedCommand, options: { dryRun: boolean }) => Promise<void>;
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
  'seed:proposals': {
    describe: 'create demo seasons with proposals and participants',
    run: (seed) => seed.proposals(),
  },
  'seed:projects': {
    describe: 'create demo projects over the last three seasons',
    run: (seed) => seed.projects(),
  },
  'seed:tracks': {
    describe: 'create demo tracks (needs seed:root and seed:nicknames)',
    run: (seed) => seed.tracks(),
  },
  'seed:budget': {
    describe: 'add demo incomes over the last three seasons (journal empty)',
    run: (seed) => seed.budget(),
  },
  'migrate:titles': {
    describe:
      'turn team_animes and the titles of the tracks into projects (--dry-run only shows the plan)',
    dryRun: true,
    run: (seed, { dryRun }) => seed.migrateTitles(dryRun),
  },
  'drop:polls': {
    describe: 'drop the collections of the removed voting (votes, poll_animes)',
    run: (seed) => seed.dropPolls(),
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
  values,
} = parseArgs({
  allowPositionals: true,
  options: { 'dry-run': { type: 'boolean', default: false } },
});
const command = name ? commands[name] : undefined;

if (!command) {
  printUsage();
  process.exit(name ? 1 : 0);
}

// A flag that is ignored would let a command that changes data run when the
// operator only meant to look
if (values['dry-run'] && !command.dryRun) {
  console.error(`${name} does not take --dry-run, nothing was done`);
  process.exit(1);
}

// Creating the context waits for async providers, including the database connection
const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ['error'],
});

let exitCode = 0;
try {
  await command.run(app.get(SeedCommand, { strict: false }), {
    dryRun: values['dry-run'] === true,
  });
} catch (error) {
  console.error(error);
  exitCode = 1;
} finally {
  await app.close();
  await mongoose.disconnect();
}

process.exit(exitCode);
