import { Router } from 'express';
import * as projService from '../services/projectService.js';
import { enqueueAnalysis, getJobSnapshot, STALE_JOB_MS } from '../services/analysis/queue.js';
import { AnalysisJob } from '../models/AnalysisJob.js';
import { AppError } from '../middleware/error.js';

const router = Router();

router.post('/projects/:id/analyze', async (req, res, next) => {
  try {
    const proj = await projService.getProject(req.params.id, req.ownerId);
    if (proj.status === 'analyzing') {
      throw new AppError('Analysis already in progress', 'BUSY', 409);
    }
    // Analysis runs in the background and persists progress to the DB, so the
    // client can poll /analysis/status while (or after) it completes.
    const job = await enqueueAnalysis(proj._id);
    console.log(`[analyze] project ${proj._id} "${proj.name}" analysis started → job ${job._id} ${job.status}`);
    res.status(202).json({ jobId: String(job._id), status: job.status });
  } catch (e) {
    next(e);
  }
});

router.get('/projects/:id/analysis/status', async (req, res, next) => {
  try {
    await projService.getProject(req.params.id, req.ownerId);
    const latest = await AnalysisJob.findOne({ projectId: req.params.id }).sort({ createdAt: -1 });
    if (!latest) {
      return res.json({ status: 'idle', progress: 0, currentStep: 'idle', error: null });
    }
    const snap = await getJobSnapshot(String(latest._id));
    const status = snap?.status || latest.status;

    // A busy job that has stopped updating (e.g. the server crashed or was
    // restarted mid-analysis) must not leave the UI stuck forever.
    const isActive = ['queued', 'running'].includes(status);
    const lastUpdate = latest.updatedAt ? new Date(latest.updatedAt).getTime() : Date.now();
    if (isActive && Date.now() - lastUpdate > STALE_JOB_MS) {
      return res.json({
        jobId: String(latest._id),
        status: 'failed',
        progress: snap?.progress ?? latest.progress ?? 0,
        currentStep: 'interrupted',
        error: 'Analysis stopped making progress and may have been interrupted. Please re-run analysis.',
      });
    }

    res.json({
      jobId: String(latest._id),
      status,
      progress: snap?.progress ?? latest.progress ?? 0,
      currentStep: snap?.currentStep ?? latest.currentStep ?? '',
      error: snap?.error ?? latest.error ?? null,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
