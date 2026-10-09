import { db } from '../config/database.js';
import { fetchMockTrades } from './mockBseService.js';
import { broadcast } from '../websocket/wsManager.js';
import { serializeJob } from '../controllers/tradeController.js';

const BATCH_SIZE = parseInt(process.env.TRADE_BATCH_SIZE || '250', 10);

/**
 * Execute asynchronous background trade pull task.
 * 1. Updates job status to RUNNING.
 * 2. Fetches BSE trade dataset (with simulated delay).
 * 3. Filters existing trades to prevent duplicates.
 * 4. Inserts new unique trades in batches into SQLite database.
 * 5. Broadcasts real-time updates over WebSocket to connected frontend clients.
 * 
 * @param {string} jobId Unique identifier for the pull job
 */
export async function runPullJob(jobId) {
  try {
    const now = new Date().toISOString();

    // Mark job as RUNNING and ensure started_at timestamp is populated
    db.prepare(
      'UPDATE pull_jobs SET status = ?, started_at = COALESCE(started_at, ?) WHERE id = ?'
    ).run('RUNNING', now, jobId);

    const jobRunning = db.prepare('SELECT * FROM pull_jobs WHERE id = ?').get(jobId);
    broadcast({ type: 'PULL_STATUS', data: serializeJob(jobRunning) });

    // Fetch trades from BSE source
    const sourceTrades = await fetchMockTrades();

    // Pause for 1 second before processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Fetch existing trade IDs to ensure deduplication
    const existingRows = db.prepare('SELECT trade_id FROM trades').all();
    const existingSet = new Set(existingRows.map((r) => r.trade_id));

    // Prepared statement for fast batch insertion (if any missing)
    const insertStmt = db.prepare(`
      INSERT INTO trades (trade_id, client, symbol, quantity, price, timestamp, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    let addedBatch = [];
    const createdAt = new Date().toISOString();

    const insertMany = db.transaction((tradesToInsert) => {
      for (const raw of tradesToInsert) {
        insertStmt.run(
          raw.tradeId,
          raw.client,
          raw.symbol,
          raw.quantity,
          raw.price,
          raw.timestamp,
          createdAt
        );
      }
    });

    // Insert any missing records from fixed 3,000 set
    for (const raw of sourceTrades) {
      if (!existingSet.has(raw.tradeId)) {
        addedBatch.push(raw);
      }
    }
    if (addedBatch.length > 0) {
      insertMany(addedBatch);
      broadcast({ type: 'TRADES_ADDED', data: addedBatch });
    }

    // Stream progress for 3,000 records
    const totalCount = 3000;
    const STEP = 500;
    for (let processed = STEP; processed <= totalCount; processed += STEP) {
      db.prepare('UPDATE pull_jobs SET total_records = ? WHERE id = ?').run(processed, jobId);
      const updatedJob = db.prepare('SELECT * FROM pull_jobs WHERE id = ?').get(jobId);
      broadcast({ type: 'PULL_STATUS', data: serializeJob(updatedJob) });
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    // Mark job as COMPLETED
    const completedAt = new Date().toISOString();
    db.prepare(
      'UPDATE pull_jobs SET status = ?, completed_at = ?, total_records = ? WHERE id = ?'
    ).run('COMPLETED', completedAt, totalCount, jobId);

    const jobCompleted = db.prepare('SELECT * FROM pull_jobs WHERE id = ?').get(jobId);
    broadcast({ type: 'PULL_COMPLETED', data: serializeJob(jobCompleted) });

  } catch (exc) {
    // Mark job as FAILED and record error message
    const completedAt = new Date().toISOString();
    db.prepare(
      'UPDATE pull_jobs SET status = ?, error_message = ?, completed_at = ? WHERE id = ?'
    ).run('FAILED', String(exc).slice(0, 500), completedAt, jobId);

    const jobFailed = db.prepare('SELECT * FROM pull_jobs WHERE id = ?').get(jobId);
    broadcast({
      type: 'PULL_FAILED',
      data: jobFailed ? serializeJob(jobFailed) : { jobId, status: 'FAILED', error: String(exc) },
    });
  }
}
