import crypto from 'node:crypto';
import { db } from '../config/database.js';
import { fetchMockTrades } from '../services/mockBseService.js';
import { runPullJob } from '../services/pullJobWorker.js';
import { broadcast } from '../websocket/wsManager.js';

/**
 * Format raw database trade row to API camelCase representation
 */
export function serializeTrade(t) {
  return {
    tradeId: t.trade_id,
    client: t.client,
    symbol: t.symbol,
    quantity: t.quantity,
    price: t.price,
    timestamp: t.timestamp,
  };
}

/**
 * Format raw database pull job row to API camelCase representation
 */
export function serializeJob(j) {
  const envDelay = parseFloat(process.env.BSE_API_DELAY_SECONDS || '');
  const delaySeconds = (!isNaN(envDelay) && envDelay > 0) ? envDelay : 900;
  let estimatedCompletionAt = null;
  if (j.started_at) {
    estimatedCompletionAt = new Date(new Date(j.started_at).getTime() + delaySeconds * 1000).toISOString();
  }
  return {
    jobId: j.id,
    status: j.status,
    startedAt: j.started_at || null,
    completedAt: j.completed_at || null,
    estimatedCompletionAt,
    delaySeconds,
    totalRecords: j.total_records || 0,
    error: j.error_message || null,
  };
}

/**
 * GET /health - Server health check endpoint
 */
export function getHealthStatus(req, res) {
  res.json({ status: 'ok' });
}

/**
 * GET /getTrades - Direct Mock BSE Exchange Endpoint
 * Simulates external exchange data feed (3,000 seeded trades)
 */
export async function getDirectMockTrades(req, res) {
  const trades = await fetchMockTrades();
  res.json({ trades, total: trades.length });
}

/**
 * GET /api/trades - Fetch persisted trade records from SQLite
 * Supports limit and offset pagination parameters
 */
export function getPersistedTrades(req, res) {
  const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
  const offset = parseInt(req.query.offset || '0', 10);

  const countRow = db.prepare('SELECT COUNT(*) as total FROM trades').get();
  const items = db
    .prepare('SELECT * FROM trades ORDER BY timestamp DESC, id DESC LIMIT ? OFFSET ?')
    .all(limit, offset);

  res.json({
    trades: items.map(serializeTrade),
    total: countRow.total,
  });
}

/**
 * GET /api/pulls - Get recent pull job history
 */
export function getPullJobs(req, res) {
  const jobs = db
    .prepare('SELECT * FROM pull_jobs ORDER BY created_at DESC LIMIT 20')
    .all();
  res.json({ jobs: jobs.map(serializeJob) });
}

/**
 * GET /api/pulls/:jobId - Get specific pull job status
 */
export function getPullJobById(req, res) {
  const job = db
    .prepare('SELECT * FROM pull_jobs WHERE id = ?')
    .get(req.params.jobId);
    
  if (!job) {
    return res.status(404).json({ error: 'Pull not found' });
  }
  res.json(serializeJob(job));
}

/**
 * POST /api/pulls - Trigger a background trade pull job
 * Returns HTTP 202 Accepted status immediately without blocking
 */
export function createPullJob(req, res) {
  const jobId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Create RUNNING job in database initially
  db.prepare(
    'INSERT INTO pull_jobs (id, status, started_at, completed_at, total_records, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(jobId, 'RUNNING', now, null, 0, now);

  const job = db.prepare('SELECT * FROM pull_jobs WHERE id = ?').get(jobId);
  const result = serializeJob(job);

  // Notify connected dashboards over WebSocket that pull job has started
  broadcast({ type: 'PULL_STARTED', data: result });

  // Trigger background job execution asynchronously (non-blocking)
  setImmediate(() => runPullJob(jobId));

  // Return HTTP 202 immediately
  res.status(202).json(result);
}

/**
 * DELETE /api/pulls/:jobId - Delete or cancel a pull job
 */
export function deletePullJob(req, res) {
  const { jobId } = req.params;
  db.prepare('DELETE FROM pull_jobs WHERE id = ?').run(jobId);
  broadcast({ type: 'PULL_CANCELLED', data: { jobId } });
  res.json({ success: true, jobId });
}

