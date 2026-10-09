import React from 'react';
import { Activity, RefreshCw, Clock3, Timer } from 'lucide-react';
import { Trade, PullJob } from '../types/trade';

interface SummaryCardsProps {
  total: number;
  job: PullJob | null;
  isRunning: boolean;
  latestTrade?: Trade;
}

/**
 * Format timestamp into readable Indian Standard Time (IST) string
 */
const formatTimeIST = (value: string) =>
  new Date(value).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

/**
 * Summary metric cards displaying key quantitative data:
 * 1. Total trades saved in database.
 * 2. Latest pull job status.
 * 3. Expected Completion Time (positioned left of Last updated) —
 *    PERMANENTLY displays the 15-minute expected completion time (startedAt + 15 mins)
 *    and stays fixed on the interface even after job completion until a new pull is started.
 * 4. Last updated timestamp of most recent trade in IST.
 */
export const SummaryCards: React.FC<SummaryCardsProps> = ({
  total,
  job,
  isRunning,
  latestTrade,
}) => {
  const isCompleted = job?.status === 'COMPLETED';

  // Compute 15-minute expected completion timestamp that updates when a pull starts
  const getExpectedCompletionTime = () => {
    if (!job) return '—';

    const delaySeconds = job.delaySeconds && job.delaySeconds > 0 ? job.delaySeconds : 900;

    if (job.startedAt) {
      const estimated = new Date(new Date(job.startedAt).getTime() + delaySeconds * 1000);
      return formatTimeIST(estimated.toISOString());
    }

    if (job.estimatedCompletionAt) {
      return formatTimeIST(job.estimatedCompletionAt);
    }

    return '—';
  };

  return (
    <section className="cards">
      {/* 1. Total Trades Metric Card */}
      <article className="card">
        <div className="card-label">
          Total trades{' '}
          <span className="card-icon blue">
            <Activity size={17} />
          </span>
        </div>
        <strong>{total.toLocaleString('en-IN')}</strong>
        <small>Persisted records</small>
      </article>

      {/* 2. Latest Pull Status Metric Card */}
      <article className="card">
        <div className="card-label">
          Latest pull{' '}
          <span className="card-icon violet">
            <RefreshCw size={17} />
          </span>
        </div>
        <strong className="status-value">
          <i
            className={`status-dot ${
              isRunning ? 'busy' : isCompleted ? 'done' : ''
            }`}
          />
          {job?.status || 'NOT STARTED'}
        </strong>
        <small>
          {job?.jobId ? `Job ${job.jobId.slice(0, 8)}` : 'Start a pull to fetch trades'}
        </small>
      </article>

      {/* 3. Expected Completion Card (PERMANENTLY STAYING ON INTERFACE) */}
      <article className="card">
        <div className="card-label">
          Expected completion{' '}
          <span className="card-icon amber">
            <Timer size={17} />
          </span>
        </div>
        <strong className="updated">
          {getExpectedCompletionTime()}
        </strong>
        <small>Expected 15-min finish time (IST)</small>
      </article>

      {/* 4. Last Updated Timestamp Metric Card (IST) */}
      <article className="card">
        <div className="card-label">
          Last updated{' '}
          <span className="card-icon green">
            <Clock3 size={17} />
          </span>
        </div>
        <strong className="updated">
          {latestTrade ? formatTimeIST(latestTrade.timestamp) : '—'}
        </strong>
        <small>Most recent trade timestamp (IST)</small>
      </article>
    </section>
  );
};
