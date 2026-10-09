import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve directory paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

// SQLite database connection
const dbPath = path.join(ROOT, 'trades.db');
export const db = new Database(dbPath);

/**
 * Initialize SQLite database tables for trades and background pull jobs.
 * This runs automatically at server startup.
 */
export function initDatabase() {
  db.exec(`
    -- Stores unique trade records ingested from BSE feed
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trade_id TEXT UNIQUE,
      client TEXT,
      symbol TEXT,
      quantity INTEGER,
      price REAL,
      timestamp TEXT,
      created_at TEXT
    );

    -- Tracks asynchronous pull job status (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED)
    CREATE TABLE IF NOT EXISTS pull_jobs (
      id TEXT PRIMARY KEY,
      status TEXT DEFAULT 'PENDING',
      started_at TEXT,
      completed_at TEXT,
      total_records INTEGER DEFAULT 0,
      error_message TEXT,
      created_at TEXT
    );
  `);

  // Clean up orphan RUNNING/PENDING jobs on server startup
  db.prepare(
    "UPDATE pull_jobs SET status = 'CANCELLED', error_message = 'Server restarted' WHERE status = 'RUNNING' OR status = 'PENDING'"
  ).run();
}
