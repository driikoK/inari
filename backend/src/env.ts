// Load `.env` before anything else reads process.env. Import this module first.
// Variables already set in the environment win over the file, and a missing
// file is fine (production usually sets real environment variables).
try {
  process.loadEnvFile();
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}
