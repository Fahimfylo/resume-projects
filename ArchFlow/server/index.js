import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { recoverStaleJobs } from './services/analysis/queue.js';

async function start() {
  await connectDB();
  // Fail jobs orphaned by a previous server crash/restart so projects are not
  // stuck in "analyzing" (and clients not stuck on "Analyzing codebase").
  await recoverStaleJobs();

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`[server] ArchFlow API listening on http://localhost:${env.PORT}`);
  });
}

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
