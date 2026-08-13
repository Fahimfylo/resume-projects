import { AnalysisJob } from '../../models/AnalysisJob.js';
import { Project } from '../../models/Project.js';
import { runAnalysis } from './pipeline.js';

// A busy job that has not been updated for this long is considered orphaned
// (e.g. the server process crashed or was restarted mid-analysis). It is
// surfaced as failed so the client overlay never sits on "Analyzing codebase"
// forever.
export const STALE_JOB_MS = 10 * 60 * 1000;

const ACTIVE_STATUSES = ['queued', 'running'];

export async function enqueueAnalysis(projectId) {
  const job = await AnalysisJob.create({
    projectId,
    status: 'queued',
    progress: 0,
    currentStep: 'queued',
  });

  await Project.updateOne({ _id: projectId }, { $set: { status: 'analyzing' } });

  runInBackground(projectId, job._id);

  return { _id: job._id, status: 'queued', progress: 0, currentStep: 'queued' };
}

function runInBackground(projectId, jobId) {
  const startedAt = Date.now();

  const onProgress = async (progress, currentStep) => {
    console.log(`[analysis] job ${jobId} ${progress}% — ${currentStep}`);
    await AnalysisJob.updateOne({ _id: jobId }, { $set: { progress, currentStep } }).catch(() => {});
  };

  runAnalysis(projectId, onProgress)
    .then(async (result) => {
      await AnalysisJob.updateOne(
        { _id: jobId },
        { $set: { status: 'completed', progress: 100, currentStep: 'completed', finishedAt: new Date(), error: null } }
      );
      await Project.updateOne({ _id: projectId }, { $set: { status: 'ready' } });
      console.log(
        `[analysis] job ${jobId} COMPLETED in ${Date.now() - startedAt}ms — nodes: ${result.nodeCount}, edges: ${result.edgeCount}, modules: ${result.moduleCount}`
      );
    })
    .catch(async (err) => {
      const message = err?.message || 'Analysis failed';
      await AnalysisJob.updateOne(
        { _id: jobId },
        { $set: { status: 'failed', finishedAt: new Date(), error: message } }
      );
      await Project.updateOne({ _id: projectId }, { $set: { status: 'failed' } });
      console.error(`[analysis] job ${jobId} FAILED for project ${projectId}: ${message}`);
    });
}

export async function getJobSnapshot(jobId) {
  const job = await AnalysisJob.findById(jobId).lean();
  if (!job) return null;
  return {
    status: job.status,
    progress: job.progress ?? 0,
    currentStep: job.currentStep ?? '',
    error: job.error ?? null,
  };
}

export async function recoverStaleJobs() {
  const stale = await AnalysisJob.find({ status: { $in: ACTIVE_STATUSES } });
  if (!stale.length) return 0;

  await AnalysisJob.updateMany(
    { status: { $in: ACTIVE_STATUSES } },
    {
      $set: {
        status: 'failed',
        finishedAt: new Date(),
        error: 'Server restarted before analysis completed — please re-run analysis.',
      },
    }
  );

  await Project.updateMany(
    { _id: { $in: stale.map((j) => j.projectId) }, status: 'analyzing' },
    { $set: { status: 'ready' } }
  );

  console.log(`[analysis] recovered ${stale.length} stale job(s) from a previous server run`);
  return stale.length;
}
