import { Router } from 'express';
import {
  getHealthStatus,
  getDirectMockTrades,
  getPersistedTrades,
  getPullJobs,
  getPullJobById,
  createPullJob,
  deletePullJob,
} from '../controllers/tradeController.js';

const router = Router();

// Health check route
router.get('/health', getHealthStatus);

// Mock BSE API endpoint
router.get('/getTrades', getDirectMockTrades);

// Core Dashboard API routes
router.get('/api/trades', getPersistedTrades);
router.get('/api/pulls', getPullJobs);
router.get('/api/pulls/:jobId', getPullJobById);
router.post('/api/pulls', createPullJob);
router.delete('/api/pulls/:jobId', deletePullJob);

export default router;
